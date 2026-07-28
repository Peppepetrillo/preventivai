import { MAX_SUGGERIMENTI } from "./constants";
import {
  dedupeSuggestions,
  filterSessionSuggestions,
  sortSuggestionsByPriority,
} from "./prioritize";

/**
 * Esegue tutte le regole e restituisce suggerimenti pronti per la UI.
 * Puro / deterministico — nessun side effect.
 *
 * @param {object} context
 * @param {Array<{ id: string, evaluate: Function }>} rules
 * @param {{ ignored?: string[], resolved?: string[], massimo?: number }} session
 */
export function runIntelligenceEngine(
  context = {},
  rules = [],
  session = {}
) {
  const grezzi = [];
  for (const rule of rules) {
    if (!rule || typeof rule.evaluate !== "function") continue;
    try {
      const risultato = rule.evaluate(context);
      if (Array.isArray(risultato)) {
        grezzi.push(...risultato.filter(Boolean));
      } else if (risultato) {
        grezzi.push(risultato);
      }
    } catch {
      // Regola isolata: non bloccare le altre
    }
  }

  const ordinati = sortSuggestionsByPriority(dedupeSuggestions(grezzi));
  return filterSessionSuggestions(ordinati, {
    ignored: session.ignored,
    resolved: session.resolved,
    massimo: session.massimo ?? MAX_SUGGERIMENTI,
  });
}
