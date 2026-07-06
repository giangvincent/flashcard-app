export function ImportDialog({
  autoTranslateRows,
  buildImportPreview,
  importRows,
  importText,
  importSelectedRows,
  isTranslating,
  onClose,
  setImportText,
  translationError,
  updateImportRow,
}) {
  return (
    <dialog open className="import-dialog">
      <form className="import-form" onSubmit={importSelectedRows}>
        <div className="dialog-head">
          <h2>Import pasted text</h2>
          <button type="button" aria-label="Close" onClick={onClose}>
            X
          </button>
        </div>
        <div className="import-body">
          <label className="wide-field">
            German content
            <textarea
              rows="7"
              value={importText}
              onChange={(event) => setImportText(event.target.value)}
              placeholder="Paste German text or dialogue here"
            />
          </label>
          <div className="import-toolbar">
            <div className="import-toolbar-actions">
              <button type="button" onClick={buildImportPreview}>
                Split content
              </button>
              <button
                type="button"
                onClick={autoTranslateRows}
                disabled={isTranslating || !importRows.some((row) => row.selected && row.front.trim())}
              >
                {isTranslating ? 'Translating...' : 'Auto translate'}
              </button>
            </div>
            <span>
              {importRows.filter((row) => row.selected).length} selected / {importRows.length} found
            </span>
          </div>
          {translationError && <p className="import-error">{translationError}</p>}
          {importRows.length > 0 && (
            <div className="import-list">
              {importRows.map((row) => (
                <article className="import-row" key={row.id}>
                  <label className="import-check">
                    <input
                      type="checkbox"
                      checked={row.selected}
                      onChange={(event) => updateImportRow(row.id, { selected: event.target.checked })}
                    />
                    Import
                  </label>
                  <select value={row.type} onChange={(event) => updateImportRow(row.id, { type: event.target.value })}>
                    <option value="words">Word</option>
                    <option value="sentences">Sentence</option>
                    <option value="grammar">Grammar</option>
                  </select>
                  <select value={row.level} onChange={(event) => updateImportRow(row.id, { level: event.target.value })}>
                    <option value="A1">A1</option>
                    <option value="A2">A2</option>
                    <option value="B1">B1</option>
                    <option value="B2">B2</option>
                    <option value="C1">C1</option>
                  </select>
                  <textarea
                    rows="2"
                    value={row.front}
                    onChange={(event) => updateImportRow(row.id, { front: event.target.value })}
                    aria-label="German item"
                  />
                  <textarea
                    rows="2"
                    value={row.back}
                    onChange={(event) => updateImportRow(row.id, { back: event.target.value })}
                    aria-label="English translation"
                    placeholder="English translation required"
                  />
                </article>
              ))}
            </div>
          )}
        </div>
        <div className="editor-actions">
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="primary-action" type="submit">
            Import selected
          </button>
        </div>
      </form>
    </dialog>
  )
}
