export function SourceDialog({ onClose, sources }) {
  return (
    <dialog open aria-label="Sources" aria-modal="true" onClose={onClose}>
      <div className="dialog-head">
        <h2>Source coverage</h2>
        <button type="button" aria-label="Close" onClick={onClose}>
          X
        </button>
      </div>
      <div className="source-list">
        {sources.map((source) => (
          <article key={source.name}>
            <strong>{source.name}</strong>
            <span>{source.pages} pages</span>
            <span>{source.characters.toLocaleString()} extracted characters</span>
            <em>{source.status}</em>
          </article>
        ))}
      </div>
    </dialog>
  )
}
