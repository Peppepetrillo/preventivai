import { memo } from "react";

import {
  TIPOLOGIA_IMPIANTO_DEFAULT,
  TIPOLOGIA_IMPIANTO_OPZIONI,
} from "../tipologiaImpiantoConfig";

function TipologiaImpiantoSelector({ tipologiaImpianto, onSeleziona }) {
  const selezione = tipologiaImpianto || TIPOLOGIA_IMPIANTO_DEFAULT;

  return (
    <section
      className="space-y-2"
      aria-labelledby="tipologia-impianto-titolo"
      data-testid="tipologia-impianto-selector"
    >
      <div className="px-1">
        <h2 id="tipologia-impianto-titolo" className="ds-card-title">
          Che tipo di lavoro devi preventivare?
        </h2>
        <p className="ds-text-secondary text-sm mt-0.5">
          Puoi cambiarlo in qualsiasi momento.
        </p>
      </div>

      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="Tipologia impianto"
      >
        {TIPOLOGIA_IMPIANTO_OPZIONI.map((opzione) => {
          const attivo = selezione === opzione.id;
          const label =
            opzione.emoji && opzione.label
              ? `${opzione.emoji} ${opzione.label}`
              : opzione.label;

          return (
            <button
              key={opzione.id}
              type="button"
              onClick={() => onSeleziona?.(opzione.id)}
              aria-pressed={attivo}
              data-testid={`tipologia-${opzione.id}`}
              className={`min-h-[44px] px-3 py-2 rounded-[16px] text-sm font-semibold transition ${
                attivo
                  ? "bg-yellow-400 text-slate-950"
                  : "bg-white/8 text-slate-300 border border-white/10"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default memo(TipologiaImpiantoSelector);
