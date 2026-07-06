export function ProgressBadges({ learnedTodayCount, masteredCount, quotas, streak }) {
  const badges = [
    { icon: '📝', label: 'Words', value: `${learnedTodayCount('words')}/${quotas.words || 0}` },
    {
      icon: '💬',
      label: 'Sentences',
      value: `${learnedTodayCount('sentences')}/${quotas.sentences || 0}`,
    },
    {
      icon: '📖',
      label: 'Grammar',
      value: `${learnedTodayCount('grammar')}/${quotas.grammar || 0}`,
    },
    { icon: '🔥', label: 'Streak', value: `${streak}d` },
  ]

  return (
    <div className="progress-badges" aria-label="Study progress">
      {badges.map(({ icon, label, value }) => (
        <div className="badge-pill" key={label} title={label}>
          <span className="badge-icon" aria-hidden="true">
            {icon}
          </span>
          <span className="badge-value">{value}</span>
        </div>
      ))}
    </div>
  )
}
