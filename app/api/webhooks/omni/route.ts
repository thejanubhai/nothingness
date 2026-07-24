import { NextRequest, NextResponse } from 'next/server'
import { after } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateReply } from '@/app/actions/ai'

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    const payload = JSON.parse(rawBody)

    // Acknowledge receipt instantly
    const response = new NextResponse('OK', { status: 200 })

    // Process the message in the background
    after(async () => {
      try {
        const supabase = await createClient()

        // Extracting data from Meta/WhatsApp payload structure
        // This is a simplified extraction based on standard WhatsApp Cloud API payload
        const entry = payload.entry?.[0]
        const changes = entry?.changes?.[0]?.value
        const messages = changes?.messages

        if (!messages || messages.length === 0) return

        const message = messages[0]
        const customerId = message.from
        const content = message.text?.body
        
        if (!content || !customerId) return

        // 1. Get or create conversation
        let conversationId: string;
        
        // Find existing open conversation for this customer
        const { data: existingConv } = await supabase
          .from('conversations')
          .select('id, human_override')
          .eq('customer_id', customerId)
          .eq('channel', 'whatsapp')
          .eq('status', 'open')
          .single()

        let humanOverride = false;

        if (existingConv) {
          conversationId = existingConv.id
          humanOverride = existingConv.human_override
        } else {
          // Create new conversation
          const { data: newConv, error: createError } = await supabase
            .from('conversations')
            .insert({
              customer_id: customerId,
              channel: 'whatsapp',
              status: 'open',
              human_override: false
            })
            .select()
            .single()

          if (createError) throw createError
          conversationId = newConv.id
          humanOverride = false
        }

        // 2. Insert the incoming message
        await supabase.from('messages').insert({
          conversation_id: conversationId,
          sender_type: 'user',
          content: content,
          raw_payload: payload
        })

        // 3. If human_override is false, trigger AI reply
        if (!humanOverride) {
          await generateReply(content, conversationId)
        }

      } catch (error) {
        console.error('Error in background processing:', error)
      }
    })

    return response
  } catch (error) {
    return new NextResponse('Bad Request', { status: 400 })
  }
}
