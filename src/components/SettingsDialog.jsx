export function SettingsDialog({
  changeLevel,
  changeQuota,
  changeType,
  generatedAt,
  labels,
  onClose,
  onImportOpen,
  onSourceOpen,
  open,
  quotas,
  selectedLevel,
  selectedType,
  sourceCount,
  totalCards,
}) {
  if (!open) return null

  return (
    <dialog
      open
      aria-label="Settings"
      aria-modal="true"
      onClose={onClose}
    >
      <form method="dialog" className="settings-form">
        <div className="dialog-head">
          <h2>Settings</h2>
          <button type="button" onClick={onClose} aria-label="Close settings">
            ✕
          </button>
        </div>

        <div className="settings-body">
          <div className="control-group">
            <label>Deck part</label>
            <div className="segmented">
              {Object.entries(labels).map(([type, label]) => (
                <button
                  key={type}
                  type="button"
                  className={type === selectedType ? 'active' : ''}
                  onClick={() => changeType(type)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="control-group">
            <label htmlFor="settingsLevelFilter">Level</label>
            <select
              id="settingsLevelFilter"
              value={selectedLevel}
              onChange={(event) => changeLevel(event.target.value)}
            >
              <option value="all">All levels</option>
              <option value="A1">A1</option>
              <option value="A2">A2</option>
              <option value="B1">B1</option>
              <option value="B2">B2</option>
              <option value="C1">C1</option>
            </select>
          </div>

          <div className="control-group">
            <label>New cards per day</label>
            {Object.entries(labels).map(([type, label]) => (
              <div className="quota-row" key={type}>
                <span>{label}</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={quotas[type] || 0}
                  onChange={(event) => changeQuota(type, event.target.value)}
                />
              </div>
            ))}
          </div>

          <div className="control-group source-box">
            <label>Extraction</label>
            <p>
              {totalCards || 0} cards from {sourceCount} PDFs. Generated {generatedAt}.
            </p>
            <button type="button" onClick={onSourceOpen}>
              Show sources
            </button>
            <button type="button" onClick={onImportOpen}>
              Import pasted text
            </button>
          </div>
        </div>
      </form>
    </dialog>
  )
}
