import { Star } from "lucide-react";

import { formatEuro } from "../../../utils/preventivi";

/**
 * Riga lavorazione catalogo — scan cantiere: nome, prezzo, unità, attiva.
 * Tap apre modifica; stella preferito (swipe non supportato nel DS).
 */
export default function RigaVoceCatalogo({
  voce,
  onApri,
  onToggleAttiva,
  onTogglePreferita,
}) {
  const inattiva = voce.attiva === false;

  return (
    <div
      className={`flex items-center gap-2 rounded-[16px] border border-white/[0.06] bg-white/[0.03] ${
        inattiva ? "opacity-55" : ""
      }`}
    >
      <button
        type="button"
        onClick={() => onTogglePreferita?.(voce.id)}
        className="min-w-[44px] min-h-[52px] flex items-center justify-center shrink-0 text-slate-500"
        aria-label={
          voce.preferita
            ? `Rimuovi ${voce.nome} dai preferiti`
            : `Aggiungi ${voce.nome} ai preferiti`
        }
        aria-pressed={Boolean(voce.preferita)}
      >
        <Star
          size={18}
          className={
            voce.preferita
              ? "text-yellow-300 fill-yellow-300"
              : "text-slate-500"
          }
          aria-hidden="true"
        />
      </button>

      <button
        type="button"
        onClick={() => onApri?.(voce)}
        className="flex-1 min-w-0 min-h-[52px] py-2.5 pr-2 text-left"
        aria-label={`Modifica ${voce.nome}`}
      >
        <p className="ds-card-title truncate">{voce.nome}</p>
        <p className="ds-text-secondary text-sm mt-0.5">
          {formatEuro(voce.prezzo)}
          <span className="text-white/30 mx-1.5">·</span>
          {voce.unita || "cad"}
        </p>
      </button>

      <label
        className="shrink-0 flex flex-col items-center justify-center gap-1 px-3 min-h-[52px] cursor-pointer"
        onClick={(event) => event.stopPropagation()}
      >
        <span className="sr-only">
          {voce.attiva ? "Disattiva" : "Attiva"} {voce.nome}
        </span>
        <input
          type="checkbox"
          role="switch"
          checked={voce.attiva !== false}
          onChange={() => onToggleAttiva?.(voce.id)}
          className="sr-only peer"
        />
        <span
          className={`relative w-11 h-6 rounded-full transition-colors ${
            voce.attiva !== false ? "bg-yellow-400" : "bg-white/15"
          }`}
          aria-hidden="true"
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-slate-950 transition-transform ${
              voce.attiva !== false ? "translate-x-5" : ""
            }`}
          />
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
          {voce.attiva !== false ? "On" : "Off"}
        </span>
      </label>
    </div>
  );
}
