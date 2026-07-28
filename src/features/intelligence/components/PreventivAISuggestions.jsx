import { Check, Lightbulb, X } from "lucide-react";
import { Link } from "react-router-dom";

import { usePreventivAISuggestions } from "../hooks/usePreventivAISuggestions";

/**
 * Centro Suggerimenti PreventivAI — collassato di default, non invasivo.
 */
export default function PreventivAISuggestions({
  scope = "home",
  cantieri = [],
  preventivi = [],
  cantiere = null,
  varianti = null,
  className = "",
}) {
  const { suggestions, count, ignora, risolvi } = usePreventivAISuggestions({
    scope,
    cantieri,
    preventivi,
    cantiere,
    varianti,
  });

  return (
    <details
      className={`group mb-5 ${className}`.trim()}
      aria-label="Suggerimenti PreventivAI"
    >
      <summary className="list-none cursor-pointer min-h-[44px] flex items-center justify-between gap-3 text-sm font-semibold text-slate-400 hover:text-slate-200">
        <span className="inline-flex items-center gap-2">
          <Lightbulb size={16} className="text-yellow-200/80" aria-hidden="true" />
          <span className="group-open:hidden">
            💡 Suggerimenti PreventivAI
            {count > 0 ? ` (${count})` : ""}
          </span>
          <span className="hidden group-open:inline">Nascondi suggerimenti</span>
        </span>
        {count > 0 ? (
          <span className="shrink-0 rounded-full bg-yellow-400/15 px-2.5 py-1 text-[11px] font-bold text-yellow-100">
            {count}
          </span>
        ) : null}
      </summary>

      <div className="mt-3 pro-panel p-4 space-y-3 ux-enter">
        {count === 0 ? (
          <p className="text-sm text-slate-400 leading-relaxed">
            Nessun suggerimento ora. Continua pure il lavoro.
          </p>
        ) : (
          <ul className="space-y-2.5" role="list">
            {suggestions.map((voce) => (
              <li
                key={voce.id}
                className={`rounded-[14px] border px-3.5 py-3 ${
                  voce.severity === "info"
                    ? "border-sky-400/20 bg-sky-400/10"
                    : "border-amber-400/20 bg-amber-400/10"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    {voce.link ? (
                      <Link
                        to={voce.link.startsWith("#") ? "." : voce.link}
                        onClick={(event) => {
                          if (voce.link.startsWith("#")) {
                            event.preventDefault();
                            document
                              .querySelector(voce.link)
                              ?.scrollIntoView({
                                behavior: "smooth",
                                block: "start",
                              });
                          }
                        }}
                        className="text-sm font-semibold text-slate-100 leading-snug hover:text-yellow-100"
                      >
                        {voce.message}
                      </Link>
                    ) : (
                      <p className="text-sm font-semibold text-slate-100 leading-snug">
                        {voce.message}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => risolvi(voce.id)}
                      className="min-h-[40px] min-w-[40px] rounded-[12px] bg-emerald-500/15 text-emerald-200 flex items-center justify-center"
                      aria-label="Segna come risolto"
                      title="Risolto"
                    >
                      <Check size={16} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => ignora(voce.id)}
                      className="min-h-[40px] min-w-[40px] rounded-[12px] bg-white/5 text-slate-400 flex items-center justify-center"
                      aria-label="Ignora suggerimento"
                      title="Ignora"
                    >
                      <X size={16} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </details>
  );
}
