function Sources({ sources }) {
  if (!sources || sources.length === 0) return null

  return (
    <div className="mt-3 border-t border-slate-100 pt-2">
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        Sources
      </p>
      <ul className="flex flex-wrap gap-1.5">
        {sources.map((source, i) => (
          <li key={i}>
            <span
              title={source.snippet}
              className="inline-flex max-w-full items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-[11px] text-teal-800 ring-1 ring-teal-200"
            >
              <span className="truncate">{source.title}</span>
              <span className="text-teal-500">· p.{source.page}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
          isUser
            ? 'rounded-br-md bg-teal-600 text-white'
            : message.isError
              ? 'rounded-bl-md bg-red-50 text-red-800 ring-1 ring-red-200'
              : 'rounded-bl-md bg-white text-slate-800 ring-1 ring-slate-200'
        }`}
      >
        {message.text}
        {!isUser && !message.isError && <Sources sources={message.sources} />}
      </div>
    </div>
  )
}
