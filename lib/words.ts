/**
 * Count word frequencies in a Spanish text.
 * Returns a map of lowercase word → count, sorted by frequency desc.
 */
export function countWords(text: string): [string, number][] {
  const clean = text.toLowerCase().replace(/[^\p{L}\s]/gu, ' ')
  // Object.create(null) avoids prototype collisions (e.g. "constructor", "toString")
  const freq = Object.create(null) as Record<string, number>
  for (const word of clean.split(/\s+/)) {
    if (!word || word.length < 2) continue
    if (/^\d+$/.test(word)) continue
    freq[word] = (freq[word] ?? 0) + 1
  }
  return Object.entries(freq).sort((a, b) => b[1] - a[1])
}
