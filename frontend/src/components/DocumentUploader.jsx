import { useRef, useState } from 'react'
import { CheckIcon, UploadIcon } from './icons.jsx'

const ACCEPT = '.pdf,.txt,.md'

export default function DocumentUploader({ onUpload, uploading }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  function handleFiles(files) {
    const file = files && files[0]
    if (file) onUpload(file)
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Upload a reference document"
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        handleFiles(e.dataTransfer.files)
      }}
      className={`cursor-pointer rounded-xl border-2 border-dashed p-4 text-center transition-colors ${
        uploading
          ? 'border-verified bg-verified-wash'
          : dragging
            ? 'border-verified bg-verified-wash'
            : 'border-rule bg-sheet hover:border-verified'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files)
          e.target.value = ''
        }}
      />
      <span
        className={`mx-auto flex size-9 items-center justify-center rounded-full ${
          uploading || dragging ? 'bg-verified text-sheet' : 'bg-rule-soft text-verified-deep'
        }`}
      >
        {uploading ? (
          <span className="pulse-dot size-2.5 rounded-full bg-current" />
        ) : (
          <UploadIcon className="size-4" />
        )}
      </span>
      <p className="mt-2 text-[13px] font-semibold">
        {uploading ? 'Indexing document…' : 'File a reference document'}
      </p>
      <p className="mt-0.5 text-[11px] text-ink-faint">
        {uploading ? (
          <span className="inline-flex items-center gap-1">
            <CheckIcon className="size-3" /> Chunking, embedding, filing
          </span>
        ) : (
          'PDF, TXT or MD · drop or click'
        )}
      </p>
    </div>
  )
}
