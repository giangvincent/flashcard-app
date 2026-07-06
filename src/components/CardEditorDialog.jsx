export function CardEditorDialog({
  editorDraft,
  editorMode,
  onClose,
  onDraftChange,
  onSubmit,
}) {
  return (
    <dialog open>
      <form className="editor-form" onSubmit={onSubmit}>
        <div className="dialog-head">
          <h2>{editorMode === 'new' ? 'New card' : 'Edit card'}</h2>
          <button type="button" aria-label="Close" onClick={onClose}>
            X
          </button>
        </div>
        <div className="editor-grid">
          <label>
            Deck part
            <select value={editorDraft.type} onChange={(event) => onDraftChange('type', event.target.value)}>
              <option value="words">Words</option>
              <option value="sentences">Sentences</option>
              <option value="grammar">Grammar</option>
            </select>
          </label>
          <label>
            Level
            <select value={editorDraft.level} onChange={(event) => onDraftChange('level', event.target.value)}>
              <option value="A1">A1</option>
              <option value="A2">A2</option>
              <option value="B1">B1</option>
              <option value="B2">B2</option>
              <option value="C1">C1</option>
            </select>
          </label>
          <label className="wide-field">
            Front
            <textarea
              required
              rows="3"
              value={editorDraft.front}
              onChange={(event) => onDraftChange('front', event.target.value)}
            />
          </label>
          <label className="wide-field">
            Back
            <textarea
              required
              rows="3"
              value={editorDraft.back}
              onChange={(event) => onDraftChange('back', event.target.value)}
            />
          </label>
          <label className="wide-field">
            Hint
            <input
              type="text"
              value={editorDraft.hint}
              onChange={(event) => onDraftChange('hint', event.target.value)}
            />
          </label>
        </div>
        <div className="editor-actions">
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="primary-action" type="submit">
            Save card
          </button>
        </div>
      </form>
    </dialog>
  )
}
