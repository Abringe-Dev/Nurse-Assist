import { useRef, useState } from 'react'

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
        dragging
          ? 'border-teal-500 bg-teal-50'
          : 'border-slate-300 hover:border-teal-400 hover:bg-slate-50'
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
      <p className="text-sm font-medium text-slate-700">
        {uploading ? 'Ingesting document…' : 'Upload a reference document'}
      </p>
      <p className="mt-1 text-xs text-slate-500">PDF, TXT or MD · drop or click</p>
    </div>
  )
}
