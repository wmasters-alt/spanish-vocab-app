'use client'

import Link from 'next/link'

interface Book {
  id: string
  title: string
  wordCount: number
  learnedCount: number
  totalUses: number
  pageCount: number | null
  createdAt: string
}

export default function BookList({ books }: { books: Book[] }) {
  if (books.length === 0) {
    return (
      <p className="text-center text-slate-400 py-8">No books yet — upload your first one above.</p>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {books.map((book) => {
        const pct = book.wordCount > 0 ? Math.round((book.learnedCount / book.wordCount) * 100) : 0
        return (
          <Link
            key={book.id}
            href={`/books/${book.id}`}
            className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md hover:border-indigo-200 transition-all active:scale-[0.98]"
          >
            <div className="flex items-start justify-between gap-2 mb-3">
              <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-2">{book.title}</h3>
              <span className="shrink-0 text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                {pct}%
              </span>
            </div>

            <div className="mb-3">
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {book.learnedCount} / {book.wordCount} words learned
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-400">
              {book.pageCount && <span>{book.pageCount} pages</span>}
              <span>{book.totalUses.toLocaleString()} total uses</span>
              <span className="ml-auto">{new Date(book.createdAt).toLocaleDateString()}</span>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
