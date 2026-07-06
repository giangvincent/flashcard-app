export function StudyPanel({
  currentCard,
  currentIndex,
  dueNow,
  freshAllowed,
  getReview,
  isDue,
  isNew,
  labels,
  openCardEditor,
  queue,
  resetProgress,
  reviewCard,
  selectedType,
  setCurrentIndex,
  setShowingAnswer,
  showingAnswer,
  deleteCurrentCard,
}) {
  return (
    <section className="study-panel" aria-label="Flashcard study">
      <div className="queue-strip">
        <span>{queue.length ? `${currentIndex + 1} of ${queue.length} in queue` : 'No cards match this filter'}</span>
        <span>
          {currentCard
            ? `${currentCard.level} | ${isNew(currentCard) ? 'new' : isDue(currentCard) ? 'due' : `scheduled ${getReview(currentCard).due}`} | ${dueNow} due | ${freshAllowed} new left today`
            : ''}
        </span>
      </div>

      <button
        type="button"
        className={`flashcard${showingAnswer ? ' is-answer' : ''}`}
        aria-pressed={showingAnswer}
        onClick={() => setShowingAnswer((value) => !value)}
      >
        <span className="card-inner">
          <span className="card-face card-face-front">
            <span className="card-hint">{currentCard?.hint || labels[selectedType]}</span>
            <span className="card-main">{currentCard?.front || 'Nothing to study here yet'}</span>
            <span className="card-action">Tap to flip</span>
          </span>
          <span className="card-face card-face-back">
            <span className="card-hint">Answer</span>
            <span className="card-answer">{currentCard?.back || ''}</span>
            <span className="card-action">Tap to return</span>
          </span>
        </span>
      </button>

      <div className="review-actions">
        {['again', 'hard', 'good', 'easy'].map((rating) => (
          <button key={rating} type="button" data-rating={rating} onClick={() => reviewCard(rating)}>
            {rating[0].toUpperCase() + rating.slice(1)}
          </button>
        ))}
      </div>

      <div className="utility-actions">
        <button
          type="button"
          onClick={() => {
            setShowingAnswer(false)
            setCurrentIndex(queue.length ? (currentIndex + 1) % queue.length : 0)
          }}
        >
          Skip
        </button>
        <button type="button" onClick={() => openCardEditor('edit')}>
          Edit card
        </button>
        <button type="button" onClick={() => openCardEditor('new')}>
          New card
        </button>
        <button className="danger-action" type="button" onClick={deleteCurrentCard}>
          Delete card
        </button>
        <button type="button" onClick={resetProgress}>
          Reset progress
        </button>
      </div>
    </section>
  )
}
