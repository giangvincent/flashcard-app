import { useEffect, useMemo, useState } from 'react'
import { deckData } from './data/cards.js'
import { todayKey, loadState as loadStateHelper, shuffleForToday } from './helpers/helper.js'

const STORAGE_KEY = 'german-srs-state-v2'
const DAY = 24 * 60 * 60 * 1000
const TRANSLATE_ENDPOINT =
  import.meta.env.VITE_TRANSLATE_ENDPOINT || 'http://127.0.0.1:8787/api/translate'

const labels = {
  words: 'Words',
  sentences: 'Sentences',
  grammar: 'Grammar',
}

const defaultState = {
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

const emptyEditor = {
  type: 'words',
  level: 'A1',
  front: '',
  back: '',
  hint: '',
}

const importStopwords = new Set([
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

function loadState() {
  const saved = loadStateHelper(STORAGE_KEY, null)
  if (saved === null) {
    return structuredClone(defaultState)
  }
  return {
    ...defaultState,
    ...saved,
    quotas: { ...defaultState.quotas, ...saved?.quotas },
  }
}

function dateToDays(value) {
  return Math.floor(new Date(value).getTime() / DAY)
}

function daysToDate(days) {
  return new Date(days * DAY).toISOString().slice(0, 10)
}

function addDaysToKey(dayKey, offset) {
  return daysToDate(dateToDays(dayKey) + offset)
}

function App() {
  const [state, setState] = useState(loadState)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showingAnswer, setShowingAnswer] = useState(false)
  const [sourceOpen, setSourceOpen] = useState(false)
  const [editorMode, setEditorMode] = useState('edit')
  const [editingCardId, setEditingCardId] = useState(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editorDraft, setEditorDraft] = useState(emptyEditor)
  const [pendingFocusCardId, setPendingFocusCardId] = useState(null)
  const [importOpen, setImportOpen] = useState(false)
  const [importText, setImportText] = useState('')
  const [importRows, setImportRows] = useState([])
  const [isTranslating, setIsTranslating] = useState(false)
  const [translationError, setTranslationError] = useState('')
  const [darkMode, setDarkMode] = useState(false)
  const currentDay = todayKey()

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark-mode')
    } else {
      document.documentElement.classList.remove('dark-mode')
    }
  }, [darkMode])

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
  }

  const allCards = useMemo(() => {
    const generated = deckData.cards.map((card) => ({
      ...card,
      ...(state.editedCards?.[card.id] || {}),
    }))
    return [...generated, ...Object.values(state.customCards || {})]
  }, [state.customCards, state.editedCards])

  const isDeleted = (card) => Boolean(state.deletedCards?.[card.id])
  const getReview = (card) => state.reviews[card.id] || null
  const isNew = (card) => !getReview(card)
  const isDue = (card) => {
    const review = getReview(card)
    return review && review.due <= currentDay
  }
  const learnedTodayCount = (type) =>
    Object.values(state.reviews).filter(
      (review) => review.type === type && review.learnedOn === currentDay,
    ).length
  const replacementCreditCount = (type) =>
    state.replacementCredits?.[currentDay]?.[type] || 0

  const filteredCards = useMemo(
    () =>
      allCards.filter((card) => {
        const typeMatch = card.type === state.selectedType
        const levelMatch = state.selectedLevel === 'all' || card.level === state.selectedLevel
        return typeMatch && levelMatch && !isDeleted(card)
      }),
    [allCards, state.deletedCards, state.selectedLevel, state.selectedType],
  )

  const queue = useMemo(() => {
    const quota = state.quotas[state.selectedType] || 0
    const remainingNew = Math.max(
      0,
      quota + replacementCreditCount(state.selectedType) - learnedTodayCount(state.selectedType),
    )
    const due = filteredCards
      .filter(isDue)
      .sort((a, b) => getReview(a).due.localeCompare(getReview(b).due))
    const newCards = filteredCards.filter(isNew)
    const customFresh = newCards.filter((card) => card.source === 'Custom' || card.tags?.includes('custom'))
    const generatedFresh = shuffleForToday(
      newCards.filter((card) => card.source !== 'Custom' && !card.tags?.includes('custom'))
    )
    const fresh = [...customFresh, ...generatedFresh].slice(0, remainingNew)
    const future = filteredCards
      .filter((card) => getReview(card) && !isDue(card))
      .sort((a, b) => getReview(a).due.localeCompare(getReview(b).due))

    return [...due, ...fresh, ...future]
  }, [filteredCards, state])

  useEffect(() => {
    if (currentIndex >= queue.length) setCurrentIndex(0)
  }, [currentIndex, queue.length])

  useEffect(() => {
    if (!pendingFocusCardId) return
    const focusIndex = queue.findIndex((card) => card.id === pendingFocusCardId)
    if (focusIndex >= 0) {
      setCurrentIndex(focusIndex)
      setPendingFocusCardId(null)
    }
  }, [pendingFocusCardId, queue])

  const currentCard = queue[currentIndex]
  const dueNow = filteredCards.filter(isDue).length
  const freshAllowed = Math.max(
    0,
    (state.quotas[state.selectedType] || 0) +
      replacementCreditCount(state.selectedType) -
      learnedTodayCount(state.selectedType),
  )

  const cardsByType = useMemo(
    () => ({
      words: allCards.filter((card) => card.type === 'words' && !isDeleted(card)),
      sentences: allCards.filter((card) => card.type === 'sentences' && !isDeleted(card)),
      grammar: allCards.filter((card) => card.type === 'grammar' && !isDeleted(card)),
    }),
    [allCards, state.deletedCards],
  )

  const masteredCount = Object.values(state.reviews).filter((review) => review.interval >= 21).length
  const dueCount = allCards.filter((card) => !isDeleted(card) && isDue(card)).length
  const translationLookup = useMemo(() => {
    const lookup = new Map()
    for (const card of allCards) {
      if (!card.front || !card.back) continue
      const key = card.front.toLowerCase().trim()
      if (!lookup.has(key)) lookup.set(key, card.back)
    }
    return lookup
  }, [allCards])
  const streak = (() => {
    let count = 0
    for (let offset = 0; offset > -365; offset -= 1) {
      if (!state.history[addDaysToKey(currentDay, offset)]?.reviews) break
      count += 1
    }
    return count
  })()

  function changeType(type) {
    setState((current) => ({ ...current, selectedType: type }))
    setCurrentIndex(0)
    setShowingAnswer(false)
  }

  function changeLevel(level) {
    setState((current) => ({ ...current, selectedLevel: level }))
    setCurrentIndex(0)
    setShowingAnswer(false)
  }

  function changeQuota(type, value) {
    setState((current) => ({
      ...current,
      quotas: { ...current.quotas, [type]: Math.max(0, Number(value) || 0) },
    }))
  }

  function reviewCard(rating) {
    if (!currentCard) return
    const previous = getReview(currentCard) || {
      reps: 0,
      lapses: 0,
      interval: 0,
      ease: 2.5,
      learnedOn: currentDay,
    }
    const next = { ...previous, type: currentCard.type, level: currentCard.level, lastRating: rating }
    const interval = Math.max(0, previous.interval)

    if (rating === 'again') {
      next.interval = 0
      next.ease = Math.max(1.3, previous.ease - 0.25)
      next.lapses = previous.lapses + 1
      next.due = currentDay
    }
    if (rating === 'hard') {
      next.interval = Math.max(1, Math.ceil(interval * 1.25 || 1))
      next.ease = Math.max(1.3, previous.ease - 0.15)
      next.due = addDaysToKey(currentDay, next.interval)
    }
    if (rating === 'good') {
      next.interval = previous.reps === 0 ? 1 : Math.max(2, Math.ceil(interval * previous.ease))
      next.ease = previous.ease
      next.due = addDaysToKey(currentDay, next.interval)
    }
    if (rating === 'easy') {
      next.interval = previous.reps === 0 ? 4 : Math.max(4, Math.ceil(interval * (previous.ease + 0.45)))
      next.ease = Math.min(3.2, previous.ease + 0.15)
      next.due = addDaysToKey(currentDay, next.interval)
    }

    next.reps = previous.reps + 1
    next.lastReviewed = currentDay
    next.learnedOn = previous.learnedOn || currentDay

    setState((current) => {
      const history = {
        ...current.history,
        [currentDay]: {
          reviews: (current.history[currentDay]?.reviews || 0) + 1,
          learned:
            (current.history[currentDay]?.learned || 0) +
            (previous.reps === 0 && rating !== 'again' ? 1 : 0),
        },
      }
      return {
        ...current,
        reviews: { ...current.reviews, [currentCard.id]: next },
        history,
      }
    })
    setShowingAnswer(false)
    setCurrentIndex((index) => index + 1)
  }

  function deleteCurrentCard() {
    if (!currentCard) return
    const shouldAddReplacement = !isNew(currentCard)
    setState((current) => {
      const reviews = { ...current.reviews }
      delete reviews[currentCard.id]
      const replacementCredits = { ...(current.replacementCredits || {}) }
      if (shouldAddReplacement) {
        replacementCredits[currentDay] = {
          ...(replacementCredits[currentDay] || {}),
          [currentCard.type]: (replacementCredits[currentDay]?.[currentCard.type] || 0) + 1,
        }
      }
      return {
        ...current,
        reviews,
        deletedCards: {
          ...(current.deletedCards || {}),
          [currentCard.id]: {
            deletedOn: currentDay,
            type: currentCard.type,
            level: currentCard.level,
            front: currentCard.front,
          },
        },
        replacementCredits,
      }
    })
    setShowingAnswer(false)
  }

  function selectedEditorLevel(card) {
    if (card?.level) return card.level
    return state.selectedLevel === 'all' ? 'A1' : state.selectedLevel
  }

  function openCardEditor(mode) {
    if (mode === 'edit' && !currentCard) return
    setEditorMode(mode)
    setEditingCardId(mode === 'edit' ? currentCard.id : null)
    setEditorDraft(
      mode === 'new'
        ? {
            ...emptyEditor,
            type: state.selectedType,
            level: selectedEditorLevel(),
            hint: `Custom ${labels[state.selectedType].toLowerCase()} card`,
          }
        : {
            type: currentCard.type,
            level: selectedEditorLevel(currentCard),
            front: currentCard.front,
            back: currentCard.back,
            hint: currentCard.hint || '',
          },
    )
    setEditorOpen(true)
  }

  function saveEditorCard(event) {
    event.preventDefault()
    if (!editorDraft.front.trim() || !editorDraft.back.trim()) return

    if (editorMode === 'new') {
      const id = `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
      const card = {
        id,
        type: editorDraft.type,
        level: editorDraft.level,
        front: editorDraft.front.trim(),
        back: editorDraft.back.trim(),
        hint: editorDraft.hint.trim(),
        source: 'Custom',
        tags: ['custom'],
      }
      setState((current) => ({
        ...current,
        selectedType: card.type,
        selectedLevel: card.level,
        customCards: { ...(current.customCards || {}), [id]: card },
      }))
      setCurrentIndex(0)
      setPendingFocusCardId(id)
    } else if (editingCardId) {
      const updated = {
        type: editorDraft.type,
        level: editorDraft.level,
        front: editorDraft.front.trim(),
        back: editorDraft.back.trim(),
        hint: editorDraft.hint.trim(),
      }
      setState((current) => {
        const reviews = { ...current.reviews }
        if (reviews[editingCardId]) {
          reviews[editingCardId] = {
            ...reviews[editingCardId],
            type: updated.type,
            level: updated.level,
          }
        }
        if (current.customCards?.[editingCardId]) {
          return {
            ...current,
            selectedType: updated.type,
            selectedLevel: updated.level,
            reviews,
            customCards: {
              ...current.customCards,
              [editingCardId]: { ...current.customCards[editingCardId], ...updated },
            },
          }
        }
        return {
          ...current,
          selectedType: updated.type,
          selectedLevel: updated.level,
          reviews,
          editedCards: { ...(current.editedCards || {}), [editingCardId]: updated },
        }
      })
      setPendingFocusCardId(editingCardId)
    }

    setShowingAnswer(false)
    setEditorOpen(false)
  }

  function resetProgress() {
    if (!confirm('Reset all review progress and daily history?')) return
    setState((current) => ({
      ...current,
      reviews: {},
      history: {},
      replacementCredits: {},
    }))
    setCurrentIndex(0)
    setShowingAnswer(false)
  }

  function splitGermanSentences(text) {
    return text
      .replace(/\s+/g, ' ')
      .replace(/…/g, '.')
      .match(/(?:[A-ZÄÖÜ][^.!?]*[:]\s*)?[^.!?]+[.!?]+/g)
      ?.map((sentence) => sentence.trim().replace(/\s+([!?.,])/g, '$1'))
      .filter(Boolean) || []
  }

  function extractImportWords(text) {
    const words = text.match(/[A-Za-zÄÖÜäöüß]{4,}/g) || []
    const seen = new Set()
    return words
      .map((word) => word.trim())
      .filter((word) => {
        const normalized = word.toLowerCase()
        if (importStopwords.has(normalized) || seen.has(normalized)) return false
        seen.add(normalized)
        return true
      })
      .slice(0, 80)
  }

  function buildImportPreview() {
    const sentenceRows = splitGermanSentences(importText).map((front, index) => ({
      id: `preview-sentence-${index}`,
      selected: true,
      type: 'sentences',
      level: 'B1',
      front,
      back: '',
    }))
    const wordRows = extractImportWords(importText).map((front, index) => ({
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

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">German study deck</p>
          <h1>Spaced repetition from your books</h1>
        </div>
        <div className="today-panel">
          <span>{currentDay}</span>
          <strong>{dueCount} due</strong>
        </div>
      </header>

      <section className="stats-grid" aria-label="Study progress">
        <ProgressCard title="Words" progress={`${learnedTodayCount('words')} / ${state.quotas.words || 0}`} total={`${cardsByType.words.length} cards`} />
        <ProgressCard title="Sentences" progress={`${learnedTodayCount('sentences')} / ${state.quotas.sentences || 0}`} total={`${cardsByType.sentences.length} cards`} />
        <ProgressCard title="Grammar" progress={`${learnedTodayCount('grammar')} / ${state.quotas.grammar || 0}`} total={`${cardsByType.grammar.length} cards`} />
        <ProgressCard title="Streak" progress={`${streak} days`} total={`${masteredCount} mastered`} />
      </section>

      <section className="workspace">
        <aside className="sidebar" aria-label="Deck controls">
          <div className="control-group">
            <label>Deck part</label>
            <div className="segmented">
              {Object.entries(labels).map(([type, label]) => (
                <button
                  key={type}
                  type="button"
                  className={type === state.selectedType ? 'active' : ''}
                  onClick={() => changeType(type)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="control-group">
            <label htmlFor="levelFilter">Level</label>
            <select id="levelFilter" value={state.selectedLevel} onChange={(event) => changeLevel(event.target.value)}>
              <option value="all">All levels</option>
              <option value="A1">A1</option>
              <option value="A2">A2</option>
              <option value="B1">B1</option>
              <option value="B2">B2</option>
              <option value="C1">C1</option>
            </select>
          </div>

          <div className="control-group">
            <label>New cards per day</label>
            {Object.entries(labels).map(([type, label]) => (
              <div className="quota-row" key={type}>
                <span>{label}</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={state.quotas[type] || 0}
                  onChange={(event) => changeQuota(type, event.target.value)}
                />
              </div>
            ))}
          </div>

          <div className="control-group source-box">
            <label>Extraction</label>
            <p>
              {deckData.summary.total || 0} cards from {deckData.sources.length} PDFs. Generated{' '}
              {deckData.generatedAt}.
            </p>
            <button type="button" onClick={() => setSourceOpen(true)}>
              Show sources
            </button>
            <button type="button" onClick={() => setImportOpen(true)}>
              Import pasted text
            </button>
          </div>
        </aside>

        <section className="study-panel" aria-label="Flashcard study">
          <div className="queue-strip">
            <span>{queue.length ? `${currentIndex + 1} of ${queue.length} in queue` : 'No cards match this filter'}</span>
            <span>
              {currentCard
                ? `${currentCard.level} | ${isNew(currentCard) ? 'new' : isDue(currentCard) ? 'due' : `scheduled ${getReview(currentCard).due}`} | ${dueNow} due | ${freshAllowed} new left today`
                : ''}
            </span>
          </div>

          <button
            type="button"
            className={`flashcard${showingAnswer ? ' is-answer' : ''}`}
            aria-pressed={showingAnswer}
            onClick={() => setShowingAnswer((value) => !value)}
          >
            <span className="card-inner">
              <span className="card-face card-face-front">
                <span className="card-hint">{currentCard?.hint || labels[state.selectedType]}</span>
                <span className="card-main">{currentCard?.front || 'Nothing to study here yet'}</span>
                <span className="card-action">Tap to flip</span>
              </span>
              <span className="card-face card-face-back">
                <span className="card-hint">Answer</span>
                <span className="card-answer">{currentCard?.back || ''}</span>
                <span className="card-action">Tap to return</span>
              </span>
            </span>
          </button>

          <div className="review-actions">
            {['again', 'hard', 'good', 'easy'].map((rating) => (
              <button key={rating} type="button" data-rating={rating} onClick={() => reviewCard(rating)}>
                {rating[0].toUpperCase() + rating.slice(1)}
              </button>
            ))}
          </div>

          <div className="utility-actions">
            <button
              type="button"
              onClick={() => {
                setShowingAnswer(false)
                setCurrentIndex(queue.length ? (currentIndex + 1) % queue.length : 0)
              }}
            >
              Skip
            </button>
            <button type="button" onClick={() => openCardEditor('edit')}>
              Edit card
            </button>
            <button type="button" onClick={() => openCardEditor('new')}>
              New card
            </button>
            <button className="danger-action" type="button" onClick={deleteCurrentCard}>
              Delete card
            </button>
            <button type="button" onClick={resetProgress}>
              Reset progress
            </button>
          </div>
        </section>
      </section>

      {sourceOpen && (
        <dialog open>
          <div className="dialog-head">
            <h2>Source coverage</h2>
            <button type="button" aria-label="Close" onClick={() => setSourceOpen(false)}>
              X
            </button>
          </div>
          <div className="source-list">
            {deckData.sources.map((source) => (
              <article key={source.name}>
                <strong>{source.name}</strong>
                <span>{source.pages} pages</span>
                <span>{source.characters.toLocaleString()} extracted characters</span>
                <em>{source.status}</em>
              </article>
            ))}
          </div>
        </dialog>
      )}

      {editorOpen && (
        <dialog open>
          <form className="editor-form" onSubmit={saveEditorCard}>
            <div className="dialog-head">
              <h2>{editorMode === 'new' ? 'New card' : 'Edit card'}</h2>
              <button type="button" aria-label="Close" onClick={() => setEditorOpen(false)}>
                X
              </button>
            </div>
            <div className="editor-grid">
              <label>
                Deck part
                <select
                  value={editorDraft.type}
                  onChange={(event) => setEditorDraft((draft) => ({ ...draft, type: event.target.value }))}
                >
                  <option value="words">Words</option>
                  <option value="sentences">Sentences</option>
                  <option value="grammar">Grammar</option>
                </select>
              </label>
              <label>
                Level
                <select
                  value={editorDraft.level}
                  onChange={(event) => setEditorDraft((draft) => ({ ...draft, level: event.target.value }))}
                >
                  <option value="A1">A1</option>
                  <option value="A2">A2</option>
                  <option value="B1">B1</option>
                  <option value="B2">B2</option>
                  <option value="C1">C1</option>
                </select>
              </label>
              <label className="wide-field">
                Front
                <textarea
                  required
                  rows="3"
                  value={editorDraft.front}
                  onChange={(event) => setEditorDraft((draft) => ({ ...draft, front: event.target.value }))}
                />
              </label>
              <label className="wide-field">
                Back
                <textarea
                  required
                  rows="3"
                  value={editorDraft.back}
                  onChange={(event) => setEditorDraft((draft) => ({ ...draft, back: event.target.value }))}
                />
              </label>
              <label className="wide-field">
                Hint
                <input
                  type="text"
                  value={editorDraft.hint}
                  onChange={(event) => setEditorDraft((draft) => ({ ...draft, hint: event.target.value }))}
                />
              </label>
            </div>
            <div className="editor-actions">
              <button type="button" onClick={() => setEditorOpen(false)}>
                Cancel
              </button>
              <button className="primary-action" type="submit">
                Save card
              </button>
            </div>
          </form>
        </dialog>
      )}

      {importOpen && (
        <dialog open className="import-dialog">
          <form className="import-form" onSubmit={importSelectedRows}>
            <div className="dialog-head">
              <h2>Import pasted text</h2>
              <button type="button" aria-label="Close" onClick={() => setImportOpen(false)}>
                X
              </button>
            </div>
            <div className="import-body">
              <label className="wide-field">
                German content
                <textarea
                  rows="7"
                  value={importText}
                  onChange={(event) => setImportText(event.target.value)}
                  placeholder="Paste German text or dialogue here"
                />
              </label>
              <div className="import-toolbar">
                <div className="import-toolbar-actions">
                  <button type="button" onClick={buildImportPreview}>
                    Split content
                  </button>
                  <button
                    type="button"
                    onClick={autoTranslateRows}
                    disabled={
                      isTranslating ||
                      !importRows.some((row) => row.selected && row.front.trim())
                    }
                  >
                    {isTranslating ? 'Translating...' : 'Auto translate'}
                  </button>
                </div>
                <span>
                  {importRows.filter((row) => row.selected).length} selected / {importRows.length} found
                </span>
              </div>
              {translationError && <p className="import-error">{translationError}</p>}
              {importRows.length > 0 && (
                <div className="import-list">
                  {importRows.map((row) => (
                    <article className="import-row" key={row.id}>
                      <label className="import-check">
                        <input
                          type="checkbox"
                          checked={row.selected}
                          onChange={(event) => updateImportRow(row.id, { selected: event.target.checked })}
                        />
                        Import
                      </label>
                      <select value={row.type} onChange={(event) => updateImportRow(row.id, { type: event.target.value })}>
                        <option value="words">Word</option>
                        <option value="sentences">Sentence</option>
                        <option value="grammar">Grammar</option>
                      </select>
                      <select value={row.level} onChange={(event) => updateImportRow(row.id, { level: event.target.value })}>
                        <option value="A1">A1</option>
                        <option value="A2">A2</option>
                        <option value="B1">B1</option>
                        <option value="B2">B2</option>
                        <option value="C1">C1</option>
                      </select>
                      <textarea
                        rows="2"
                        value={row.front}
                        onChange={(event) => updateImportRow(row.id, { front: event.target.value })}
                        aria-label="German item"
                      />
                      <textarea
                        rows="2"
                        value={row.back}
                        onChange={(event) => updateImportRow(row.id, { back: event.target.value })}
                        aria-label="English translation"
                        placeholder="English translation required"
                      />
                    </article>
                  ))}
                </div>
              )}
            </div>
            <div className="editor-actions">
              <button type="button" onClick={() => setImportOpen(false)}>
                Cancel
              </button>
              <button className="primary-action" type="submit">
                Import selected
              </button>
            </div>
          </form>
        </dialog>
      )}

      <button
        className="dark-mode-toggle"
        type="button"
        onClick={toggleDarkMode}
        aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        aria-pressed={darkMode}
        title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {darkMode ? '☀️' : '🌙'}
      </button>
    </main>
  )
}

function ProgressCard({ title, progress, total }) {
  return (
    <article>
      <span>{title}</span>
      <strong>{progress}</strong>
      <small>{total}</small>
    </article>
  )
}

export default App
