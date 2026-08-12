import { CheckCircle, Circle } from "lucide-react";

import { etichettaOrigineAcquisto } from "../../../domain/listaSpesa";
import {
  etichettaPadreAccessorioAcquisto,
  unitaAcquistoInLettura,
} from "../../../domain/listaSpesa/listaSpesaDomain";

/**
 * Riga voce lista spesa — checkbox aggiorna la voce reale.
 */
export default function AcquistiVoceRow({ voce, onToggle, vociContesto = [] }) {
  const preso = Boolean(voce.acquistato);
  const unita = unitaAcquistoInLettura(voce.unita) || voce.unita || "pz";
  const origine = etichettaOrigineAcquisto(voce.origine);
  const etichettaPadre = etichettaPadreAccessorioAcquisto(voce, vociContesto);

  return (
    <div
      className={`flex items-start gap-3 rounded-[16px] border border-white/10 bg-black/[0.18] px-3 py-3 min-h-[56px] ${
        preso ? "opacity-70" : ""
      }`}
      data-testid="acquisti-voce"
      data-voce-id={voce.id}
    >
      <button
        type="button"
        onClick={() => onToggle?.(voce.id)}
        className="text-amber-200 min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0 -ml-1"
        aria-label={preso ? `Segna da comprare ${voce.nome}` : `Segna comprato ${voce.nome}`}
        aria-pressed={preso}
        data-testid="acquisti-voce-toggle"
      >
        {preso ? <CheckCircle size={24} /> : <Circle size={24} />}
      </button>

      <div className="min-w-0 flex-1 pt-1.5">
        <div className="flex items-start justify-between gap-2">
          <p
            className={`ds-text-primary font-semibold leading-snug ${
              preso ? "line-through text-slate-500" : ""
            }`}
          >
            {voce.nome}
          </p>
          <p className="ds-text-primary tabular-nums shrink-0 font-semibold">
            {voce.quantita} {unita}
          </p>
        </div>

        {etichettaPadre ? (
          <p
            className="ds-text-secondary text-xs mt-1"
            data-testid="acquisti-accessorio-padre"
          >
            {etichettaPadre}
          </p>
        ) : null}

        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          {origine ? (
            <span
              className="ds-badge ds-badge-da-iniziare"
              data-testid="acquisti-origine"
            >
              {origine}
            </span>
          ) : null}
          {voce.note ? (
            <span className="ds-text-secondary text-xs" data-testid="acquisti-nota">
              {voce.note}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
