export function splitGermanSentences(text) {
  return (
    text
      .replace(/\s+/g, ' ')
      .replace(/…/g, '.')
      .match(/(?:[A-ZÄÖÜ][^.!?]*[:]\s*)?[^.!?]+[.!?]+/g)
      ?.map((sentence) => sentence.trim().replace(/\s+([!?.,])/g, '$1'))
      .filter(Boolean) || []
  )
}

export function extractImportWords(text, stopwords) {
  const words = text.match(/[A-Za-zÄÖÜäöüß]{4,}/g) || []
  const seen = new Set()

  return words
    .map((word) => word.trim())
    .filter((word) => {
      const normalized = word.toLowerCase()
      if (stopwords.has(normalized) || seen.has(normalized)) return false
      seen.add(normalized)
      return true
    })
    .slice(0, 80)
}

export function buildTranslationLookup(allCards) {
  const lookup = new Map()

  for (const card of allCards) {
    if (!card.front || !card.back) continue
    const key = card.front.toLowerCase().trim()
    if (!lookup.has(key)) lookup.set(key, card.back)
  }

  return lookup
}
