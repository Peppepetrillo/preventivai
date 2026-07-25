/**
 * Anteprima PDF — presenta un blob URL. Nessuna logica di generazione.
 */
export default function PdfAnteprima({
  aperto,
  blobUrl,
  titolo = "Anteprima PDF",
  onChiudi,
  onRigenera,
  inElaborazione = false,
}) {
  if (!aperto) return null;

  return (
    <div
      className="fixed inset-0 z-[80] bg-slate-950/85 backdrop-blur-sm flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdf-anteprima-title"
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/10 bg-slate-950">
        <div className="min-w-0">
          <p className="section-label">Documento</p>
          <h2 id="pdf-anteprima-title" className="ds-section-title truncate">
            {titolo}
          </h2>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          {typeof onRigenera === "function" ? (
            <button
              type="button"
              onClick={onRigenera}
              disabled={inElaborazione}
              className="btn-primary min-h-[44px] px-4 text-sm font-semibold disabled:opacity-50"
            >
              {inElaborazione ? "Generazione…" : "Rigenera PDF"}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onChiudi}
            className="btn-secondary min-h-[44px] px-4 text-sm font-semibold"
          >
            Chiudi
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-slate-900 p-3 sm:p-5">
        {blobUrl ? (
          <iframe
            title={titolo}
            src={blobUrl}
            className="w-full h-full rounded-[12px] border border-white/10 bg-white"
          />
        ) : (
          <div className="h-full flex items-center justify-center text-slate-400">
            Anteprima non disponibile.
          </div>
        )}
      </div>
    </div>
  );
}
