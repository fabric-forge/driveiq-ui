import { useState, useRef, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import ReactMarkdown from 'react-markdown'
import { Sparkles, Send, FileText } from 'lucide-react'
import { api } from '@/lib/api'
import type { AskSource } from '@/types'

interface Message {
  role: 'user' | 'assistant'
  content: string
  sources?: AskSource[]
}

export default function Aiana() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const ask = useMutation({
    mutationFn: (query: string) => api.aiana.ask(query),
    onSuccess: (res) => {
      setMessages((prev) => [...prev, { role: 'assistant', content: res.answer, sources: res.sources }])
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Something went wrong asking Aiana.'
      setMessages((prev) => [...prev, { role: 'assistant', content: message }])
    },
  })

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, ask.isPending])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const query = input.trim()
    if (!query || ask.isPending) return
    setMessages((prev) => [...prev, { role: 'user', content: query }])
    setInput('')
    ask.mutate(query)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-h-[800px] bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-900 to-gray-800">
        <Sparkles className="h-5 w-5 text-toyota-red" />
        <div>
          <h2 className="font-semibold text-white">Aiana</h2>
          <p className="text-xs text-gray-400">Ask about your owner's manual, service history, or CARFAX report</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12 text-toyota-gray">
            <Sparkles className="h-8 w-8 mx-auto mb-3 text-gray-300" />
            <p>Ask Aiana anything about your 4Runner — maintenance intervals, dashboard warnings, tire specs, service history…</p>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-lg px-4 py-3 text-sm ${
                m.role === 'user' ? 'bg-toyota-red text-white whitespace-pre-wrap' : 'bg-gray-100 text-gray-900'
              }`}
            >
              {m.role === 'assistant' ? (
                <div className="prose prose-sm prose-gray max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:my-2 [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-0.5 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-3 [&_h2]:mb-1 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-2 [&_h3]:mb-1 [&_strong]:font-semibold [&_table]:text-xs [&_th]:text-left [&_th]:pr-3 [&_td]:pr-3">
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              ) : (
                m.content
              )}
              {m.sources && m.sources.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-300/50 flex flex-wrap gap-2">
                  {m.sources.map((s, si) => (
                    <span
                      key={si}
                      className="inline-flex items-center gap-1 text-xs bg-white/70 text-gray-700 px-2 py-1 rounded-full"
                    >
                      <FileText className="h-3 w-3" />
                      {s.document}
                      {s.page ? `, p.${s.page}` : ''}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {ask.isPending && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-500 rounded-lg px-4 py-3 text-sm">Thinking…</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={submit} className="flex gap-2 p-4 border-t border-gray-100">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Aiana about your vehicle…"
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-toyota-red"
        />
        <button
          type="submit"
          disabled={!input.trim() || ask.isPending}
          className="flex items-center gap-1.5 px-4 py-2 bg-toyota-red text-white font-medium rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
        >
          <Send className="h-4 w-4" />
          Ask
        </button>
      </form>
    </div>
  )
}
