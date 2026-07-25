/**
 * Elenco verifiche professionista dalla Base Tecnica.
 */

function KnowledgeVerificationList({ verifiche = [], titolo = "Da verificare" }) {
  if (!Array.isArray(verifiche) || verifiche.length === 0) return null;

  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {titolo}
      </p>
      <ul className="mt-2 space-y-1.5" role="list">
        {verifiche.map((voce) => (
          <li
            key={voce}
            className="flex items-start gap-2 text-sm text-slate-200"
          >
            <span className="mt-0.5 text-emerald-300" aria-hidden="true">
              ✓
            </span>
            <span>{voce}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default KnowledgeVerificationList;
