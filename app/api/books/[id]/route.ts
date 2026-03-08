import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/books/[id] — fetch book with all words
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const book = await prisma.book.findUnique({ where: { id } })
  if (!book) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const bookWords = await prisma.bookWord.findMany({
    where: { bookId: id },
    include: { word: true },
    orderBy: { frequency: 'desc' },
  })

  const learnedCount = bookWords.filter((bw) => bw.word.learned).length

  return NextResponse.json({
    book: {
      id: book.id,
      title: book.title,
      pageCount: book.pageCount,
      totalUses: book.totalUses,
      wordCount: bookWords.length,
      learnedCount,
      createdAt: book.createdAt.toISOString(),
    },
    words: bookWords.map((bw) => ({
      id: bw.word.id,
      spanish: bw.word.spanish,
      english: bw.word.english ?? null,
      frequency: bw.frequency,
      isNew: bw.isNew,
      learned: bw.word.learned,
    })),
  })
}

// DELETE /api/books/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.book.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
