import { prisma } from '@/lib/db'
import MasterTable from '@/components/MasterTable'

export const dynamic = 'force-dynamic'

export default async function MasterPage() {
  const words = await prisma.word.findMany({
    orderBy: { spanish: 'asc' },
    include: {
      bookWords: {
        include: { book: { select: { title: true } } },
      },
    },
  })

  const allBooks = [...new Set(
    words.flatMap((w) => w.bookWords.map((bw) => bw.book.title))
  )].sort()

  const serialized = words
    .filter((w) => w.english !== null)
    .map((w) => ({
      id: w.id,
      spanish: w.spanish,
      english: w.english,
      learned: w.learned,
      books: w.bookWords.map((bw) => bw.book.title),
    }))

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Master Vocabulary</h1>
        <p className="text-slate-500 text-sm mt-1">
          {serialized.length.toLocaleString()} translated words across {allBooks.length} book{allBooks.length !== 1 ? 's' : ''}
        </p>
      </div>
      <MasterTable words={serialized} allBooks={allBooks} />
    </div>
  )
}
