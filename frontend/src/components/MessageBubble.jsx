import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { AlertIcon, CheckIcon, CopyIcon, DocIcon, ShieldIcon } from './icons.jsx'

const markdownComponents = {
  p: ({ children }) => <p className="answer-p">{children}</p>,
  strong: ({ children }) => <strong className="answer-strong">{children}</strong>,
  ul: ({ children }) => <ul className="answer-ul">{children}</ul>,
  ol: ({ children }) => <ol className="answer-ol">{children}</ol>,
  li: ({ children }) => <li className="answer-li">{children}</li>,
  h1: ({ children }) => <p className="answer-p">{children}</p>,
  h2: ({ children }) => <p className="answer-p">{children}</p>,
  h3: ({ children }) => <p className="answer-p">{children}</p>,
  h4: ({ children }) => <p className="answer-p">{children}</p>,
}

function ProvenanceStub({ sources, text }) {
  const [open, setOpen] = useState(null)
  const [copied, setCopied] = useState(false)

  if (!sources || sources.length === 0) return null

  async function copyAnswer() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="mt-3 border-t border-rule pt-2.5">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <p className="tnum flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-verified-deep">
          <ShieldIcon className="size-3.5" />
          Provenance · {sources.length} source{sources.length === 1 ? '' : 's'}
        </p>
        <CopyAnswerButton copied={copied} onCopy={copyAnswer} />
      </div>
      <ul className="flex flex-wrap gap-1.5">
        {sources.map((source, i) => (
          <li key={i}>
            <button
              type="button"
              onClick={() => setOpen(open === i ? null : i)}
              aria-expanded={open === i}
              className={`tnum inline-flex max-w-full items-center gap-1.5 rounded-lg bg-verified-wash px-2.5 py-1 text-[11px] font-medium text-verified-deep transition-colors hover:bg-verified hover:text-sheet ${
                open === i ? 'bg-verified text-sheet' : ''
              }`}
            >
              <DocIcon className="size-3.5 shrink-0" />
              <span className="max-w-44 truncate">{source.title}</span>
              <span className="opacity-70">p.{source.page}</span>
            </button>
          </li>
        ))}
      </ul>
      {open !== null && sources[open]?.snippet && (
        <p className="hold-flash mt-2 rounded-lg bg-paper px-3 py-2 text-xs leading-relaxed text-ink-soft">
          {sources[open].snippet}
        </p>
      )}
    </div>
  )
}

function CopyAnswerButton({ copied, onCopy }) {
  if (copied) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-verified-deep">
        <CheckIcon className="size-3" /> Copied
      </span>
    )
  }
  return (
    <button
      type="button"
      onClick={onCopy}
      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-ink-faint transition-colors hover:bg-rule-soft hover:text-ink"
    >
      <CopyIcon className="size-3" /> Copy answer
    </button>
  )
}

function GeneralBanner() {
  return (
    <div className="mt-3 border-t-2 border-dashed border-caution-rule pt-2.5">
      <p className="flex items-start gap-1.5 rounded-lg bg-caution-wash px-3 py-2 text-xs leading-snug text-caution-ink">
        <AlertIcon className="mt-0.5 size-3.5 shrink-0" />
        <span>
          <strong className="font-semibold">General knowledge</strong> — no uploaded document
          matched. Verify with institutional protocols.
        </span>
      </p>
    </div>
  )
}

export default function MessageBubble({ message, streaming }) {
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-ink px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap text-paper shadow-[0_2px_8px_rgba(22,34,46,0.25),0_1px_2px_rgba(22,34,46,0.2)]">
          {message.text}
        </div>
      </div>
    )
  }

  if (message.isError) {
    return (
      <div className="flex justify-start">
        <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-danger-wash px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap text-danger">
          <p className="flex items-start gap-1.5">
            <AlertIcon className="mt-0.5 size-4 shrink-0" />
            <span>{message.text}</span>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-start">
      <article className="answer-sheet w-full max-w-[72ch] rounded-2xl rounded-bl-md border border-rule bg-sheet px-4 py-3 text-[15px] leading-[1.65] shadow-[0_1px_2px_rgba(22,34,46,0.08)] md:px-5">
        <span className={streaming ? 'stream-caret' : undefined}>
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {message.text}
          </ReactMarkdown>
        </span>
        <ProvenanceStub sources={message.sources} text={message.text} />
        {message.isGeneral && <GeneralBanner />}
      </article>
    </div>
  )
}
