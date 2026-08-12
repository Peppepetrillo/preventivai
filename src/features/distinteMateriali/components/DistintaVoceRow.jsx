import { Link2, Pencil, Trash2 } from "lucide-react";

/**
 * Riga voce in editor distinta.
 */
export default function DistintaVoceRow({ voce, onModifica, onElimina }) {
  const prezzo =
    voce?.prezzoUnitario != null && Number.isFinite(Number(voce.prezzoUnitario))
      ? Number(voce.prezzoUnitario)
      : null;
  const isAccessorio = Boolean(voce?.parentVoceId);

  return (
    <article className="pro-panel px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="ds-text-primary truncate">{voce.nome}</p>
          <p className="ds-text-secondary text-sm mt-1">
            {voce.quantita} {voce.unita}
            {prezzo != null
              ? ` · ${prezzo.toLocaleString("it-IT", {
                  style: "currency",
                  currency: "EUR",
                })}`
              : ""}
          </p>
          {isAccessorio ? (
            <p className="ds-text-secondary text-xs mt-1 inline-flex items-center gap-1">
              <Link2 size={12} aria-hidden="true" />
              Accessorio suggerito
            </p>
          ) : null}
          {voce.note ? (
            <p className="ds-text-secondary text-xs mt-1 truncate">{voce.note}</p>
          ) : null}
        </div>
        <div className="flex gap-1 shrink-0">
          <button
            type="button"
            onClick={() => onModifica?.(voce)}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-[16px] bg-white/10 text-slate-200"
            aria-label={`Modifica ${voce.nome}`}
          >
            <Pencil size={18} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => onElimina?.(voce.id)}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-[16px] bg-white/10 text-red-300"
            aria-label={`Elimina ${voce.nome}`}
          >
            <Trash2 size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );
}
