import { addDaysToKey } from '../helpers/helper.js'

export function computeNextReview(previousReview, rating, currentDay) {
  const previous = { ...previousReview }
  const next = { ...previous, lastRating: rating }
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

  return next
}
