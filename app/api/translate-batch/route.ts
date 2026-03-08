import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

const DEEPL_KEY = process.env.DEEPL_KEY ?? ''

async function translateWord(word: string): Promise<string | null> {
  try {
    const res = await fetch('https://api-free.deepl.com/v2/translate', {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${DEEPL_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: [word], source_lang: 'ES', target_lang: 'EN' }),
    })
    if (!res.ok) return null
    const data = await res.json()
    const t = data.translations?.[0]?.text?.trim()
    return t && t.toLowerCase() !== word.toLowerCase() ? t : null
  } catch {
    return null
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

// POST /api/translate-batch
// Body: { wordIds: string[] }
// Returns: { translations: { id, spanish, english }[] }
export async function POST(req: NextRequest) {
  const { wordIds } = await req.json() as { wordIds: string[] }
  if (!Array.isArray(wordIds) || wordIds.length === 0) {
    return NextResponse.json({ translations: [] })
  }

  // Fetch words that still need translation
  const words = await prisma.word.findMany({
    where: { id: { in: wordIds }, english: null },
    select: { id: true, spanish: true },
  })

  const results: { id: string; spanish: string; english: string }[] = []

  for (const word of words) {
    const english = await translateWord(word.spanish)
    // Save '—' for untranslatable words (names, etc.) so they aren't retried
    const saved = english ?? '—'
    await prisma.word.update({
      where: { id: word.id },
      data: { english: saved },
    })
    results.push({ id: word.id, spanish: word.spanish, english: saved })
    await sleep(100)
  }

  return NextResponse.json({ translations: results })
}
