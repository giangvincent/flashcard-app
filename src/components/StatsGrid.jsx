import { ProgressCard } from './ProgressCard.jsx'

export function StatsGrid({ cardsByType, learnedTodayCount, masteredCount, quotas, streak }) {
  return (
    <section className="stats-grid" aria-label="Study progress">
      <ProgressCard
        title="Words"
        progress={`${learnedTodayCount('words')} / ${quotas.words || 0}`}
        total={`${cardsByType.words.length} cards`}
      />
      <ProgressCard
        title="Sentences"
        progress={`${learnedTodayCount('sentences')} / ${quotas.sentences || 0}`}
        total={`${cardsByType.sentences.length} cards`}
      />
      <ProgressCard
        title="Grammar"
        progress={`${learnedTodayCount('grammar')} / ${quotas.grammar || 0}`}
        total={`${cardsByType.grammar.length} cards`}
      />
      <ProgressCard title="Streak" progress={`${streak} days`} total={`${masteredCount} mastered`} />
    </section>
  )
}
