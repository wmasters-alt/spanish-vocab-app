import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import VocabView from '@/components/VocabView'

export const dynamic = 'force-dynamic'

export default async function BookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // Only fetch book metadata — words are loaded client-side to keep initial payload small
  const book = await prisma.book.findUnique({
    where: { id },
    select: { id: true, title: true, pageCount: true, totalUses: true },
  })
  if (!book) notFound()

  const [wordCount, learnedCount] = await Promise.all([
    prisma.bookWord.count({ where: { bookId: id } }),
    prisma.bookWord.count({ where: { bookId: id, word: { learned: true } } }),
  ])

  return (
    <VocabView
      book={{ ...book, wordCount, learnedCount }}
    />
  )
}
