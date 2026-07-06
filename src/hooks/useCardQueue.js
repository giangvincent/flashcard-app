import { useEffect, useMemo, useState } from 'react'
import { deckData } from '../data/cards.js'
import { todayKey } from '../helpers/helper.js'
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

export function useCardQueue({ state, setState, pendingFocusCardId, setPendingFocusCardId }) {
  const [currentIndex, setCurrentIndex] = useState(0)
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
  const queue = useMemo(() => buildQueue(filteredCards, state, currentDay), [filteredCards, state, currentDay])

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
  }, [pendingFocusCardId, queue, setPendingFocusCardId])

  const currentCard = queue[currentIndex]
  const dueNow = filteredCards.filter((card) => isDue(state, card, currentDay)).length
  const freshAllowed = Math.max(
    0,
    (state.quotas[state.selectedType] || 0) +
      replacementCreditCount(state, state.selectedType, currentDay) -
      learnedTodayCount(state, state.selectedType, currentDay),
  )
  const cardsByType = useMemo(() => getCardsByType(allCards, state), [allCards, state])
  const masteredCount = Object.values(state.reviews).filter((review) => review.interval >= 21).length
  const dueCount = allCards.filter(
    (card) => !isDeleted(state, card) && isDue(state, card, currentDay),
  ).length
  const streak = calculateStreak(state.history, currentDay)

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
    learnedTodayCount: (type) => learnedTodayCount(state, type, currentDay),
    masteredCount,
    queue,
    setCurrentIndex,
    setShowingAnswer,
    showingAnswer,
    streak,
  }
}
