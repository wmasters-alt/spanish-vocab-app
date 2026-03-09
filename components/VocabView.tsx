'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface Word {
  id: string
  spanish: string
  english: string | null
  frequency: number
  isNew: boolean
  learned: boolean
}

interface Book {
  id: string
  title: string
  pageCount: number | null
  totalUses: number
  wordCount: number
  learnedCount: number
}

type Filter = 'all' | 'new' | 'tolearn' | 'learned'

export default function VocabView({ book, initialWords }: { book: Book; initialWords: Word[] }) {
  const [words, setWords] = useState<Word[]>(initialWords)
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')
  const [translating, setTranslating] = useState(false)
  const [transProgress, setTransProgress] = useState({ done: 0, total: 0 })
  const [toggling, setToggling] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  const deleteBook = async () => {
    if (!confirm(`Delete "${book.title}"? This cannot be undone.`)) return
    setDeleting(true)
    await fetch(`/api/books/${book.id}`, { method: 'DELETE' })
    router.push('/')
  }

  // Run batch translation on mount for any untranslated words
  const runTranslation = useCallback(async () => {
    const untranslated = words.filter((w) => w.english === null).map((w) => w.id)
    if (untranslated.length === 0) return

    setTranslating(true)
    setTransProgress({ done: 0, total: untranslated.length })

    const BATCH = 500
    let done = 0

    for (let i = 0; i < untranslated.length; i += BATCH) {
      const batch = untranslated.slice(i, i + BATCH)
      try {
        const res = await fetch('/api/translate-batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ wordIds: batch }),
        })
        if (res.ok) {
          const { translations } = await res.json() as {
            translations: { id: string; spanish: string; english: string }[]
          }
          const map = new Map(translations.map((t) => [t.id, t.english]))
          setWords((prev) =>
            prev.map((w) => (map.has(w.id) ? { ...w, english: map.get(w.id)! } : w))
          )
          done += translations.length
        }
      } catch {
        // continue with next batch on error
      }
      setTransProgress({ done: done + i, total: untranslated.length })
    }

    setTranslating(false)
  }, [words])

  useEffect(() => {
    runTranslation()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleLearned = async (word: Word) => {
    if (toggling.has(word.id)) return
    setToggling((prev) => new Set(prev).add(word.id))
    const newVal = !word.learned
    setWords((prev) => prev.map((w) => (w.id === word.id ? { ...w, learned: newVal } : w)))
    await fetch(`/api/words/${word.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ learned: newVal }),
    })
    setToggling((prev) => { const s = new Set(prev); s.delete(word.id); return s })
  }

  const learnedCount = words.filter((w) => w.learned).length
  const untranslatedCount = words.filter((w) => w.english === null).length

  const filtered = words.filter((w) => {
    const q = search.toLowerCase()
    const matchQ = !q || w.spanish.includes(q) || (w.english ?? '').toLowerCase().includes(q)
    const isUntranslatable = w.english === '—'
    const matchF =
      filter === 'all' ? true
      : filter === 'new' ? w.isNew
      : filter === 'learned' ? w.learned
      : !w.learned && !isUntranslatable   // To Learn: exclude names/untranslatable
    return matchQ && matchF
  })

  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'new', label: 'New' },
    { key: 'tolearn', label: 'To Learn' },
    { key: 'learned', label: '✓ Learned' },
  ]

  const pct = words.length > 0 ? Math.round((learnedCount / words.length) * 100) : 0

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 leading-tight">{book.title}</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {book.wordCount.toLocaleString()} words · {book.pageCount ? `${book.pageCount} pages · ` : ''}{book.totalUses.toLocaleString()} total uses
          </p>
        </div>
        <button
          onClick={deleteBook}
          disabled={deleting}
          className="shrink-0 px-3 py-1.5 text-xs font-semibold text-red-500 border border-red-200 rounded-lg hover:bg-red-50 active:scale-95 transition-all"
        >
          {deleting ? 'Deleting…' : 'Delete'}
        </button>
      </div>

      {/* Progress */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-slate-700">{learnedCount} / {words.length} learned</span>
          <span className="text-sm font-bold text-indigo-600">{pct}%</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>

        {translating && (
          <div className="mt-3 flex items-center gap-2 text-xs text-indigo-600">
            <svg className="w-3.5 h-3.5 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Translating… {transProgress.done} / {transProgress.total}
          </div>
        )}
        {!translating && untranslatedCount === 0 && words.length > 0 && (
          <p className="mt-2 text-xs text-green-600 font-medium">All translations complete ✓</p>
        )}
      </div>

      {/* Search */}
      <div className="mb-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search Spanish or English…"
          className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 bg-white"
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-3 -mx-1 px-1">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${
              filter === key
                ? 'bg-indigo-600 border-indigo-600 text-white'
                : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'
            }`}
          >
            {label}
          </button>
        ))}
        <span className="shrink-0 ml-auto flex items-center text-xs text-slate-400 pr-1">
          {filtered.length.toLocaleString()} words
        </span>
      </div>

      {/* Word list */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {/* Table header — desktop only */}
        <div className="hidden sm:grid grid-cols-[3rem_1fr_1fr_5rem_2.5rem] gap-2 px-4 py-2.5 bg-slate-50 border-b border-slate-100 text-xs font-bold uppercase tracking-wide text-slate-400">
          <span>#</span>
          <span>Spanish</span>
          <span>English</span>
          <span className="text-right">Uses</span>
          <span className="text-center">✓</span>
        </div>

        <div className="divide-y divide-slate-50">
          {filtered.length === 0 && (
            <p className="text-center text-slate-400 py-10 text-sm">No words match.</p>
          )}
          {filtered.map((word, i) => (
            <div
              key={word.id}
              className={`flex items-center gap-2 px-3 py-3 transition-colors hover:bg-slate-50 ${word.learned ? 'opacity-50' : ''}`}
            >
              {/* Rank — desktop */}
              <span className="hidden sm:block w-8 text-xs text-slate-300 tabular-nums text-right shrink-0">
                {i + 1}
              </span>

              {/* Spanish + badges */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`font-bold text-base text-indigo-700 ${word.learned ? 'line-through' : ''}`}>
                    {word.spanish}
                  </span>
                  {word.isNew && (
                    <span className="hidden sm:inline text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 uppercase tracking-wide">
                      new
                    </span>
                  )}
                </div>
                {/* English — mobile shows inline */}
                <p className="text-base text-slate-500 mt-0.5 sm:hidden">
                  {word.english === null
                    ? <span className="text-slate-300 italic">translating…</span>
                    : word.english === '—'
                    ? <span className="text-slate-300 italic">name / no translation</span>
                    : word.english}
                </p>
              </div>

              {/* English — desktop column */}
              <div className="hidden sm:block flex-1 text-sm text-slate-600">
                {word.english ?? <span className="text-slate-300 italic">…</span>}
              </div>

              {/* Uses — desktop */}
              <div className="hidden sm:block w-16 text-xs text-slate-400 tabular-nums text-right shrink-0">
                {word.frequency.toLocaleString()}
              </div>

              {/* Learned checkbox */}
              <button
                onClick={() => toggleLearned(word)}
                disabled={toggling.has(word.id)}
                className={`shrink-0 w-9 h-9 rounded-xl border-2 flex items-center justify-center transition-all active:scale-90 ${
                  word.learned
                    ? 'bg-indigo-600 border-indigo-600 text-white'
                    : 'border-slate-300 hover:border-indigo-400'
                }`}
              >
                {word.learned && (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
