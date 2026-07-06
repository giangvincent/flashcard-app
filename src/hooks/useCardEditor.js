import { useState } from 'react'
import { emptyEditor, labels } from '../constants/appConstants.js'

function selectedEditorLevel(selectedLevel, card) {
  if (card?.level) return card.level
  return selectedLevel === 'all' ? 'A1' : selectedLevel
}

export function useCardEditor({
  currentCard,
  selectedLevel,
  selectedType,
  setCurrentIndex,
  setPendingFocusCardId,
  setShowingAnswer,
  setState,
}) {
  const [editorMode, setEditorMode] = useState('edit')
  const [editingCardId, setEditingCardId] = useState(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editorDraft, setEditorDraft] = useState(emptyEditor)

  function openCardEditor(mode) {
    if (mode === 'edit' && !currentCard) return

    setEditorMode(mode)
    setEditingCardId(mode === 'edit' ? currentCard.id : null)
    setEditorDraft(
      mode === 'new'
        ? {
            ...emptyEditor,
            type: selectedType,
            level: selectedEditorLevel(selectedLevel),
            hint: `Custom ${labels[selectedType].toLowerCase()} card`,
          }
        : {
            type: currentCard.type,
            level: selectedEditorLevel(selectedLevel, currentCard),
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

  return {
    editorDraft,
    editorMode,
    editorOpen,
    openCardEditor,
    saveEditorCard,
    setEditorDraft,
    setEditorOpen,
  }
}
