import fs from 'node:fs'
import vm from 'node:vm'

const [, , inputPath] = process.argv

if (!inputPath) {
  console.error('Usage: node scripts/import-translated-cards.mjs path/to/import.json')
  console.error('JSON shape: { "sourceName": "...", "sourceText": "...", "cards": [{ "type": "words|sentences|grammar", "level": "A1", "front": "...", "back": "..." }] }')
  process.exit(1)
}

const importData = JSON.parse(fs.readFileSync(inputPath, 'utf8'))

if (!importData.sourceName || !Array.isArray(importData.cards)) {
  throw new Error('Import file must include sourceName and cards[]')
}

const importedCards = importData.cards.map((card, index) => {
  if (!card.type || !card.level || !card.front || !card.back) {
    throw new Error(`Card ${index + 1} must include type, level, front, and translated back`)
  }

  return {
    id: card.id || `import-${slug(importData.sourceName)}-${card.type}-${String(index + 1).padStart(4, '0')}`,
    type: card.type,
    level: card.level,
    front: card.front,
    back: card.back,
    source: importData.sourceName,
    tags: card.tags || ['imported', 'translated'],
  }
})

function slug(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48)
}

function updateData(data) {
  const importedIds = new Set(importedCards.map((card) => card.id))
  data.cards = data.cards.filter((card) => !importedIds.has(card.id))
  data.cards.push(...importedCards)
  data.sources = data.sources.filter((source) => source.name !== importData.sourceName)
  data.sources.push({
    name: importData.sourceName,
    pages: 0,
    characters: (importData.sourceText || '').length,
    status: 'imported translated text',
  })
  data.summary = {
    words: data.cards.filter((card) => card.type === 'words').length,
    sentences: data.cards.filter((card) => card.type === 'sentences').length,
    grammar: data.cards.filter((card) => card.type === 'grammar').length,
    total: data.cards.length,
  }
  for (const card of data.cards) delete card.hint
  return data
}

function updateEsm(path) {
  const text = fs.readFileSync(path, 'utf8')
  const match = text.match(/^export const deckData = ([\s\S]*);\s*$/)
  if (!match) throw new Error(`Unexpected ESM format: ${path}`)
  const data = updateData(JSON.parse(match[1]))
  fs.writeFileSync(path, `export const deckData = ${JSON.stringify(data, null, 2)};\n`)
}

updateEsm('src/data/cards.js')

console.log(`Imported ${importedCards.length} translated cards from "${importData.sourceName}"`)
