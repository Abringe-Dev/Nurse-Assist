import { useEffect, useRef, useState } from 'react'
import MessageBubble from './MessageBubble.jsx'
import { SendIcon } from './icons.jsx'

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-2.5 rounded-2xl rounded-bl-md border border-rule bg-sheet px-4 py-3 shadow-[0_1px_2px_rgba(22,34,46,0.08)]">
        <span className="pulse-dot size-2 rounded-full bg-verified" />
        <p className="text-[13px] text-ink-soft">Consulting your protocols…</p>
      </div>
    </div>
  )
}

function EmptyHero({ prompts, onPick }) {
  return (
    <div className="mx-auto w-full max-w-[72ch] py-6 md:py-10">
      <p className="tnum text-[11px] font-semibold uppercase tracking-[0.16em] text-verified-deep">
        Handover desk · ready
      </p>
      <h2 className="font-display mt-2 text-3xl leading-tight md:text-4xl">
        Ask your protocols.
      </h2>
      <p className="mt-2 max-w-[60ch] text-[15px] leading-relaxed text-ink-soft">
        Every grounded answer arrives with its paperwork — document, page, and passage. Try one
        of these to see the desk at work:
      </p>
      <ul className="mt-5 space-y-2">
        {prompts.map((prompt) => (
          <li key={prompt}>
            <button
              type="button"
              onClick={() => onPick(prompt)}
              className="group flex w-full items-center justify-between gap-3 rounded-xl border border-rule bg-sheet px-4 py-3 text-left text-sm transition-colors hover:border-verified hover:bg-verified-wash"
            >
              <span className="leading-snug">{prompt}</span>
              <SendIcon className="size-4 shrink-0 -rotate-45 text-ink-faint transition-colors group-hover:text-verified-deep" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function ChatWindow({ messages, thinking, onSend, showHero, heroPrompts = [] }) {
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
    <div className="flex h-full min-h-0 flex-col bg-paper">
      <div className="sheet-scroll flex-1 space-y-6 overflow-y-auto px-5 py-6 md:px-8">
        <div className="mx-auto w-full max-w-[72ch] space-y-6">
          {showHero ? (
            <EmptyHero prompts={heroPrompts} onPick={onSend} />
          ) : (
            messages.map((message, i) => (
              <MessageBubble
                key={i}
                message={message}
                streaming={thinking && i === messages.length - 1 && message.role === 'assistant' && !message.isError}
              />
            ))
          )}
          {thinking && !showHero && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="border-t border-rule bg-sheet px-5 py-3 md:px-8">
        <form onSubmit={submit} className="mx-auto w-full max-w-[72ch]">
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) submit(e)
              }}
              rows={1}
              aria-label="Ask a clinical reference question"
              placeholder="Ask anything — or file a protocol for cited answers…"
              className="max-h-40 min-h-11 flex-1 resize-none rounded-xl border border-rule bg-paper px-4 py-2.5 text-[15px] outline-none transition-colors placeholder:text-ink-faint focus:border-verified"
            />
            <button
              type="submit"
              disabled={!input.trim() || thinking}
              aria-label="Send question"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-ink text-paper shadow-[0_2px_8px_rgba(22,34,46,0.25),0_1px_2px_rgba(22,34,46,0.2)] transition-colors hover:bg-night-soft disabled:cursor-not-allowed disabled:opacity-40"
            >
              {thinking ? (
                <span className="pulse-dot size-2 rounded-full bg-current" />
              ) : (
                <SendIcon className="size-4" />
              )}
            </button>
          </div>
          <p className="tnum mt-1.5 text-[11px] text-ink-faint">
            Enter to send · Shift+Enter for a new line
          </p>
        </form>
      </div>
    </div>
  )
}
