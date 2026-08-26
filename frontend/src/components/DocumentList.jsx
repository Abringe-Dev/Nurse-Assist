export default function DocumentList({ documents, onDelete }) {
  if (documents.length === 0) {
    return <p className="text-xs text-slate-500">No documents uploaded yet.</p>
  }

  return (
    <ul className="space-y-2">
      {documents.map((doc) => (
        <li
          key={doc.doc_id}
          className="group flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 shadow-sm ring-1 ring-slate-200"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-800">{doc.title}</p>
            <p className="text-xs text-slate-500">
              {doc.pages} page{doc.pages === 1 ? '' : 's'} · {doc.chunks} chunk
              {doc.chunks === 1 ? '' : 's'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onDelete(doc.doc_id)}
            aria-label={`Delete ${doc.title}`}
            className="rounded-md px-2 py-1 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            ✕
          </button>
        </li>
      ))}
    </ul>
  )
}
