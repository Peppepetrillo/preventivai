import { Sparkles } from "lucide-react";

import { PROSSIMAMENTE_VOCI } from "./prossimamenteCatalog";

/**
 * Roadmap 2.0 — solo comunicazione, compressa (UX simplify).
 * Nessuna feature attiva.
 */
export default function ProssimamenteSection() {
  return (
    <section
      className="mt-8"
      aria-labelledby="prossimamente-title"
      data-testid="prossimamente-section"
    >
      <details className="pro-panel p-4" data-testid="prossimamente-details">
        <summary
          className="cursor-pointer list-none min-h-[44px] flex items-center gap-2"
          data-testid="prossimamente-toggle"
        >
          <Sparkles size={16} className="text-yellow-200 shrink-0" aria-hidden="true" />
          <div className="min-w-0 flex-1 text-left">
            <p className="section-label">Roadmap</p>
            <h2 id="prossimamente-title" className="ds-card-title mt-0.5">
              Prossimamente
            </h2>
            <p className="ds-text-secondary text-sm mt-1">
              Idee per dopo. Tocca per vedere.
            </p>
          </div>
        </summary>

        <ul className="flex flex-col gap-2 mt-4 pt-3 border-t border-white/10">
          {PROSSIMAMENTE_VOCI.map((voce) => {
            const Icon = voce.Icon;
            return (
              <li key={voce.id}>
                <div
                  className="rounded-[16px] border border-white/8 bg-black/20 p-4 flex items-start gap-3 opacity-90"
                  data-testid={`prossimamente-${voce.id}`}
                >
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-[16px] bg-white/8 text-slate-300 shrink-0">
                    <Icon size={20} aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="ds-text-primary font-medium">{voce.titolo}</p>
                      <span className="ds-badge text-[11px] px-2 py-0.5 rounded-full bg-slate-700/80 text-slate-200">
                        {voce.badge}
                      </span>
                    </div>
                    <p className="ds-text-secondary text-sm mt-1">
                      {voce.descrizione}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </details>
    </section>
  );
}
