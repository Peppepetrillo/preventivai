import { useCallback, useMemo, useState } from "react";

import { INTELLIGENCE_RULES } from "../rules";
import { MAX_SUGGERIMENTI } from "../engine/constants";
import { runIntelligenceEngine } from "../engine/runIntelligenceEngine";
import {
  ignoraSuggerimentoSessione,
  leggiSessioneIntelligence,
  risolviSuggerimentoSessione,
} from "../engine/sessionStore";

/**
 * Hook memoizzato: ricalcola solo se cambiano i dati di contesto o la sessione.
 *
 * @param {{
 *   scope?: 'home'|'cantiere',
 *   cantieri?: object[],
 *   preventivi?: object[],
 *   cantiere?: object|null,
 *   varianti?: object[],
 *   now?: Date,
 *   giorniPreventivoInviato?: number,
 *   rules?: object[],
 * }} opzioni
 */
export function usePreventivAISuggestions({
  scope = "home",
  cantieri = [],
  preventivi = [],
  cantiere = null,
  varianti = null,
  now = null,
  giorniPreventivoInviato,
  rules = INTELLIGENCE_RULES,
} = {}) {
  const [sessione, setSessione] = useState(() => leggiSessioneIntelligence());

  const context = useMemo(
    () => ({
      scope,
      cantieri,
      preventivi,
      cantiere,
      varianti: varianti || undefined,
      now: now || undefined,
      giorniPreventivoInviato,
    }),
    [
      scope,
      cantieri,
      preventivi,
      cantiere,
      varianti,
      now,
      giorniPreventivoInviato,
    ]
  );

  const suggestions = useMemo(
    () =>
      runIntelligenceEngine(context, rules, {
        ignored: sessione.ignored,
        resolved: sessione.resolved,
        massimo: MAX_SUGGERIMENTI,
      }),
    [context, rules, sessione]
  );

  const ignora = useCallback((id) => {
    setSessione(ignoraSuggerimentoSessione(id));
  }, []);

  const risolvi = useCallback((id) => {
    setSessione(risolviSuggerimentoSessione(id));
  }, []);

  return {
    suggestions,
    count: suggestions.length,
    ignora,
    risolvi,
    ignoredIds: sessione.ignored,
    resolvedIds: sessione.resolved,
  };
}
