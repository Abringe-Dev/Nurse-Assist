export default function SessionSidebar({ sessions, activeId, onSelect, onCreate, onDelete }) {
  return (
    <div className="flex min-h-0 flex-col">
      <button
        type="button"
        onClick={onCreate}
        className="mb-3 w-full rounded-lg bg-teal-600 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-700"
      >
        + New chat
      </button>
      {sessions.length === 0 ? (
        <p className="text-xs text-slate-500">No chats yet.</p>
      ) : (
        <ul className="space-y-1 overflow-y-auto">
          {sessions.map((session) => (
            <li key={session.id}>
              <div
                role="button"
                tabIndex={0}
                onClick={() => onSelect(session.id)}
                onKeyDown={(e) => e.key === 'Enter' && onSelect(session.id)}
                className={`group flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm ${
                  session.id === activeId
                    ? 'bg-teal-50 font-medium text-teal-800 ring-1 ring-teal-200'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="truncate">{session.title}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(session.id)
                  }}
                  className="rounded px-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  aria-label="Delete chat"
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
