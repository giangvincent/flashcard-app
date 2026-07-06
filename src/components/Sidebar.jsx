export function Sidebar({
  changeLevel,
  changeQuota,
  changeType,
  generatedAt,
  labels,
  quotas,
  selectedLevel,
  selectedType,
  sourceCount,
  totalCards,
  onImportOpen,
  onSourceOpen,
}) {
  return (
    <aside className="sidebar" aria-label="Deck controls">
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
        <label htmlFor="levelFilter">Level</label>
        <select id="levelFilter" value={selectedLevel} onChange={(event) => changeLevel(event.target.value)}>
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
    </aside>
  )
}
