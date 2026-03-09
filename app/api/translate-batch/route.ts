import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

const DEEPL_KEY = process.env.DEEPL_KEY ?? ''

// Translate up to 50 words in a single DeepL request
async function translateBatch(words: { id: string; spanish: string }[]) {
  const res = await fetch('https://api-free.deepl.com/v2/translate', {
    method: 'POST',
    headers: {
      'Authorization': `DeepL-Auth-Key ${DEEPL_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: words.map((w) => w.spanish),
      source_lang: 'ES',
      target_lang: 'EN',
    }),
  })

  if (!res.ok) return words.map(() => '—')

  const data = await res.json()
  return words.map((w, i) => {
    const t = data.translations?.[i]?.text?.trim()
    return t && t.toLowerCase() !== w.spanish.toLowerCase() ? t : '—'
  })
}

// POST /api/translate-batch
// Body: { wordIds: string[] }
export async function POST(req: NextRequest) {
  const { wordIds } = await req.json() as { wordIds: string[] }
  if (!Array.isArray(wordIds) || wordIds.length === 0) {
    return NextResponse.json({ translations: [] })
  }

  const words = await prisma.word.findMany({
    where: { id: { in: wordIds }, english: null },
    select: { id: true, spanish: true },
  })

  if (words.length === 0) return NextResponse.json({ translations: [] })

  // Split into chunks of 50 (DeepL max per request)
  const CHUNK = 50
  const results: { id: string; spanish: string; english: string }[] = []

  for (let i = 0; i < words.length; i += CHUNK) {
    const chunk = words.slice(i, i + CHUNK)
    const translations = await translateBatch(chunk)

    const updates = chunk.map((w, j) => ({ id: w.id, spanish: w.spanish, english: translations[j] }))

    // Save all in parallel
    await Promise.all(
      updates.map((u) => prisma.word.update({ where: { id: u.id }, data: { english: u.english } }))
    )

    results.push(...updates)
  }

  return NextResponse.json({ translations: results })
}
