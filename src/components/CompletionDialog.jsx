import { labels } from '../constants/appConstants.js'

export function CompletionDialog({ onClose, onContinue, onStop, sessionStats }) {
  return (
    <dialog open aria-label="Session complete" aria-modal="true" onClose={onClose}>
      <div className="dialog-head">
        <h2>All done for today!</h2>
        <button type="button" aria-label="Close" onClick={onStop}>
          ✕
        </button>
      </div>
      <div className="completion-body">
        <div className="completion-report">
          <div className="completion-stats">
            {Object.entries(labels).map(([type, label]) => (
              <div className="completion-stat" key={type}>
                <span className="completion-stat-label">{label}</span>
                <span className="completion-stat-value">{sessionStats[type]}</span>
              </div>
            ))}
            <div className="completion-stat">
              <span className="completion-stat-label">Reviews</span>
              <span className="completion-stat-value">{sessionStats.totalReviews}</span>
            </div>
            <div className="completion-stat">
              <span className="completion-stat-label">Streak</span>
              <span className="completion-stat-value">{sessionStats.streak} {sessionStats.streak === 1 ? 'day' : 'days'}</span>
            </div>
          </div>
          <p className="completion-message">
            You've learned all your cards for today! Do you want to keep going?
          </p>
        </div>
        <div className="completion-actions">
          <button type="button" className="primary-action" onClick={onContinue}>
            Continue
          </button>
          <button type="button" onClick={onStop}>
            Stop for today
          </button>
        </div>
      </div>
    </dialog>
  )
}
