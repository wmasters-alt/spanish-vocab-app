'use client'

import { useState } from 'react'

interface Word {
  id: string
  spanish: string
  english: string | null
  learned: boolean
  books: string[]
}

export default function MasterTable({ words, allBooks }: { words: Word[]; allBooks: string[] }) {
  const [search, setSearch] = useState('')
  const [bookFilter, setBookFilter] = useState('')

  const filtered = words.filter((w) => {
    const q = search.toLowerCase()
    const matchQ = !q || w.spanish.includes(q) || (w.english ?? '').toLowerCase().includes(q)
    const matchB = !bookFilter || w.books.includes(bookFilter)
    return matchQ && matchB
  })

  return (
    <div>
      {/* Search + book filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search Spanish or English…"
          className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 bg-white"
        />
        {allBooks.length > 1 && (
          <select
            value={bookFilter}
            onChange={(e) => setBookFilter(e.target.value)}
            className="px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400 bg-white text-slate-600"
          >
            <option value="">All books</option>
            {allBooks.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        )}
      </div>

      <p className="text-sm text-slate-400 mb-3">{filtered.length.toLocaleString()} words</p>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {/* Header — desktop */}
        <div className="hidden sm:grid grid-cols-[1fr_1fr_auto_2rem] gap-4 px-4 py-2.5 bg-slate-50 border-b border-slate-100 text-xs font-bold uppercase tracking-wide text-slate-400">
          <span>Spanish</span>
          <span>English</span>
          <span>Books</span>
          <span className="text-center">✓</span>
        </div>

        <div className="divide-y divide-slate-50">
          {filtered.length === 0 && (
            <p className="text-center text-slate-400 py-10 text-sm">No words match.</p>
          )}
          {filtered.map((word) => (
            <div key={word.id} className={`flex items-center gap-3 px-4 py-3 hover:bg-slate-50 ${word.learned ? 'opacity-50' : ''}`}>
              <div className="flex-1 min-w-0">
                <span className={`font-bold text-indigo-700 ${word.learned ? 'line-through' : ''}`}>
                  {word.spanish}
                </span>
                {/* English + books on mobile */}
                <p className="text-sm text-slate-500 mt-0.5 sm:hidden">
                  {word.english ?? <span className="italic text-slate-300">—</span>}
                </p>
                {word.books.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1 sm:hidden">
                    {word.books.map((b) => (
                      <span key={b} className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">
                        {b}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* English — desktop */}
              <div className="hidden sm:block flex-1 text-sm text-slate-600">
                {word.english ?? <span className="italic text-slate-300">—</span>}
              </div>

              {/* Books — desktop */}
              <div className="hidden sm:flex items-center gap-1 flex-wrap">
                {word.books.map((b) => (
                  <span key={b} className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                    {b}
                  </span>
                ))}
              </div>

              {/* Learned dot */}
              <div className={`shrink-0 w-4 h-4 rounded-full border-2 ${word.learned ? 'bg-indigo-500 border-indigo-500' : 'border-slate-200'}`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
