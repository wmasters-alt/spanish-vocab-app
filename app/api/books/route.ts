import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { countWords } from '@/lib/words'

// GET /api/books — list all books
export async function GET() {
  const books = await prisma.book.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { bookWords: true } },
    },
  })

  // Attach learned count per book
  const result = await Promise.all(
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

  return NextResponse.json(result)
}

// POST /api/books — receive extracted text, save to DB
export async function POST(req: NextRequest) {
  try {
    const { text, fileName, pageCount } = await req.json() as {
      text: string
      fileName: string
      pageCount: number
    }
    if (!text?.trim()) return NextResponse.json({ error: 'No text provided' }, { status: 400 })

    const numpages = pageCount ?? null
    const title = (fileName ?? 'Unknown').replace(/\.pdf$/i, '')
    const wordFreqs = countWords(text)
    const totalUses = wordFreqs.reduce((s, [, c]) => s + Number(c), 0)

    // Create book
    const book = await prisma.book.create({
      data: { title, pageCount: numpages, totalUses, text },
    })

    // Save all words
    const topWords = wordFreqs

    // Find which words already exist
    const spanishList = topWords.map(([w]) => w)
    const existing = await prisma.word.findMany({
      where: { spanish: { in: spanishList } },
      select: { id: true, spanish: true, english: true },
    })
    const existingMap = new Map(existing.map((w) => [w.spanish, w]))

    // Create missing words
    const missing = topWords.filter(([w]) => !existingMap.has(w))
    if (missing.length > 0) {
      await prisma.word.createMany({
        data: missing.map(([spanish]) => ({ spanish })),
        skipDuplicates: true,
      })
    }

    // Re-fetch all words for this book
    const allWords = await prisma.word.findMany({
      where: { spanish: { in: spanishList } },
      select: { id: true, spanish: true, english: true },
    })
    const wordMap = new Map(allWords.map((w) => [w.spanish, w]))

    // Create BookWords
    await prisma.bookWord.createMany({
      data: topWords.map(([spanish, frequency]) => {
        const word = wordMap.get(spanish)!
        return {
          bookId: book.id,
          wordId: word.id,
          frequency,
          isNew: !existingMap.has(spanish) || existingMap.get(spanish)?.english === null,
        }
      }),
      skipDuplicates: true,
    })

    // Return book + word list
    const words = topWords.map(([spanish, frequency]) => {
      const word = wordMap.get(spanish)!
      return {
        id: word.id,
        spanish,
        english: word.english ?? null,
        frequency,
        isNew: !existingMap.has(spanish) || existingMap.get(spanish)?.english === null,
      }
    })

    return NextResponse.json({
      book: {
        id: book.id,
        title: book.title,
        pageCount: numpages,
        totalUses,
        wordCount: words.length,
      },
      words,
    }, { status: 201 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('Upload error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
