import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { countWords } from '@/lib/words'
import pdfParse from 'pdf-parse'

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

// POST /api/books — upload PDF, parse, save to DB
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 400 })
    }

    // Parse PDF
    const buffer = Buffer.from(await file.arrayBuffer())
    const { text, numpages } = await pdfParse(buffer)

    // Count words
    const title = file.name.replace(/\.pdf$/i, '')
    const wordFreqs = countWords(text)
    const totalUses = wordFreqs.reduce((s, [, c]) => s + c, 0)

    // Create book
    const book = await prisma.book.create({
      data: { title, pageCount: numpages, totalUses },
    })

    // Upsert words + create BookWords in batches
    const TOP = 2000
    const topWords = wordFreqs.slice(0, TOP)

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
