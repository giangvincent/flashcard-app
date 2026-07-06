export function FloatingControls({ darkMode, toggleDarkMode, settingsOpen, onSettingsToggle }) {
  return (
    <div className="floating-controls" role="group" aria-label="Quick controls">
      <button
        className="floating-btn"
        type="button"
        onClick={onSettingsToggle}
        aria-label={settingsOpen ? 'Close settings' : 'Open settings'}
        aria-pressed={settingsOpen}
        title={settingsOpen ? 'Close settings' : 'Open settings'}
      >
        ⚙️
      </button>
      <button
        className="floating-btn"
        type="button"
        onClick={toggleDarkMode}
        aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        aria-pressed={darkMode}
        title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {darkMode ? '☀️' : '🌙'}
      </button>
    </div>
  )
}
