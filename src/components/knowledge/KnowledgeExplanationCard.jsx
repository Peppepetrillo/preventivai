/**
 * Card collassabile "Perché PreventivAI lo suggerisce?"
 * Default: chiusa. Se manca schedaTecnicaId / spiegazione → non renderizza.
 */

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";

import KnowledgeBadge from "./KnowledgeBadge";
import KnowledgeVerificationList from "./KnowledgeVerificationList";

function KnowledgeExplanationCard({ spiegazione }) {
  const panelId = useId();
  const [aperto, setAperto] = useState(false);

  if (!spiegazione?.schedaTecnicaId) return null;

  return (
    <div className="mt-2 rounded-[12px] border border-white/[0.08] bg-white/[0.03] overflow-hidden">
      <button
        type="button"
        className="w-full flex items-center justify-between gap-2 min-h-[44px] px-3 py-2 text-left"
        aria-expanded={aperto}
        aria-controls={panelId}
        onClick={() => setAperto((v) => !v)}
      >
        <span className="text-[13px] font-semibold text-slate-200">
          Perché PreventivAI lo suggerisce?
        </span>
        <ChevronDown
          size={16}
          className={`text-slate-500 shrink-0 transition-transform ${
            aperto ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        />
      </button>

      {aperto ? (
        <div
          id={panelId}
          className="px-3 pb-3 pt-0 space-y-3 border-t border-white/[0.06]"
        >
          {spiegazione.indicazioni?.length > 0 ? (
            <div className="pt-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Hai indicato
              </p>
              <ul className="mt-1.5 space-y-1" role="list">
                {spiegazione.indicazioni.map((riga) => (
                  <li key={riga} className="text-sm text-slate-200">
                    {riga}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="pt-3" />
          )}

          {spiegazione.motivazione ? (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Motivazione
              </p>
              <p className="mt-1.5 text-sm text-slate-200 leading-relaxed">
                {spiegazione.motivazione}
              </p>
            </div>
          ) : null}

          <KnowledgeVerificationList
            verifiche={spiegazione.verificheProfessionista}
          />

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {spiegazione.origine ? (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-medium text-slate-500">
                  Origine
                </span>
                <KnowledgeBadge tipo="origine" valore={spiegazione.origine} />
              </div>
            ) : null}
            {spiegazione.livelloAffidabilita ? (
              <KnowledgeBadge
                tipo="affidabilita"
                valore={spiegazione.livelloAffidabilita}
              />
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default KnowledgeExplanationCard;
