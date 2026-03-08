import { prisma } from '@/lib/db'
import BookList from '@/components/BookList'
import BookUpload from '@/components/BookUpload'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const books = await prisma.book.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { bookWords: true } } },
  })

  const booksWithCounts = await Promise.all(
    books.map(async (book) => {
      const learnedCount = await prisma.bookWord.count({
        where: { bookId: book.id, word: { learned: true } },
      })
      return {
        id: book.id,
        title: book.title,
        pageCount: book.pageCount,
        totalUses: book.totalUses,
        wordCount: book._count.bookWords,
        learnedCount,
        createdAt: book.createdAt.toISOString(),
      }
    })
  )

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Your Books</h1>
        <p className="text-slate-500 text-sm mt-1">Upload a Spanish book to start learning vocabulary</p>
      </div>

      <div className="mb-6">
        <BookUpload />
      </div>

      <BookList books={booksWithCounts} />
    </div>
  )
}
