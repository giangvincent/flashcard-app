export function DarkModeToggle({ darkMode, toggleDarkMode }) {
  return (
    <button
      className="dark-mode-toggle"
      type="button"
      onClick={toggleDarkMode}
      aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-pressed={darkMode}
      title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {darkMode ? '☀️' : '🌙'}
    </button>
  )
}
