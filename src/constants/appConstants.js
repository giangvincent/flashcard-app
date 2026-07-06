export const STORAGE_KEY = 'german-srs-state-v2'
export const TRANSLATE_ENDPOINT =
  import.meta.env.VITE_TRANSLATE_ENDPOINT || 'http://127.0.0.1:8787/api/translate'

export const labels = {
  words: 'Words',
  sentences: 'Sentences',
  grammar: 'Grammar',
}

export const defaultState = {
  selectedType: 'words',
  selectedLevel: 'all',
  quotas: { words: 12, sentences: 6, grammar: 3 },
  reviews: {},
  history: {},
  deletedCards: {},
  replacementCredits: {},
  editedCards: {},
  customCards: {},
}

export const emptyEditor = {
  type: 'words',
  level: 'A1',
  front: '',
  back: '',
  hint: '',
}

export const importStopwords = new Set([
  'aber',
  'alle',
  'auch',
  'auf',
  'aus',
  'dann',
  'dass',
  'dein',
  'deine',
  'denn',
  'der',
  'die',
  'dir',
  'das',
  'ein',
  'eine',
  'einer',
  'endlich',
  'er',
  'es',
  'für',
  'geht',
  'hat',
  'heute',
  'hier',
  'ich',
  'ihr',
  'ihre',
  'ihres',
  'ist',
  'max',
  'mein',
  'mit',
  'müssen',
  'nach',
  'nathalie',
  'nicht',
  'noch',
  'sie',
  'und',
  'uns',
  'war',
  'wer',
  'wie',
  'wir',
  'zu',
])
