import { useMemo, useState } from 'react'
import { TRANSLATE_ENDPOINT, importStopwords } from '../constants/appConstants.js'
import {
  buildTranslationLookup,
  extractImportWords,
  splitGermanSentences,
} from '../logic/importText.js'

export function useImportFlow({ allCards, setCurrentIndex, setPendingFocusCardId, setShowingAnswer, setState }) {
  const [importOpen, setImportOpen] = useState(false)
  const [importText, setImportText] = useState('')
  const [importRows, setImportRows] = useState([])
  const [isTranslating, setIsTranslating] = useState(false)
  const [translationError, setTranslationError] = useState('')
  const translationLookup = useMemo(() => buildTranslationLookup(allCards), [allCards])

  function buildImportPreview() {
    const sentenceRows = splitGermanSentences(importText).map((front, index) => ({
      id: `preview-sentence-${index}`,
      selected: true,
      type: 'sentences',
      level: 'B1',
      front,
      back: '',
    }))
    const wordRows = extractImportWords(importText, importStopwords).map((front, index) => ({
      id: `preview-word-${index}`,
      selected: true,
      type: 'words',
      level: 'A2',
      front,
      back: translationLookup.get(front.toLowerCase()) || '',
    }))
    setImportRows([...sentenceRows, ...wordRows])
    setTranslationError('')
  }

  function updateImportRow(id, changes) {
    setImportRows((rows) => rows.map((row) => (row.id === id ? { ...row, ...changes } : row)))
  }

  async function autoTranslateRows() {
    const selectedRows = importRows.filter((row) => row.selected && row.front.trim())
    if (!selectedRows.length || isTranslating) return

    setIsTranslating(true)
    setTranslationError('')

    try {
      const response = await fetch(TRANSLATE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: selectedRows.map((row) => ({
            text: row.front.trim(),
            type: row.type,
            level: row.level,
          })),
        }),
      })

      let payload = {}
      try {
        payload = await response.json()
      } catch {
        payload = {}
      }

      if (!response.ok) {
        throw new Error(payload.error || `Translation failed with status ${response.status}`)
      }

      const translations = Array.isArray(payload.translations) ? payload.translations : []
      setImportRows((rows) =>
        rows.map((row) => {
          const translatedIndex = selectedRows.findIndex((selected) => selected.id === row.id)
          if (translatedIndex < 0) return row
          const translation = translations[translatedIndex]
          return translation ? { ...row, back: translation } : row
        }),
      )
    } catch (error) {
      setTranslationError(
        error instanceof Error
          ? error.message
          : 'Auto translation failed. Check the translation server and API key.',
      )
    } finally {
      setIsTranslating(false)
    }
  }

  function importSelectedRows(event) {
    event.preventDefault()
    const rows = importRows.filter((row) => row.selected && row.front.trim() && row.back.trim())
    if (!rows.length) return

    const createdAt = Date.now().toString(36)
    const importedCards = {}
    rows.forEach((row, index) => {
      const id = `custom-import-${createdAt}-${String(index + 1).padStart(4, '0')}`
      importedCards[id] = {
        id,
        type: row.type,
        level: row.level,
        front: row.front.trim(),
        back: row.back.trim(),
        hint: 'Imported pasted text',
        source: 'Pasted import',
        tags: ['custom', 'imported', 'translated'],
      }
    })

    const firstCard = Object.values(importedCards)[0]
    setState((current) => ({
      ...current,
      selectedType: firstCard.type,
      selectedLevel: firstCard.level,
      customCards: { ...(current.customCards || {}), ...importedCards },
    }))
    setPendingFocusCardId(firstCard.id)
    setCurrentIndex(0)
    setShowingAnswer(false)
    setImportOpen(false)
  }

  return {
    autoTranslateRows,
    buildImportPreview,
    importOpen,
    importRows,
    importSelectedRows,
    importText,
    isTranslating,
    setImportOpen,
    setImportText,
    translationError,
    updateImportRow,
  }
}
