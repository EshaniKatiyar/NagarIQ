'use client'
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/components/ui/AuthProvider'
import { Send, Bot, User, Loader2, Zap } from 'lucide-react'
import type { ChatMessage } from '@/types'
import clsx from 'clsx'
import ReactMarkdown from 'react-markdown'

const SUGGESTED = [
  "What's the status of issues in Koramangala?",
  "How do I escalate a pothole that hasn't been fixed?",
  "Which department handles broken streetlights?",
  "What are my rights if a civic issue is ignored for 30 days?",
  "Show me the most reported issues this week",
]

export default function ChatPage() {
  const { profile } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: "Hi! I'm NagarIQ AI — your civic intelligence assistant. I can help you track issues, understand which department to contact, explain your escalation rights, and answer questions about community problems in your area. What would you like to know?",
      timestamp: new Date()
    }
  ])
  const [mounted, setMounted] = useState(false)
useEffect(() => { setMounted(true) }, [])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text?: string) => {
    const msg = text || input.trim()
    if (!msg || loading) return
    setInput('')

    const userMsg: ChatMessage = { role: 'user', content: msg, timestamp: new Date() }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }))
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, history, neighbourhood: profile?.neighbourhood || 'Bengaluru' })
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.response, timestamp: new Date() }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I had trouble connecting. Please try again.', timestamp: new Date() }])
    }
    setLoading(false)
  }

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-4rem)] flex flex-col px-4 py-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-civic-600 rounded-xl flex items-center justify-center">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">NagarIQ AI</h1>
          <p className="text-sm text-slate-500">Your civic intelligence assistant</p>
        </div>
        <span className="ml-auto flex items-center gap-1.5 text-xs text-green-600 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full font-medium">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Online
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.map((msg, i) => (
          <div key={i} className={clsx('flex gap-3', msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}>
            <div className={clsx('w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
              msg.role === 'user' ? 'bg-civic-600' : 'bg-slate-100')}>
              {msg.role === 'user'
                ? <User className="w-4 h-4 text-white" />
                : <Bot className="w-4 h-4 text-slate-600" />
              }
            </div>
            <div className={clsx('max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
              msg.role === 'user'
                ? 'bg-civic-600 text-white rounded-tr-sm'
                : 'bg-white border border-slate-100 text-slate-700 rounded-tl-sm shadow-sm')}>
              {msg.role === 'assistant' ? (
  <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0">
    <ReactMarkdown>{msg.content}</ReactMarkdown>
  </div>
) : (
  msg.content
)}
              <p className={clsx('text-xs mt-1.5', msg.role === 'user' ? 'text-civic-200' : 'text-slate-400')}>
  {mounted ? msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
</p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-slate-600" />
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1 items-center">
                <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {messages.length === 1 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {SUGGESTED.map(s => (
            <button key={s} onClick={() => sendMessage(s)}
              className="text-xs bg-white border border-slate-200 text-slate-600 hover:border-civic-300 hover:text-civic-700 px-3 py-1.5 rounded-full transition-all">
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-3 bg-white border border-slate-200 rounded-2xl p-2 shadow-sm">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          placeholder="Ask about issues, departments, escalation rights..."
          className="flex-1 text-sm px-3 py-2 focus:outline-none text-slate-700 placeholder-slate-400"
        />
        <button onClick={() => sendMessage()} disabled={!input.trim() || loading}
          className="w-9 h-9 bg-civic-600 text-white rounded-xl flex items-center justify-center hover:bg-civic-700 disabled:opacity-40 transition-all active:scale-90 flex-shrink-0">
          <Send className="w-4 h-4" />
        </button>
      </div>
      <p className="text-xs text-slate-400 text-center mt-2">Powered by Gemini 2.5 Flash · Answers in your language</p>
    </div>
  )
}