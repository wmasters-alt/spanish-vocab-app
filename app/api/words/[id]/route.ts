import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// PATCH /api/words/[id] — toggle learned
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { learned } = await req.json() as { learned: boolean }
  const word = await prisma.word.update({
    where: { id },
    data: { learned: Boolean(learned) },
    select: { id: true, learned: true },
  })
  return NextResponse.json(word)
}
