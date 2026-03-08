import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import VocabView from '@/components/VocabView'

export const dynamic = 'force-dynamic'

export default async function BookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const book = await prisma.book.findUnique({ where: { id } })
  if (!book) notFound()

  const bookWords = await prisma.bookWord.findMany({
    where: { bookId: id },
    include: { word: true },
    orderBy: { frequency: 'desc' },
  })

  const learnedCount = bookWords.filter((bw) => bw.word.learned).length

  const serializedBook = {
    id: book.id,
    title: book.title,
    pageCount: book.pageCount,
    totalUses: book.totalUses,
    wordCount: bookWords.length,
    learnedCount,
  }

  const words = bookWords.map((bw) => ({
    id: bw.word.id,
    spanish: bw.word.spanish,
    english: bw.word.english ?? null,
    frequency: bw.frequency,
    isNew: bw.isNew,
    learned: bw.word.learned,
  }))

  return <VocabView book={serializedBook} initialWords={words} />
}
