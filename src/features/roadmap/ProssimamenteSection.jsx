import { Sparkles } from "lucide-react";

import { PROSSIMAMENTE_VOCI } from "./prossimamenteCatalog";

/**
 * Roadmap 2.0 — solo comunicazione. Nessuna feature attiva.
 */
export default function ProssimamenteSection() {
  return (
    <section
      className="mt-8 space-y-3"
      aria-labelledby="prossimamente-title"
      data-testid="prossimamente-section"
    >
      <div className="px-0.5">
        <p className="section-label flex items-center gap-2">
          <Sparkles size={14} className="text-yellow-200" aria-hidden="true" />
          Roadmap
        </p>
        <h2 id="prossimamente-title" className="ds-card-title mt-1">
          Prossimamente
        </h2>
        <p className="ds-text-secondary text-sm mt-1.5">
          Idee per le prossime versioni. Non sono ancora disponibili.
        </p>
      </div>

      <ul className="flex flex-col gap-2">
        {PROSSIMAMENTE_VOCI.map((voce) => {
          const Icon = voce.Icon;
          return (
            <li key={voce.id}>
              <div
                className="pro-panel p-4 flex items-start gap-3 opacity-90"
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
                  <p className="ds-text-secondary text-sm mt-1">{voce.descrizione}</p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
