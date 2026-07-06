import { computeNextReview } from '../logic/srs.js'

export function useStudyActions({
  currentCard,
  currentDay,
  getReview,
  isNew,
  setCurrentIndex,
  setShowingAnswer,
  setState,
}) {
  function reviewCard(rating) {
    if (!currentCard) return

    const previous = getReview(currentCard) || {
      reps: 0,
      lapses: 0,
      interval: 0,
      ease: 2.5,
      learnedOn: currentDay,
    }
    const next = computeNextReview(
      { ...previous, type: currentCard.type, level: currentCard.level },
      rating,
      currentDay,
    )

    setState((current) => ({
      ...current,
      reviews: { ...current.reviews, [currentCard.id]: next },
      history: {
        ...current.history,
        [currentDay]: {
          reviews: (current.history[currentDay]?.reviews || 0) + 1,
          learned:
            (current.history[currentDay]?.learned || 0) +
            (previous.reps === 0 && rating !== 'again' ? 1 : 0),
        },
      },
    }))
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

  return { deleteCurrentCard, resetProgress, reviewCard }
}
