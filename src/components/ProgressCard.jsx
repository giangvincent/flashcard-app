export function ProgressCard({ title, progress, total }) {
  return (
    <article>
      <span>{title}</span>
      <strong>{progress}</strong>
      <small>{total}</small>
    </article>
  )
}
