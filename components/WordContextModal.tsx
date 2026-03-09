'use client'

import { useEffect, useState } from 'react'

interface Word {
  id: string
  spanish: string
  english: string | null
  frequency: number
}

interface AiData {
  explanation: string
  examples: { spanish: string; english: string }[]
}

function highlightWord(sentence: string, word: string) {
  const parts = sentence.split(new RegExp(`(${word})`, 'gi'))
  return parts.map((part, i) =>
    part.toLowerCase() === word.toLowerCase() ? (
      <mark key={i} className="bg-amber-100 text-amber-800 rounded px-0.5 not-italic font-semibold">
        {part}
      </mark>
    ) : (
      part
    )
  )
}

export default function WordContextModal({
  word,
  bookId,
  onClose,
}: {
  word: Word
  bookId: string
  onClose: () => void
}) {
  const [sentences, setSentences] = useState<string[] | null>(null)
  const [ai, setAi] = useState<AiData | null>(null)

  useEffect(() => {
    setSentences(null)
    setAi(null)

    // Fast: book sentences (~100ms DB query)
    fetch(`/api/words/${word.id}/context?bookId=${bookId}&type=sentences`)
      .then((r) => r.json())
      .then((d) => setSentences(d.bookSentences ?? []))
      .catch(() => setSentences([]))

    // Slow: AI explanation (~2-4s Claude call) — fires in parallel
    fetch(`/api/words/${word.id}/context?type=ai`)
      .then((r) => r.json())
      .then((d) => setAi(d.ai ?? null))
      .catch(() => setAi({ explanation: '', examples: [] }))
  }, [word.id, bookId])

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Sheet */}
      <div className="relative bg-white rounded-t-2xl max-h-[85vh] flex flex-col shadow-2xl">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between px-5 py-3 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-indigo-700">{word.spanish}</h2>
            <p className="text-base text-slate-500 mt-0.5">
              {word.english === '—'
                ? 'name / no translation'
                : word.english ?? <span className="italic text-slate-300">not yet translated</span>}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {word.frequency.toLocaleString()} uses in this book
            </p>
          </div>
          <button
            onClick={onClose}
            className="mt-1 w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 active:scale-90 transition-all touch-manipulation"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto px-5 py-4 space-y-5">

          {/* Book sentences — shows as soon as DB query returns */}
          <section>
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">
              In this book
            </h3>
            {sentences === null ? (
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <svg className="w-3.5 h-3.5 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Looking in book…
              </div>
            ) : sentences.length === 0 ? (
              <p className="text-sm text-slate-400 italic">No sentences found in this book.</p>
            ) : (
              <div className="space-y-2">
                {sentences.map((s, i) => (
                  <p key={i} className="text-sm text-slate-700 bg-slate-50 rounded-xl px-3 py-2.5 leading-relaxed">
                    {highlightWord(s, word.spanish)}
                  </p>
                ))}
              </div>
            )}
          </section>

          {/* AI explanation — shows when Claude responds */}
          <section>
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">
              AI explanation
            </h3>
            {ai === null ? (
              <div className="flex items-center gap-2 text-sm text-indigo-500">
                <svg className="w-3.5 h-3.5 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Asking AI…
              </div>
            ) : ai.explanation ? (
              <>
                <p className="text-sm text-slate-700 leading-relaxed mb-3">{ai.explanation}</p>
                {ai.examples.length > 0 && (
                  <div className="space-y-2">
                    {ai.examples.map((ex, i) => (
                      <div key={i} className="bg-indigo-50 rounded-xl px-3 py-2.5">
                        <p className="text-sm font-semibold text-indigo-800 leading-snug">
                          {highlightWord(ex.spanish, word.spanish)}
                        </p>
                        <p className="text-sm text-indigo-500 mt-0.5 leading-snug">{ex.english}</p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-slate-400 italic">
                AI explanation unavailable.
              </p>
            )}
          </section>

          {/* Bottom padding for safe area */}
          <div className="h-4" />
        </div>
      </div>
    </div>
  )
}
