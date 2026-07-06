import { addDaysToKey, shuffleForToday } from '../helpers/helper.js'

export function isDeleted(state, card) {
  return Boolean(state.deletedCards?.[card.id])
}

export function getReview(state, card) {
  return state.reviews[card.id] || null
}

export function isNew(state, card) {
  return !getReview(state, card)
}

export function isDue(state, card, currentDay) {
  const review = getReview(state, card)
  return review && review.due <= currentDay
}

export function learnedTodayCount(state, type, currentDay) {
  return Object.values(state.reviews).filter(
    (review) => review.type === type && review.learnedOn === currentDay,
  ).length
}

export function replacementCreditCount(state, type, currentDay) {
  return state.replacementCredits?.[currentDay]?.[type] || 0
}

export function filterCards(allCards, state) {
  return allCards.filter((card) => {
    const typeMatch = card.type === state.selectedType
    const levelMatch = state.selectedLevel === 'all' || card.level === state.selectedLevel
    return typeMatch && levelMatch && !isDeleted(state, card)
  })
}

export function buildQueue(filteredCards, state, currentDay) {
  const quota = state.quotas[state.selectedType] || 0
  const remainingNew = Math.max(
    0,
    quota + replacementCreditCount(state, state.selectedType, currentDay) -
      learnedTodayCount(state, state.selectedType, currentDay),
  )
  const due = filteredCards
    .filter((card) => isDue(state, card, currentDay))
    .sort((a, b) => getReview(state, a).due.localeCompare(getReview(state, b).due))
  const newCards = filteredCards.filter((card) => isNew(state, card))
  const customFresh = newCards.filter(
    (card) => card.source === 'Custom' || card.tags?.includes('custom'),
  )
  const generatedFresh = shuffleForToday(
    newCards.filter((card) => card.source !== 'Custom' && !card.tags?.includes('custom')),
  )
  const fresh = [...customFresh, ...generatedFresh].slice(0, remainingNew)
  const future = filteredCards
    .filter((card) => getReview(state, card) && !isDue(state, card, currentDay))
    .sort((a, b) => getReview(state, a).due.localeCompare(getReview(state, b).due))

  return [...due, ...fresh, ...future]
}

export function getCardsByType(allCards, state) {
  return {
    words: allCards.filter((card) => card.type === 'words' && !isDeleted(state, card)),
    sentences: allCards.filter((card) => card.type === 'sentences' && !isDeleted(state, card)),
    grammar: allCards.filter((card) => card.type === 'grammar' && !isDeleted(state, card)),
  }
}

export function calculateStreak(history, currentDay) {
  let count = 0

  for (let offset = 0; offset > -365; offset -= 1) {
    if (!history[addDaysToKey(currentDay, offset)]?.reviews) break
    count += 1
  }

  return count
}
