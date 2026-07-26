/**
 * Singolo esito Controllo Qualità (solo visualizzazione).
 */

const META = {
  ERROR: {
    icona: "❌",
    bordo: "border-red-400/25 bg-red-500/10",
    titolo: "text-red-100",
  },
  WARNING: {
    icona: "⚠",
    bordo: "border-amber-400/25 bg-amber-500/10",
    titolo: "text-amber-50",
  },
  INFO: {
    icona: "ℹ",
    bordo: "border-sky-400/25 bg-sky-500/10",
    titolo: "text-sky-50",
  },
};

/**
 * @param {{
 *   item: {
 *     id?: string,
 *     type?: string,
 *     title?: string,
 *     message?: string,
 *     relatedItem?: string|null,
 *   },
 *   onApriLavorazione?: (relatedItem: string) => void,
 * }} props
 */
export default function QualityCheckItem({ item, onApriLavorazione }) {
  if (!item) return null;

  const tipo = String(item.type || "INFO").toUpperCase();
  const meta = META[tipo] || META.INFO;
  const related = item.relatedItem ? String(item.relatedItem) : null;

  function handleApri(event) {
    event.preventDefault();
    // QC-002: predisposto al click, navigazione in sprint successivi
    if (typeof onApriLavorazione === "function" && related) {
      onApriLavorazione(related);
    }
  }

  return (
    <article
      className={`rounded-[14px] border px-3.5 py-3 ${meta.bordo}`}
      data-qc-type={tipo}
      data-qc-id={item.id || undefined}
    >
      <div className="flex items-start gap-2.5">
        <span className="text-base leading-none mt-0.5 shrink-0" aria-hidden="true">
          {meta.icona}
        </span>
        <div className="min-w-0 flex-1">
          <h4 className={`text-sm font-bold leading-snug ${meta.titolo}`}>
            {item.title || "Verifica"}
          </h4>
          {item.message ? (
            <p className="mt-1.5 text-sm text-slate-300 leading-relaxed">
              {item.message}
            </p>
          ) : null}

          {related ? (
            <button
              type="button"
              onClick={handleApri}
              className="mt-3 inline-flex items-center min-h-[44px] px-1 text-sm font-semibold text-sky-300 hover:text-sky-200"
              data-related-item={related}
            >
              Apri lavorazione →
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
