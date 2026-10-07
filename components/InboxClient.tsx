'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { trainAI } from '@/app/actions/ai'
import { Send, Bot, User, UserCheck, GraduationCap } from 'lucide-react'
import { toast } from 'sonner'

// A client-side supabase instance for realtime subscriptions
// We use anon key for realtime, assuming we have row level security disabled for this internal tool MVP
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Message {
  id: string
  conversation_id: string
  sender_type: 'user' | 'agent' | 'ai'
  content: string
  created_at: string
}

interface InboxClientProps {
  initialConversationId: string | null
  initialMessages: Message[]
}

export default function InboxClient({ initialConversationId, initialMessages }: InboxClientProps) {
  const [conversationId, setConversationId] = useState<string | null>(initialConversationId)
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [isTraining, setIsTraining] = useState<string | null>(null)

  useEffect(() => {
    if (!conversationId) return

    // Setup realtime subscription
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          const newMessage = payload.new as Message
          setMessages(prev => {
            // Avoid duplicates
            if (prev.find(m => m.id === newMessage.id)) return prev
            return [...prev, newMessage]
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId])

  const handleSend = async () => {
    if (!input.trim() || !conversationId) return

    const tempId = crypto.randomUUID()
    const content = input

    // Optimistic UI update
    const newMessage: Message = {
      id: tempId,
      conversation_id: conversationId,
      sender_type: 'agent',
      content,
      created_at: new Date().toISOString()
    }
    setMessages(prev => [...prev, newMessage])
    setInput('')

    // Insert into DB
    const { error } = await supabase.from('messages').insert({
      id: tempId,
      conversation_id: conversationId,
      sender_type: 'agent',
      content
    })

    if (error) {
      toast.error('Failed to send message')
      setMessages(prev => prev.filter(m => m.id !== tempId))
    } else {
      // Ensure conversation is marked as human override if an agent replies
      await supabase.from('conversations').update({ human_override: true }).eq('id', conversationId)
    }
  }

  const handleTrainAI = async (message: Message) => {
    // Find the preceding user message to use as the query
    const idx = messages.findIndex(m => m.id === message.id)
    let userQuery = 'Unknown context'
    
    // Look backwards for the last user message
    for (let i = idx - 1; i >= 0; i--) {
      if (messages[i].sender_type === 'user') {
        userQuery = messages[i].content
        break
      }
    }

    setIsTraining(message.id)
    try {
      const res = await trainAI(userQuery, message.content)
      if (res.success) {
        toast.success('AI successfully trained on this interaction!')
      } else {
        toast.error('Training failed: ' + res.error)
      }
    } catch (err) {
      toast.error('An error occurred during training.')
    } finally {
      setIsTraining(null)
    }
  }

  if (!conversationId) {
    return (
      <div className="flex items-center justify-center h-[600px] bg-gray-50 rounded-2xl border border-gray-100">
        <p className="text-gray-500">Select a conversation to start</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Conversation {conversationId.substring(0,8)}</h3>
            <p className="text-xs text-gray-500">Live chat</p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
        {messages.map((msg) => {
          const isUser = msg.sender_type === 'user'
          const isAI = msg.sender_type === 'ai'
          
          return (
            <div key={msg.id} className={`flex ${isUser ? 'justify-start' : 'justify-end'} group`}>
              <div className={`max-w-[70%] flex gap-3 ${isUser ? 'flex-row' : 'flex-row-reverse'}`}>
                {/* Avatar */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-auto
                  ${isUser ? 'bg-gray-200 text-gray-600' : isAI ? 'bg-purple-100 text-purple-600' : 'bg-indigo-600 text-white'}`}
                >
                  {isUser ? <User className="w-4 h-4" /> : isAI ? <Bot className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                </div>
                
                {/* Message Bubble */}
                <div className="relative group">
                  <div className={`px-4 py-3 rounded-2xl shadow-sm
                    ${isUser ? 'bg-white border border-gray-100 rounded-bl-none text-gray-800' : 
                      isAI ? 'bg-purple-50 border border-purple-100 rounded-br-none text-purple-900' : 
                      'bg-indigo-600 text-white rounded-br-none'}`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                  
                  {/* Action Buttons (Train AI on Agent replies) */}
                  {msg.sender_type === 'agent' && (
                    <div className="absolute top-1/2 -translate-y-1/2 -left-12 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleTrainAI(msg)}
                        disabled={isTraining === msg.id}
                        title="Train AI on this reply"
                        className="p-2 bg-white text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full shadow-sm border border-gray-100 transition-colors"
                      >
                        <GraduationCap className={`w-4 h-4 ${isTraining === msg.id ? 'animate-bounce text-indigo-600' : ''}`} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t">
        <div className="flex items-center gap-2 max-w-full relative">
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-6 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
