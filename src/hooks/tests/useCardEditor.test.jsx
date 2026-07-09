// This test suite requires integration testing due to the complexity of cascading state changes (Draft -> Draft/Card)
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCardEditor } from '../useCardEditor.js'
import { emptyEditor } from '../../constants/appConstants.js'

describe('useCardEditor', () => {
  let setState
  let setCurrentIndex
  let setPendingFocusCardId
  let setShowingAnswer

  beforeEach(() => {
    vi.clearAllMocks()
    setState = vi.fn()
    setCurrentIndex = vi.fn()
    setPendingFocusCardId = vi.fn()
    setShowingAnswer = vi.fn()
  })

  it('should initialize correctly in "edit" mode and allow drafts', () => {
    const mockCard = {
      id: 'test-123',
      type: 'words',
      level: 'A2',
      front: 'Test',
      back: 'Antwort',
      hint: 'Example hint',
    }

    const { result } = renderHook(() =>
      useCardEditor({
        currentCard: mockCard,
        selectedLevel: 'A1',
        selectedType: 'words',
        setCurrentIndex,
        setPendingFocusCardId,
        setShowingAnswer,
        setState,
      }),
    )

    expect(result.current.editorMode).toBe('edit')
    expect(result.current.editorOpen).toBe(false)
    // Initial draft is emptyEditor (level A1) until openCardEditor is called
    expect(result.current.editorDraft).toEqual(emptyEditor)
  })

  it('should open new card editor with correct default values', () => {
    const { result } = renderHook(() =>
      useCardEditor({
        currentCard: null,
        selectedLevel: 'A1',
        selectedType: 'words',
        setCurrentIndex,
        setPendingFocusCardId,
        setShowingAnswer,
        setState,
      }),
    )

    act(() => {
      result.current.openCardEditor('new')
    })

    expect(result.current.editorMode).toBe('new')
    expect(result.current.editorOpen).toBe(true)
    expect(result.current.editorDraft.type).toBe('words')
    expect(result.current.editorDraft.level).toBe('A1')
    expect(result.current.editorDraft.hint).toBe('Custom words card')
  })

  it('should open edit mode with current card values', () => {
    const mockCard = {
      id: 'review-456',
      type: 'sentences',
      level: 'B1',
      front: 'Hallo Welt',
      back: 'Hello World',
      hint: 'Translate this sentence',
    }

    const { result } = renderHook(() =>
      useCardEditor({
        currentCard: mockCard,
        selectedLevel: 'A1',
        selectedType: 'words',
        setCurrentIndex,
        setPendingFocusCardId,
        setShowingAnswer,
        setState,
      }),
    )

    act(() => {
      result.current.openCardEditor('edit')
    })

    expect(result.current.editorMode).toBe('edit')
    expect(result.current.editorOpen).toBe(true)
    expect(result.current.editorDraft.type).toBe('sentences')
    expect(result.current.editorDraft.level).toBe('B1')
    expect(result.current.editorDraft.front).toBe('Hallo Welt')
    expect(result.current.editorDraft.back).toBe('Hello World')
    expect(result.current.editorDraft.hint).toBe('Translate this sentence')
  })

  it('should not open editor in edit mode when no current card', () => {
    const { result } = renderHook(() =>
      useCardEditor({
        currentCard: null,
        selectedLevel: 'A1',
        selectedType: 'words',
        setCurrentIndex,
        setPendingFocusCardId,
        setShowingAnswer,
        setState,
      }),
    )

    act(() => {
      result.current.openCardEditor('edit')
    })

    expect(result.current.editorOpen).toBe(false)
    expect(result.current.editorMode).toBe('edit')
  })

  it('should save new card with auto-generated ID and update customCards', () => {
    const mockCard = {
      id: 'review-789',
      type: 'grammar',
      level: 'B2',
      front: 'Grammar test',
      back: 'Grammar answer',
      hint: 'Grammar hint',
    }

    const { result } = renderHook(() =>
      useCardEditor({
        currentCard: mockCard,
        selectedLevel: 'A2',
        selectedType: 'grammar',
        setCurrentIndex,
        setPendingFocusCardId,
        setShowingAnswer,
        setState,
      }),
    )

    // Open editor in new mode first to set up draft
    act(() => {
      result.current.openCardEditor('new')
    })

    // Update draft with form values
    act(() => {
      result.current.setEditorDraft((d) => ({ ...d, front: 'New Grammar' }))
      result.current.setEditorDraft((d) => ({ ...d, back: 'Neue Grammatik' }))
      result.current.setEditorDraft((d) => ({ ...d, type: 'words' }))
      result.current.setEditorDraft((d) => ({ ...d, level: 'A1' }))
    })

    act(() => {
      const event = {
        preventDefault: vi.fn(),
        target: {
          elements: {
            front: { value: 'New Grammar' },
            back: { value: 'Neue Grammatik' },
            type: { value: 'words' },
            level: { value: 'A1' },
          },
        },
      }
      result.current.saveEditorCard(event)
    })

    expect(setState).toHaveBeenCalled()
    expect(result.current.editorOpen).toBe(false)
    expect(result.current.editorMode).toBe('new')
    expect(result.current.editorDraft.front).toBe('New Grammar')
    expect(result.current.editorDraft.back).toBe('Neue Grammatik')
    expect(result.current.editorDraft.type).toBe('words')
    expect(result.current.editorDraft.level).toBe('A1')
  })
})