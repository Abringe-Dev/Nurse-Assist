import { useState } from 'react'
import { DocIcon, TrashIcon, UploadIcon } from './icons.jsx'

export default function DocumentList({ documents, onDelete }) {
  const [confirming, setConfirming] = useState(null)

  if (documents.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-rule px-3 py-4 text-center">
        <UploadIcon className="mx-auto size-5 text-ink-faint" />
        <p className="mt-1.5 text-xs leading-relaxed text-ink-faint">
          Library empty. File a protocol above to ground answers in your own documents.
        </p>
      </div>
    )
  }

  return (
    <ul className="space-y-2">
      {documents.map((doc) => (
        <li
          key={doc.doc_id}
          className="flex items-center justify-between gap-2 rounded-xl border border-rule bg-sheet px-3 py-2 shadow-[0_1px_2px_rgba(22,34,46,0.08)]"
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-verified-wash text-verified-deep">
              <DocIcon className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium">{doc.title}</p>
              <p className="tnum text-[11px] text-ink-faint">
                {doc.pages} page{doc.pages === 1 ? '' : 's'} · {doc.chunks} chunk
                {doc.chunks === 1 ? '' : 's'}
              </p>
            </div>
          </div>
          {confirming === doc.doc_id ? (
            <span className="flex shrink-0 items-center gap-1 text-[11px]">
              <button
                type="button"
                onClick={() => {
                  setConfirming(null)
                  onDelete(doc.doc_id)
                }}
                className="rounded-md bg-danger-wash px-1.5 py-0.5 font-semibold text-danger"
              >
                Remove
              </button>
              <button
                type="button"
                onClick={() => setConfirming(null)}
                className="rounded-md px-1.5 py-0.5 text-ink-faint hover:bg-rule-soft"
              >
                Keep
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(doc.doc_id)}
              aria-label={`Delete ${doc.title}`}
              className="shrink-0 rounded-lg p-1.5 text-ink-faint transition-colors hover:bg-danger-wash hover:text-danger"
            >
              <TrashIcon className="size-4" />
            </button>
          )}
        </li>
      ))}
    </ul>
  )
}
