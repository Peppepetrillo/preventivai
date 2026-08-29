import { useMemo } from "react";

import { formatEuro } from "../../../utils/preventivi";
import { riepilogoEconomicoCompleto } from "../services/speseCantiereService";

/**
 * Riepilogo economico con margine lordo (UX-Spese v1).
 */
export default function RiepilogoEconomicoSection({ cantiere }) {
  const riepilogo = useMemo(
    () => riepilogoEconomicoCompleto(cantiere),
    [cantiere]
  );

  return (
    <section
      className="pro-panel p-5 mb-5 scroll-mt-24"
      aria-labelledby="riepilogo-economico-title"
      data-testid="cantiere-riepilogo-economico"
    >
      <h2 id="riepilogo-economico-title" className="ds-card-title mb-4">
        Riepilogo
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-[14px] border border-white/10 bg-black/[0.18] p-4">
          <p className="ds-text-secondary text-sm">Totale cantiere</p>
          <p
            className="text-xl font-semibold mt-1 tabular-nums ds-text-primary"
            data-testid="riepilogo-totale-cantiere"
          >
            {formatEuro(riepilogo.totaleCantiere)}
          </p>
        </div>
        <div className="rounded-[14px] border border-white/10 bg-black/[0.18] p-4">
          <p className="ds-text-secondary text-sm">Incassato</p>
          <p
            className="text-xl font-semibold mt-1 tabular-nums ds-text-primary"
            data-testid="riepilogo-incassato"
          >
            {formatEuro(riepilogo.incassato)}
          </p>
        </div>
        <div className="rounded-[14px] border border-white/10 bg-black/[0.18] p-4">
          <p className="ds-text-secondary text-sm">Spese</p>
          <p
            className="text-xl font-semibold mt-1 tabular-nums ds-text-primary"
            data-testid="riepilogo-spese"
          >
            {formatEuro(riepilogo.totaleSpese)}
          </p>
        </div>
        <div className="rounded-[14px] border border-emerald-400/20 bg-emerald-400/10 p-4">
          <p className="text-sm text-emerald-100/80">Margine lordo</p>
          <p
            className={`text-xl font-semibold mt-1 tabular-nums ${
              riepilogo.margineLordo >= 0 ? "text-emerald-100" : "text-red-300"
            }`}
            data-testid="riepilogo-margine-lordo"
          >
            {formatEuro(riepilogo.margineLordo)}
          </p>
        </div>
      </div>
    </section>
  );
}
