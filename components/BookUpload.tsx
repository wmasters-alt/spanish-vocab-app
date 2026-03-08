'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

type Stage = 'idle' | 'uploading' | 'parsing' | 'done' | 'error'

export default function BookUpload() {
  const [stage, setStage] = useState<Stage>('idle')
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const upload = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please select a PDF file.')
      return
    }
    setError('')
    setStage('uploading')

    const fd = new FormData()
    fd.append('file', file)

    try {
      setStage('parsing')
      const res = await fetch('/api/books', { method: 'POST', body: fd })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Upload failed')
      }
      const { book } = await res.json()
      setStage('done')
      router.push(`/books/${book.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setStage('error')
    }
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) upload(file)
    e.target.value = ''
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) upload(file)
  }

  const busy = stage === 'uploading' || stage === 'parsing'

  return (
    <div>
      <div
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed border-indigo-200 rounded-2xl p-8 text-center bg-indigo-50 hover:bg-indigo-100 transition-colors"
      >
        {busy ? (
          <div className="flex flex-col items-center gap-3">
            <svg className="w-10 h-10 text-indigo-500 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <p className="text-indigo-700 font-medium">
              {stage === 'uploading' ? 'Uploading…' : 'Parsing PDF & saving words…'}
            </p>
            <p className="text-sm text-indigo-400">This may take a moment for large books</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <svg className="w-12 h-12 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div>
              <p className="font-semibold text-slate-700">Upload a Spanish book</p>
              <p className="text-sm text-slate-500 mt-1">PDF only · Drag & drop or tap to browse</p>
            </div>
            <button
              onClick={() => inputRef.current?.click()}
              className="mt-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 active:scale-95 transition-all"
            >
              Choose PDF
            </button>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-600 text-center">{error}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={onFileChange}
      />
    </div>
  )
}
