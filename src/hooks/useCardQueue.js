import { useCallback, useEffect, useMemo, useState } from 'react'
import { deckData } from '../data/cards.js'
import { shuffleRandom, todayKey } from '../helpers/helper.js'
import {
  buildQueue,
  calculateStreak,
  filterCards,
  getCardsByType,
  getReview,
  isDeleted,
  isDue,
  isNew,
  learnedTodayCount,
  replacementCreditCount,
} from '../logic/queue.js'

function getLearnedCounts(state, currentDay) {
  const counts = { words: 0, sentences: 0, grammar: 0 }
  Object.values(state.reviews).forEach((review) => {
    if (review.learnedOn === currentDay && counts[review.type] !== undefined) {
      counts[review.type] += 1
    }
  })
  return counts
}

export function useCardQueue({ state, setState, pendingFocusCardId, setPendingFocusCardId }) {
  const [localIndex, setLocalIndex] = useState(0)
  const [showingAnswer, setShowingAnswer] = useState(false)
  const currentDay = todayKey()

  const allCards = useMemo(() => {
    const generated = deckData.cards.map((card) => ({
      ...card,
      ...(state.editedCards?.[card.id] || {}),
    }))
    return [...generated, ...Object.values(state.customCards || {})]
  }, [state.customCards, state.editedCards])

  const filteredCards = useMemo(() => filterCards(allCards, state), [allCards, state])
  const normalQueue = useMemo(
    () => buildQueue(filteredCards, state, currentDay),
    [filteredCards, state, currentDay],
  )

  // Determine if we're in a continue session for today
  const continueSession =
    state.continueSession?.day === currentDay ? state.continueSession : null

  // Queue: from continue session if active, otherwise normal buildQueue
  const queue = useMemo(() => {
    if (continueSession) {
      return continueSession.queue
        .map((id) => allCards.find((c) => c.id === id))
        .filter(Boolean)
    }
    return normalQueue
  }, [normalQueue, continueSession, allCards])

  // Index: from continue session (persisted) when active, otherwise local
  const currentIndex = continueSession ? continueSession.index : localIndex

  // Setter that writes back to continueSession when active
  const setCurrentIndex = useCallback(
    (value) => {
      if (continueSession) {
        setState((prev) => ({
          ...prev,
          continueSession: {
            ...prev.continueSession,
            index:
              typeof value === 'function'
                ? value(prev.continueSession.index)
                : value,
          },
        }))
      } else {
        setLocalIndex(value)
      }
    },
    [continueSession, setState],
  )

  const currentCard = queue[currentIndex]
  const dueNow = filteredCards.filter((card) => isDue(state, card, currentDay)).length
  const freshAllowed = Math.max(
    0,
    (state.quotas[state.selectedType] || 0) +
      replacementCreditCount(state, state.selectedType, currentDay) -
      learnedTodayCount(state, state.selectedType, currentDay),
  )
  const cardsByType = useMemo(() => getCardsByType(allCards, state), [allCards, state])
  const masteredCount = Object.values(state.reviews).filter(
    (review) => review.interval >= 21,
  ).length
  const dueCount = allCards.filter(
    (card) => !isDeleted(state, card) && isDue(state, card, currentDay),
  ).length
  const streak = calculateStreak(state.history, currentDay)

  // True when the current queue is exhausted (index past the last card)
  const isSessionComplete = queue.length > 0 && currentIndex >= queue.length

  // Stats for the completion report
  const sessionStats = useMemo(() => {
    const learnedCounts = getLearnedCounts(state, currentDay)
    const totalReviews = state.history[currentDay]?.reviews || 0
    return {
      words: learnedCounts.words,
      sentences: learnedCounts.sentences,
      grammar: learnedCounts.grammar,
      totalReviews,
      streak,
    }
  }, [state.reviews, state.history, currentDay, streak])

  // Build a new continuation batch
  const buildContinueBatch = useCallback(() => {
    const reviewedIds = state.reviewedTodayIds?.[currentDay] || []
    const alreadyReviewed = new Set(reviewedIds)
    const round = (state.continueSession?.round || 0) + 1
    const batchSize = state.quotas[state.selectedType] || 10

    // Cards not yet reviewed today
    const available = filteredCards.filter((card) => !alreadyReviewed.has(card.id))

    // Fall back to all filtered cards if not enough unreviewed
    const pool = available.length >= batchSize ? available : filteredCards

    // Fresh random shuffle (non-deterministic, different each time)
    const batch = shuffleRandom(pool).slice(0, batchSize)

    return {
      day: currentDay,
      queue: batch.map((c) => c.id),
      index: 0,
      round,
    }
  }, [state.reviewedTodayIds, state.continueSession, state.quotas, state.selectedType, filteredCards, currentDay])

  // Start or continue a continuation session
  const doContinueSession = useCallback(() => {
    const batch = buildContinueBatch()
    setState((prev) => ({
      ...prev,
      continueSession: batch,
    }))
  }, [buildContinueBatch, setState])

  // Stop the continuation session and dismiss the dialog
  const stopSession = useCallback(() => {
    setLocalIndex(0)
    setState((prev) => ({
      ...prev,
      continueSession: null,
    }))
  }, [setState])

  // When the index goes out of bounds and we're not at the end of a non-empty queue,
  // reset to 0 (new cards/type change). Otherwise don't auto-wrap; completion handles it.
  useEffect(() => {
    if (queue.length > 0 && currentIndex >= queue.length) {
      return
    }
    if (currentIndex >= queue.length) {
      setCurrentIndex(0)
    }
  }, [currentIndex, queue.length, setCurrentIndex])

  useEffect(() => {
    if (!pendingFocusCardId) return
    const focusIndex = queue.findIndex((card) => card.id === pendingFocusCardId)
    if (focusIndex >= 0) {
      setCurrentIndex(focusIndex)
      setPendingFocusCardId(null)
    }
  }, [pendingFocusCardId, queue, setCurrentIndex, setPendingFocusCardId])

  // Clean up continue session when day rolls over or type/level changes
  useEffect(() => {
    if (state.continueSession && state.continueSession.day !== currentDay) {
      setState((prev) => ({ ...prev, continueSession: null }))
    }
  }, [currentDay, state.continueSession, setState])

  // Reset reviewedTodayIds when day rolls over (stale key from old day)
  useEffect(() => {
    const keys = Object.keys(state.reviewedTodayIds || {})
    if (keys.length > 0 && !keys.includes(currentDay)) {
      setState((prev) => ({
        ...prev,
        reviewedTodayIds: { [currentDay]: [] },
        continueSession: null,
      }))
    }
  }, [currentDay, state.reviewedTodayIds, setState])

  function changeType(type) {
    setState((current) => ({ ...current, selectedType: type }))
    setLocalIndex(0)
    setShowingAnswer(false)
  }

  function changeLevel(level) {
    setState((current) => ({ ...current, selectedLevel: level }))
    setLocalIndex(0)
    setShowingAnswer(false)
  }

  function changeQuota(type, value) {
    setState((current) => ({
      ...current,
      quotas: { ...current.quotas, [type]: Math.max(0, Number(value) || 0) },
    }))
  }

  return {
    allCards,
    cardsByType,
    changeLevel,
    changeQuota,
    changeType,
    currentCard,
    currentDay,
    currentIndex,
    dueCount,
    dueNow,
    filteredCards,
    freshAllowed,
    getReview: (card) => getReview(state, card),
    isDue: (card) => isDue(state, card, currentDay),
    isNew: (card) => isNew(state, card),
    isSessionComplete,
    learnedTodayCount: (type) => learnedTodayCount(state, type, currentDay),
    masteredCount,
    queue,
    sessionStats,
    setCurrentIndex,
    setShowingAnswer,
    showingAnswer,
    streak,
    continueSession: doContinueSession,
    stopSession,
  }
}
