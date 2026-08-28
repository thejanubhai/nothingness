'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Using raw fetch for OpenAI to avoid additional dependencies while maintaining strict types
const OPENAI_API_KEY = process.env.OPENAI_API_KEY

async function getEmbedding(text: string): Promise<number[]> {
  if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is not set')

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      input: text,
      model: 'text-embedding-3-small',
    }),
  })

  if (!response.ok) {
    throw new Error(`OpenAI Embedding API error: ${response.statusText}`)
  }

  const data = await response.json()
  return data.data[0].embedding
}

export async function trainAI(query: string, idealResponse: string) {
  try {
    const supabase = await createClient()

    // 1. Generate embedding
    const embedding = await getEmbedding(`Q: ${query}\nA: ${idealResponse}`)

    // 2. Insert into ai_knowledge_base
    const { error } = await supabase.from('ai_knowledge_base').insert({
      query,
      ideal_response: idealResponse,
      embedding,
    })

    if (error) throw error

    revalidatePath('/dashboard/ai')
    return { success: true }
  } catch (error: any) {
    console.error('Error training AI:', error)
    return { success: false, error: error.message }
  }
}

export async function updateAISettings(prompt: string, temperature: number) {
  try {
    const supabase = await createClient()
    
    // Assuming a single row for settings
    const { data: existing } = await supabase.from('ai_settings').select('id').limit(1).single()
    
    let error;
    if (existing) {
      const res = await supabase.from('ai_settings').update({
        active_prompt: prompt,
        temperature,
        updated_at: new Date().toISOString()
      }).eq('id', existing.id)
      error = res.error
    } else {
      const res = await supabase.from('ai_settings').insert({
        active_prompt: prompt,
        temperature
      })
      error = res.error
    }

    if (error) throw error

    revalidatePath('/dashboard/ai')
    return { success: true }
  } catch (error: any) {
    console.error('Error updating AI settings:', error)
    return { success: false, error: error.message }
  }
}

export async function generateReply(message: string, conversationId: string) {
  try {
    const supabase = await createClient()
    
    // 1. Fetch AI Settings
    const { data: settings } = await supabase.from('ai_settings').select('*').limit(1).single()
    const activePrompt = settings?.active_prompt || 'You are a helpful AI assistant.'
    const temperature = settings?.temperature || 0.7

    // 2. RAG - Find relevant knowledge
    const embedding = await getEmbedding(message)
    const { data: knowledge } = await supabase.rpc('match_knowledge', {
      query_embedding: embedding,
      match_threshold: 0.75,
      match_count: 3
    })

    const knowledgeContext = knowledge?.length 
      ? `\n\nRelevant past interactions:\n${knowledge.map((k: any) => `Q: ${k.query}\nA: ${k.ideal_response}`).join('\n\n')}`
      : ''

    // 3. Generate LLM Reply with Tools
    const systemPrompt = `${activePrompt}${knowledgeContext}`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'check_availability',
              description: 'Check if a listing is available for given dates',
              parameters: {
                type: 'object',
                properties: {
                  listingName: { type: 'string', description: 'Name of the listing' },
                  checkIn: { type: 'string', description: 'Check-in date (YYYY-MM-DD)' },
                  checkOut: { type: 'string', description: 'Check-out date (YYYY-MM-DD)' }
                },
                required: ['listingName', 'checkIn', 'checkOut']
              }
            }
          },
          {
            type: 'function',
            function: {
              name: 'escalate_to_human',
              description: 'Escalate the conversation to a human agent',
              parameters: {
                type: 'object',
                properties: {
                  reason: { type: 'string', description: 'Reason for escalation' }
                },
                required: ['reason']
              }
            }
          }
        ]
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const data = await response.json()
    const choice = data.choices[0]
    
    // Handle Tool Calls
    if (choice.message.tool_calls) {
      for (const toolCall of choice.message.tool_calls) {
        if (toolCall.function.name === 'escalate_to_human') {
          // Update conversation to human override
          await supabase.from('conversations').update({ human_override: true }).eq('id', conversationId)
          
          await supabase.from('messages').insert({
            conversation_id: conversationId,
            sender_type: 'ai',
            content: "I have escalated this conversation to a human agent. They will be with you shortly.",
            raw_payload: choice.message
          })
          
          return { success: true, reply: "Escalated to human." }
        } else if (toolCall.function.name === 'check_availability') {
          const args = JSON.parse(toolCall.function.arguments)
          
          // Actually query the bookings table
          const { data: listings } = await supabase
            .from('listings')
            .select('id, name')
            .ilike('name', `%${args.listingName}%`)
            .limit(1)
            
          let reply = `I couldn't find a listing matching "${args.listingName}".`
          
          if (listings && listings.length > 0) {
            const listing = listings[0]
            const { data: conflicts } = await supabase
              .from('bookings')
              .select('id')
              .eq('listing_id', listing.id)
              .in('status', ['confirmed', 'blocked'])
              .or(`and(check_in.lte.${args.checkOut},check_out.gte.${args.checkIn})`)
              
            if (conflicts && conflicts.length > 0) {
              reply = `Sorry, ${listing.name} is not available from ${args.checkIn} to ${args.checkOut}.`
            } else {
              reply = `Great news! ${listing.name} is available from ${args.checkIn} to ${args.checkOut}.`
            }
          }
          
          await supabase.from('messages').insert({
            conversation_id: conversationId,
            sender_type: 'ai',
            content: reply,
            raw_payload: choice.message
          })
          
          return { success: true, reply }
        }
      }
    }

    // Standard Reply
    const replyContent = choice.message.content
    
    if (replyContent) {
      await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_type: 'ai',
        content: replyContent,
        raw_payload: choice.message
      })
    }

    return { success: true, reply: replyContent }
  } catch (error: any) {
    console.error('Error generating reply:', error)
    return { success: false, error: error.message }
  }
}

