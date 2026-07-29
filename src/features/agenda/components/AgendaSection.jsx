export default function AgendaSection({ titolo, count = 0, children, empty }) {
  return (
    <section className="mb-6" aria-label={titolo}>
      <div className="flex items-center justify-between gap-3 mb-3 px-0.5">
        <h2 className="ds-card-title">{titolo}</h2>
        {count > 0 ? (
          <span className="ds-badge ds-badge-da-iniziare">{count}</span>
        ) : null}
      </div>
      {count === 0 ? (
        <div className="pro-panel p-5 text-center">
          <p className="ds-text-secondary text-sm">{empty}</p>
        </div>
      ) : (
        children
      )}
    </section>
  );
}
