export function Header({ currentDay, dueCount }) {
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">German study deck</p>
        <h1 className="text-sm">Spaced repetition from your books</h1>
      </div>
      <div className="today-panel">
        <span>{currentDay}</span>
        <strong>{dueCount} due</strong>
      </div>
    </header>
  )
}
