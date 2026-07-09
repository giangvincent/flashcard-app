// Testing asynchronous flow (translation API calls) is critical here.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useImportFlow } from '../useImportFlow.js'

const allCards = [
  { id: 'card-1', type: 'words', level: 'A1', front: 'Hallo', back: 'Hello' },
  { id: 'card-2', type: 'sentences', level: 'A1', front: 'Guten Tag', back: 'Good Day' },
  { id: 'card-3', type: 'words', level: 'A2', front: 'Danke', back: 'Thank You' },
]

describe('useImportFlow', () => {
  let setState
  let setPendingFocusCardId
  let setCurrentIndex
  let setShowingAnswer

  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
    setState = vi.fn()
    setPendingFocusCardId = vi.fn()
    setCurrentIndex = vi.fn()
    setShowingAnswer = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should initialize with default state', () => {
    const { result } = renderHook(() =>
      useImportFlow({
        allCards,
        setCurrentIndex,
        setPendingFocusCardId,
        setShowingAnswer,
        setState,
      }),
    )

    expect(result.current.importOpen).toBe(false)
    expect(result.current.importText).toBe('')
    expect(result.current.importRows).toEqual([])
    expect(result.current.isTranslating).toBe(false)
    expect(result.current.translationError).toBe('')
  })

  it('should build preview rows from import text', () => {
    const { result } = renderHook(() =>
      useImportFlow({
        allCards,
        setCurrentIndex,
        setPendingFocusCardId,
        setShowingAnswer,
        setState,
      }),
    )

    act(() => {
      result.current.setImportText('Hallo wie geht es dir. Das ist ein Test.')
    })
    act(() => {
      result.current.buildImportPreview()
    })

    expect(result.current.importRows.length).toBeGreaterThan(0)
    expect(result.current.importRows[0]).toMatchObject({
      type: 'sentences',
      front: 'Hallo wie geht es dir.',
      back: '',
    })
  })

  it('should handle auto translation when fetch succeeds', async () => {
    const mockTranslationResponse = {
      translations: [
        { translatedText: 'How are you', userFeedback: null },
        { translatedText: 'Guten Morgen', userFeedback: null },
      ],
    }

    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockTranslationResponse),
    })

    const { result } = renderHook(() =>
      useImportFlow({
        allCards,
        setCurrentIndex,
        setPendingFocusCardId,
        setShowingAnswer,
        setState,
      }),
    )

    act(() => {
      result.current.setImportText('Hallo wie geht es dir. Guten Morgen.')
    })
    act(() => {
      result.current.buildImportPreview()
    })

    // Select rows for translation
    act(() => {
      result.current.updateImportRow(result.current.importRows[0].id, { selected: true })
    })

    act(() => {
      result.current.autoTranslateRows()
    })

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100))
    })

    expect(result.current.isTranslating).toBe(false)
    expect(result.current.translationError).toBe('')
    expect(global.fetch).toHaveBeenCalled()
  })

  it('should handle translation error gracefully', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 429,
      json: () => Promise.resolve({ error: 'API rate limit exceeded' }),
    })

    const { result } = renderHook(() =>
      useImportFlow({
        allCards,
        setCurrentIndex,
        setPendingFocusCardId,
        setShowingAnswer,
        setState,
      }),
    )

    act(() => {
      result.current.setImportText('Test translation.')
    })
    act(() => {
      result.current.buildImportPreview()
    })

    // Select row for translation
    act(() => {
      if (result.current.importRows[0]) {
        result.current.updateImportRow(result.current.importRows[0].id, { selected: true })
      }
    })

    act(() => {
      result.current.autoTranslateRows()
    })

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100))
    })

    expect(result.current.isTranslating).toBe(false)
    expect(result.current.translationError).toBeTruthy()
  })

  it('should import selected rows with valid content', async () => {
    const mockTranslationResponse = {
      translations: [{ translatedText: 'Hello', userFeedback: null }],
    }

    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockTranslationResponse),
    })

    const { result } = renderHook(() =>
      useImportFlow({
        allCards,
        setCurrentIndex,
        setPendingFocusCardId,
        setShowingAnswer,
        setState,
      }),
    )

    act(() => {
      result.current.setImportText('Hallo Welt.')
    })
    act(() => {
      result.current.buildImportPreview()
    })

    // Select row and set back translation
    act(() => {
      if (result.current.importRows[0]) {
        result.current.updateImportRow(result.current.importRows[0].id, { selected: true, back: 'Hello' })
      }
    })

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100))
    })

    act(() => {
      result.current.importSelectedRows({ preventDefault: vi.fn() })
    })

    expect(result.current.importOpen).toBe(false)
    // importRows are not cleared after import in the current implementation
    expect(result.current.importRows.length).toBeGreaterThan(0)
  })
})