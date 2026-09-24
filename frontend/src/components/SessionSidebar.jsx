import { useState } from 'react'
import { ChatIcon, PlusIcon, TrashIcon } from './icons.jsx'

function groupSessions(sessions) {
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const today = []
  const earlier = []
  for (const session of sessions) {
    const ts = session.created_at ? new Date(session.created_at).getTime() : 0
    if (ts >= startOfToday) today.push(session)
    else earlier.push(session)
  }
  return [
    { label: 'Today', items: today },
    { label: 'Earlier', items: earlier },
  ].filter((group) => group.items.length > 0)
}

function SessionRow({ session, active, onSelect, onDelete }) {
  const [confirming, setConfirming] = useState(false)

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(session.id)}
      onKeyDown={(e) => e.key === 'Enter' && onSelect(session.id)}
      className={`group flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-sm transition-colors ${
        active
          ? 'bg-verified-wash font-medium text-verified-deep'
          : 'text-ink hover:bg-rule-soft'
      }`}
    >
      <ChatIcon className="size-4 shrink-0 text-ink-faint" />
      <span className="min-w-0 flex-1 truncate">{session.title}</span>
      {confirming ? (
        <span className="flex shrink-0 items-center gap-1 text-[11px]">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(session.id)
            }}
            className="rounded-md bg-danger-wash px-1.5 py-0.5 font-semibold text-danger"
          >
            Remove
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setConfirming(false)
            }}
            className="rounded-md px-1.5 py-0.5 text-ink-faint hover:bg-rule-soft"
          >
            Keep
          </button>
        </span>
      ) : (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setConfirming(true)
          }}
          className="shrink-0 rounded-md p-1 text-ink-faint opacity-0 transition-opacity hover:bg-danger-wash hover:text-danger focus-visible:opacity-100 group-hover:opacity-100"
          aria-label={`Delete ${session.title}`}
        >
          <TrashIcon className="size-3.5" />
        </button>
      )}
    </div>
  )
}

export default function SessionSidebar({ sessions, activeId, onSelect, onCreate, onDelete }) {
  return (
    <div className="flex min-h-0 flex-col gap-3">
      <button
        type="button"
        onClick={onCreate}
        className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-ink px-3 py-2 text-sm font-semibold text-paper shadow-[0_2px_8px_rgba(22,34,46,0.25),0_1px_2px_rgba(22,34,46,0.2)] transition-colors hover:bg-night-soft"
      >
        <PlusIcon className="size-4" />
        New handover
      </button>
      {sessions.length === 0 ? (
        <p className="rounded-xl border border-dashed border-rule px-3 py-4 text-center text-xs leading-relaxed text-ink-faint">
          No handovers yet. Start one above — it will be filed here.
        </p>
      ) : (
        <div className="sheet-scroll space-y-3 overflow-y-auto">
          {groupSessions(sessions).map((group) => (
            <div key={group.label}>
              <p className="tnum mb-1 px-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                {group.label}
              </p>
              <ul className="space-y-0.5">
                {group.items.map((session) => (
                  <li key={session.id}>
                    <SessionRow
                      session={session}
                      active={session.id === activeId}
                      onSelect={onSelect}
                      onDelete={onDelete}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
