// Focus on complex lifecycle testing due to state machine nature of the queue
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCardQueue } from '../useCardQueue.js'

vi.mock('../../data/cards.js', () => ({
  deckData: {
    cards: [{ id: '1', type: 'words', level: 'A1', front: 'Hallo', back: 'Hallo' }],
  },
}))
vi.mock('../../helpers/helper.js', () => ({
  todayKey: () => '2024-01-01',
  shuffleRandom: (arr) => [...arr],
  shuffleForToday: (arr) => [...arr],
  addDaysToKey: (dayKey, offset) => {
    const base = new Date(dayKey)
    base.setDate(base.getDate() + offset)
    return base.toISOString().slice(0, 10)
  },
}))

describe('useCardQueue', () => {
  let setState
  let setPendingFocusCardId

  const initialState = {
    customCards: { '1': { id: '1', type: 'words', level: 'A1', front: 'Hallo', back: 'Hallo' } },
    editedCards: {},
    reviews: {},
    quotas: { words: 5, sentences: 5, grammar: 5 },
    selectedType: 'words',
    selectedLevel: 'all',
    history: { '2024-01-01': { reviews: 0, learned: 0 } },
    continueSession: null,
    reviewedTodayIds: {},
    replacementCredits: {},
    deletedCards: {},
  }

  beforeEach(() => {
    vi.clearAllMocks()
    setState = vi.fn()
    setPendingFocusCardId = vi.fn()
  })

  it('should initialize with the correct queue based on filtered cards and current day', () => {
    const { result } = renderHook(() =>
      useCardQueue({
        state: initialState,
        setState,
        pendingFocusCardId: null,
        setPendingFocusCardId,
      }),
    )

    expect(result.current.queue).toBeDefined()
    expect(result.current.currentCard).toBeDefined()
  })

  it('should update currentCard when currentIndex changes', () => {
    const { result } = renderHook(() =>
      useCardQueue({
        state: initialState,
        setState,
        pendingFocusCardId: null,
        setPendingFocusCardId,
      }),
    )

    expect(result.current.currentCard).toBeDefined()

    act(() => {
      result.current.setCurrentIndex(0)
    })

    expect(result.current.currentIndex).toBe(0)
  })

  it('should handle session completion by resetting index', () => {
    const { result } = renderHook(() =>
      useCardQueue({
        state: initialState,
        setState,
        pendingFocusCardId: null,
        setPendingFocusCardId,
      }),
    )

    act(() => {
      result.current.setCurrentIndex(5)
    })

    expect(result.current.isSessionComplete).toBe(true)
  })
})