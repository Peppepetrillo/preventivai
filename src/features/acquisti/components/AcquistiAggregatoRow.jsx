import { CheckCircle, ChevronDown, ChevronRight, Circle } from "lucide-react";

import AcquistiVoceRow from "./AcquistiVoceRow";

/**
 * Riga aggregata (vista Tutto) con provenance espandibile.
 * Toggle agisce sulle voci originali, mai su un record aggregato.
 */
export default function AcquistiAggregatoRow({
  aggregato,
  espanso,
  onToggleEspanso,
  onToggleAggregato,
  onToggleVoce,
  vociContesto = [],
}) {
  const preso = Boolean(aggregato.tuttiAcquistati);
  const haProvenance = (aggregato.voci || []).length > 1;

  return (
    <div
      className="pro-panel overflow-hidden"
      data-testid="acquisti-aggregato"
      data-chiave={aggregato.chiave}
    >
      <div className="flex items-start gap-2 px-3 py-2 min-h-[56px]">
        <button
          type="button"
          onClick={() => onToggleAggregato?.(aggregato)}
          className="text-amber-200 min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0"
          aria-label={
            preso
              ? `Segna da comprare ${aggregato.nome}`
              : `Segna comprato ${aggregato.nome}`
          }
          aria-pressed={preso}
          data-testid="acquisti-aggregato-toggle"
        >
          {preso ? <CheckCircle size={24} /> : <Circle size={24} />}
        </button>

        <button
          type="button"
          onClick={() => onToggleEspanso?.(aggregato.chiave)}
          className="min-w-0 flex-1 flex items-start gap-2 text-left min-h-[44px] py-2"
          aria-expanded={espanso}
          data-testid="acquisti-aggregato-expand"
        >
          <div className="min-w-0 flex-1">
            <p
              className={`ds-text-primary font-semibold ${
                preso ? "line-through text-slate-500" : ""
              }`}
            >
              {aggregato.nome}
            </p>
            <p className="ds-text-secondary text-sm mt-0.5 tabular-nums">
              {aggregato.quantitaTotale} {aggregato.unita}
              {haProvenance
                ? ` · ${aggregato.voci.length} lavori`
                : aggregato.voci[0]?.cliente
                  ? ` · ${aggregato.voci[0].cliente}`
                  : ""}
            </p>
          </div>
          {haProvenance ? (
            espanso ? (
              <ChevronDown
                size={20}
                className="text-slate-400 shrink-0 mt-1"
                aria-hidden="true"
              />
            ) : (
              <ChevronRight
                size={20}
                className="text-slate-400 shrink-0 mt-1"
                aria-hidden="true"
              />
            )
          ) : null}
        </button>
      </div>

      {espanso ? (
        <div
          className="border-t border-white/10 px-3 py-3 space-y-3 bg-black/[0.12]"
          data-testid="acquisti-provenance"
        >
          {aggregato.voci.map((voce) => {
            const label =
              [voce.cliente, voce.titoloLavoro].filter(Boolean).join(" — ") ||
              "Lavoro";
            return (
              <div key={voce.id} data-testid="acquisti-provenance-item">
                <p className="ds-text-secondary text-xs mb-1.5 pl-1">{label}</p>
                <div className="pl-2 border-l-2 border-white/15">
                  <AcquistiVoceRow
                    voce={voce}
                    onToggle={onToggleVoce}
                    vociContesto={vociContesto}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
