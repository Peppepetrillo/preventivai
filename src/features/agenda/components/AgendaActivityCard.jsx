import { createElement } from "react";
import {
  classePrioritaAttivita,
  etichettaPriorita,
  iconaCategoriaAttivita,
  Check,
  Pencil,
  Trash2,
} from "../utils/attivitaUi";

export default function AgendaActivityCard({
  attivita,
  onCompleta,
  onModifica,
  onElimina,
}) {
  const completata = attivita.stato === "completata";

  return (
    <article
      className={`pro-panel p-4 ux-enter ${completata ? "opacity-60" : ""}`}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-[12px] bg-white/10 text-slate-200 flex items-center justify-center shrink-0">
          {createElement(iconaCategoriaAttivita(attivita.categoria), {
            size: 18,
            "aria-hidden": true,
          })}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              {attivita.ora ? (
                <p className="text-lg font-black text-yellow-300 leading-none">
                  {attivita.ora}
                </p>
              ) : null}
              <h3
                className={`ds-card-title mt-1 truncate ${completata ? "line-through" : ""}`}
              >
                {attivita.titolo}
              </h3>
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 mt-0.5">
                {attivita.categoriaLabel || attivita.categoria}
              </p>
            </div>
            <span className={classePrioritaAttivita(attivita.priorita)}>
              {etichettaPriorita(attivita.priorita)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-4">
        {!completata ? (
          <button
            type="button"
            onClick={() => onCompleta?.(attivita.id)}
            className="btn-secondary py-3 flex items-center justify-center gap-1.5 text-xs font-black border-emerald-400/30 text-emerald-200"
          >
            <Check size={14} />
            Completa
          </button>
        ) : (
          <div className="btn-secondary py-3 flex items-center justify-center gap-1.5 text-xs font-black opacity-50">
            <Check size={14} />
            Fatto
          </div>
        )}
        <button
          type="button"
          onClick={() => onModifica?.(attivita)}
          className="btn-secondary py-3 flex items-center justify-center gap-1.5 text-xs font-black"
        >
          <Pencil size={14} />
          Modifica
        </button>
        <button
          type="button"
          onClick={() => onElimina?.(attivita.id)}
          className="btn-danger py-3 flex items-center justify-center gap-1.5 text-xs font-black"
        >
          <Trash2 size={14} />
          Elimina
        </button>
      </div>
    </article>
  );
}
