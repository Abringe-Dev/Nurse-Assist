import { useEffect, useRef, useState } from 'react'
import MessageBubble from './MessageBubble.jsx'

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200">
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            style={{ animationDelay: `${delay}ms` }}
            className="size-2 animate-bounce rounded-full bg-slate-400"
          />
        ))}
      </div>
    </div>
  )
}

export default function ChatWindow({ messages, thinking, onSend }) {
  const [input, setInput] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking])

  function submit(e) {
    e.preventDefault()
    const text = input.trim()
    if (!text || thinking) return
    setInput('')
    onSend(text)
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto p-6">
        {messages.map((message, i) => (
          <MessageBubble key={i} message={message} />
        ))}
        {thinking && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={submit} className="border-t border-slate-200 bg-white p-4">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) submit(e)
            }}
            rows={1}
            placeholder="Ask about an uploaded protocol, drug, or procedure…"
            className="max-h-40 min-h-11 flex-1 resize-none rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition-colors focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
          />
          <button
            type="submit"
            disabled={!input.trim() || thinking}
            className="h-11 rounded-xl bg-teal-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  )
}
