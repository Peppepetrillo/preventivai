import { useId, useState } from "react";
import { ClipboardCheck, ChevronDown } from "lucide-react";

import QualityCheckItem from "./QualityCheckItem";
import QualityScoreBadge, { fasciaScoreQualita } from "./QualityScoreBadge";

const DURATA_MS = 220;

/**
 * Card Controllo Qualità — visualizza un report già prodotto.
 * Non esegue regole e non modifica il preventivo.
 *
 * @param {{
 *   report?: {
 *     errors?: object[],
 *     warnings?: object[],
 *     infos?: object[],
 *     score?: number,
 *   }|null,
 *   controlliTotali?: number,
 *   onApriLavorazione?: (relatedItem: string) => void,
 * }} props
 */
export default function QualityCheckCard({
  report = null,
  controlliTotali = 0,
  onApriLavorazione,
}) {
  const panelId = useId();
  const [aperto, setAperto] = useState(false);

  const errors = Array.isArray(report?.errors) ? report.errors : [];
  const warnings = Array.isArray(report?.warnings) ? report.warnings : [];
  const infos = Array.isArray(report?.infos) ? report.infos : [];
  const score =
    report?.score == null
      ? 100
      : Math.max(0, Math.min(100, Number(report.score)));

  const findings = errors.length + warnings.length + infos.length;
  const totali = Number(controlliTotali) || 0;
  const controlliSuperati = Math.max(0, totali - findings);

  const emptyState =
    errors.length === 0 && warnings.length === 0 && infos.length === 0;

  const labelSuperati =
    controlliSuperati === 1
      ? "✔ 1 controllo superato"
      : `✔ ${controlliSuperati} controlli superati`;

  const labelWarning =
    warnings.length === 0
      ? "⚠ Nessuna verifica consigliata"
      : warnings.length === 1
        ? "⚠ 1 verifica consigliata"
        : `⚠ ${warnings.length} verifiche consigliate`;

  const labelErrori =
    errors.length === 0
      ? "✔ Nessun errore"
      : errors.length === 1
        ? "❌ 1 errore"
        : `❌ ${errors.length} errori`;

  return (
    <section
      className="pro-panel p-5 mb-5"
      aria-labelledby={`${panelId}-title`}
      data-qc-score={score}
      data-qc-fascia={fasciaScoreQualita(score)}
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-[14px] bg-emerald-400/15 text-emerald-200 flex items-center justify-center shrink-0">
          <ClipboardCheck size={20} aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="section-label">Verifica professionale</p>
          <h2 id={`${panelId}-title`} className="ds-section-title mt-1">
            Controllo qualità
          </h2>
          <p className="ds-text-secondary text-sm mt-1.5">
            PreventivAI ha eseguito un ultimo controllo professionale. Valuta
            se queste verifiche sono utili prima di consegnare il preventivo.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <QualityScoreBadge score={score} />
      </div>

      {emptyState ? (
        <div
          className="rounded-[14px] border border-emerald-400/25 bg-emerald-500/10 px-4 py-4"
          data-qc-empty="true"
        >
          <p className="text-base font-bold text-emerald-100">
            <span aria-hidden="true">🟢 </span>
            Ottimo lavoro.
          </p>
          <p className="mt-2 text-sm text-slate-200 leading-relaxed">
            Non sono state rilevate criticità.
          </p>
          <p className="mt-1 text-sm text-slate-400 leading-relaxed">
            Il preventivo risulta coerente con le verifiche disponibili.
          </p>
        </div>
      ) : (
        <>
          <ul className="space-y-2 mb-4" role="list">
            <li className="text-sm text-slate-200">{labelSuperati}</li>
            <li className="text-sm text-amber-100/90">{labelWarning}</li>
            <li className="text-sm text-slate-200">{labelErrori}</li>
          </ul>

          <button
            type="button"
            className="w-full min-h-[44px] px-4 py-3 rounded-[14px] border border-white/10 bg-white/[0.04] text-sm font-semibold text-white flex items-center justify-center gap-2"
            aria-expanded={aperto}
            aria-controls={`${panelId}-details`}
            onClick={() => setAperto((v) => !v)}
          >
            {aperto ? "Nascondi dettagli" : "Visualizza dettagli"}
            <ChevronDown
              size={18}
              className={`transition-transform duration-[220ms] ${
                aperto ? "rotate-180" : ""
              }`}
              aria-hidden="true"
            />
          </button>

          <div
            id={`${panelId}-details`}
            className="qc-details-panel"
            data-open={aperto ? "true" : "false"}
            style={{
              display: "grid",
              gridTemplateRows: aperto ? "1fr" : "0fr",
              transition: `grid-template-rows ${DURATA_MS}ms ease`,
            }}
          >
            <div className="overflow-hidden min-h-0">
              <div className="pt-4 space-y-4">
                {errors.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-red-300/80">
                      Errori
                    </p>
                    {errors.map((item) => (
                      <QualityCheckItem
                        key={item.id || item.title}
                        item={item}
                        onApriLavorazione={onApriLavorazione}
                      />
                    ))}
                  </div>
                ) : null}

                {warnings.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-200/80">
                      Verifiche consigliate
                    </p>
                    {warnings.map((item) => (
                      <QualityCheckItem
                        key={item.id || item.title}
                        item={item}
                        onApriLavorazione={onApriLavorazione}
                      />
                    ))}
                  </div>
                ) : null}

                {infos.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-sky-200/80">
                      Suggerimenti
                    </p>
                    {infos.map((item) => (
                      <QualityCheckItem
                        key={item.id || item.title}
                        item={item}
                        onApriLavorazione={onApriLavorazione}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
