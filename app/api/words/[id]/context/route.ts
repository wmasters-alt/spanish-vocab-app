import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import Anthropic from '@anthropic-ai/sdk'

function extractSentences(text: string, word: string, max = 3): string[] {
  const normalized = text.replace(/\s+/g, ' ')
  const raw = normalized.match(/[^.!?¡¿]+[.!?]+/g) ?? []
  const wordLower = word.toLowerCase()

  const results: string[] = []
  for (const sentence of raw) {
    const tokens = sentence.toLowerCase().split(/[\s,;:"'()\[\]—–-]+/)
    if (tokens.some((t) => t === wordLower || t === `¿${wordLower}` || t === `¡${wordLower}`)) {
      results.push(sentence.trim())
      if (results.length >= max) break
    }
  }
  return results
}

// GET /api/words/[id]/context?bookId=<bookId>&type=sentences|ai
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const bookId = req.nextUrl.searchParams.get('bookId')
  const type = req.nextUrl.searchParams.get('type') // 'sentences' | 'ai' | null (both)

  const word = await prisma.word.findUnique({
    where: { id },
    select: { spanish: true, english: true },
  })
  if (!word) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // --- Sentences only (fast path) ---
  if (type === 'sentences') {
    let bookSentences: string[] = []
    if (bookId) {
      const book = await prisma.book.findUnique({
        where: { id: bookId },
        select: { text: true },
      })
      if (book?.text) bookSentences = extractSentences(book.text, word.spanish)
    }
    return NextResponse.json({ bookSentences })
  }

  // --- AI only (slow path) ---
  if (type === 'ai') {
    let ai: { explanation: string; examples: { spanish: string; english: string }[] } = {
      explanation: '',
      examples: [],
    }
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (apiKey) {
      try {
        const client = new Anthropic({ apiKey })
        const message = await client.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 600,
          messages: [
            {
              role: 'user',
              content: `For the Spanish word "${word.spanish}"${word.english ? ` (English: "${word.english}")` : ''}, provide:
1. A brief explanation of the word and its most common uses (2-3 sentences)
2. Three natural example sentences in Spanish with English translations

Respond ONLY with valid JSON in this exact format:
{"explanation":"...","examples":[{"spanish":"...","english":"..."},{"spanish":"...","english":"..."},{"spanish":"...","english":"..."}]}`,
            },
          ],
        })
        const raw = message.content[0].type === 'text' ? message.content[0].text.trim() : ''
        const match = raw.match(/\{[\s\S]*\}/)
        if (match) ai = JSON.parse(match[0])
      } catch {
        // AI unavailable
      }
    }
    return NextResponse.json({ ai })
  }

  return NextResponse.json({ error: 'Missing type param' }, { status: 400 })
}