export async function testGeminiPrompt(systemPrompt: string, testMessage: string, temperature: number = 0.7) {
  try {
    // 1. Try NVIDIA AI first
    try {
      const { callNvidiaChat, NVIDIA_MODELS } = await import('@/lib/ai/nvidia');
      const nvidiaRes = await callNvidiaChat({
        model: NVIDIA_MODELS.CONCIERGE_POWER,
        messages: [
          { role: 'system', content: `SYSTEM DIRECTIVE:\n${systemPrompt}` },
          { role: 'user', content: testMessage }
        ],
        temperature,
      });

      if (nvidiaRes.success && nvidiaRes.content) {
        return { success: true, reply: nvidiaRes.content };
      }
    } catch (nvidiaErr) {
      console.warn('NVIDIA test prompt warning, falling back to Gemini:', nvidiaErr);
    }

    // 2. Fallback to Gemini
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return { success: false, error: 'No AI API Key (NVIDIA or Gemini) is configured in environment.' };
    }

    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: `SYSTEM DIRECTIVE:\n${systemPrompt}\n\nGUEST USER INPUT:\n${testMessage}` }
          ]
        }
      ],
      config: {
        temperature,
      }
    });

    const reply = response.text || 'No response generated.';
    return { success: true, reply };
  } catch (error: any) {
    console.error('Error testing AI prompt:', error);
    return { success: false, error: error.message || 'AI execution error' };
  }
}

export async function generateChatflowTemplate(flowName: string, triggerEvent: string, customInstruction?: string) {
  try {
    const promptText = `
You are an expert hospitality copywriter for "Nothingness", an ultra-exclusive luxury sanctuary brand.
Generate an automated message response template and trigger keyword for a chatflow.

Flow Name: "${flowName || 'General Inquiry'}"
Trigger Event: "${triggerEvent || 'keyword'}"
Custom Instruction/Topic: "${customInstruction || 'Write a warm, luxury hospitality template.'}"

Requirements:
1. "suggested_keyword": A concise, lowercase keyword or phrase suitable for triggering this flow (e.g. "ac", "checkin", "wifi", "available", "tools", "booking").
2. "response_template": A warm, refined, high-end hospitality message template. Use variables like {{guest_name}}, {{space_title}}, {{check_in_date}}, {{check_out_date}} where appropriate.

Return ONLY a valid JSON object with format:
{
  "suggested_keyword": "keyword_here",
  "response_template": "template_text_here"
}
`;

    // 1. Try NVIDIA AI first
    try {
      const { callNvidiaChat, NVIDIA_MODELS } = await import('@/lib/ai/nvidia');
      const nvidiaRes = await callNvidiaChat({
        model: NVIDIA_MODELS.CONCIERGE_FAST,
        messages: [
          { role: 'user', content: promptText }
        ],
        temperature: 0.5,
        jsonMode: true,
      });

      if (nvidiaRes.success && nvidiaRes.content) {
        const cleanJson = nvidiaRes.content.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanJson);
        return {
          success: true,
          suggested_keyword: parsed.suggested_keyword || '',
          response_template: parsed.response_template || '',
        };
      }
    } catch (nvidiaErr) {
      console.warn('NVIDIA chatflow generator warning, falling back to Gemini:', nvidiaErr);
    }

    // 2. Fallback to Gemini
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return { success: false, error: 'No AI API Key (NVIDIA or Gemini) is configured.' };
    }

    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: promptText }] }]
    });

    const text = response.text || '{}';
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    return {
      success: true,
      suggested_keyword: parsed.suggested_keyword || '',
      response_template: parsed.response_template || '',
    };
  } catch (error: any) {
    console.error('Error generating chatflow template with AI:', error);
    return { success: false, error: error.message || 'AI template generation failed' };
  }
}
