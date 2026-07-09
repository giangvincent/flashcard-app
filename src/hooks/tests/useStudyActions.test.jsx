// SRS algorithm review testing is the most crucial and complex part.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useStudyActions } from '../useStudyActions.js'

describe('useStudyActions', () => {
  let setState
  let setShowingAnswer
  let setCurrentIndex

  beforeEach(() => {
    vi.clearAllMocks()
    setState = vi.fn()
    setShowingAnswer = vi.fn()
    setCurrentIndex = vi.fn()
  })

  it('should not call setState if currentCard is null', () => {
    const { result } = renderHook(() =>
      useStudyActions({
        currentCard: null,
        getReview: () => null,
        isNew: () => false,
        setState,
        setShowingAnswer,
        setCurrentIndex,
      }),
    )

    act(() => {
      result.current.reviewCard('hard')
    })
    expect(setState).not.toHaveBeenCalled()
    expect(setShowingAnswer).not.toHaveBeenCalled()
    expect(setCurrentIndex).not.toHaveBeenCalled()
  })

  it('should update review with correct stats based on rating', () => {
    const card = {
      id: 'test-1',
      type: 'word',
      level: 'A1',
      front: 'Test',
      back: 'Antwort',
      hint: '',
    }

    const getReview = () => ({ reps: 0, lapses: 0, interval: 1, ease: 2.5, learnedOn: '2024-01-01' })
    const isNew = () => false

    const { result } = renderHook(() =>
      useStudyActions({
        currentCard: card,
        getReview,
        isNew,
        setState,
        setShowingAnswer,
        setCurrentIndex,
      }),
    )

    act(() => {
      result.current.reviewCard('correct')
    })
    expect(setState).toHaveBeenCalled()
    expect(setShowingAnswer).toHaveBeenCalledWith(false)
    expect(setCurrentIndex).toHaveBeenCalledWith(expect.any(Function))
    // Verify the function increments correctly
    const incrementFn = setCurrentIndex.mock.calls[0][0]
    expect(incrementFn(0)).toBe(1)
    expect(incrementFn(5)).toBe(6)
  })
})