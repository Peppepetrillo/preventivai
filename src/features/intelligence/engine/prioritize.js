/**
 * Deduplica per id (prima occorrenza vince).
 * @param {object[]} suggestions
 * @returns {object[]}
 */
export function dedupeSuggestions(suggestions = []) {
  const visti = new Set();
  const out = [];
  for (const voce of suggestions) {
    if (!voce?.id || visti.has(voce.id)) continue;
    visti.add(voce.id);
    out.push(voce);
  }
  return out;
}

/**
 * Ordina per priorità crescente, poi id stabile.
 * @param {object[]} suggestions
 * @returns {object[]}
 */
export function sortSuggestionsByPriority(suggestions = []) {
  return [...suggestions].sort((a, b) => {
    const pa = Number(a.priority) || 100;
    const pb = Number(b.priority) || 100;
    if (pa !== pb) return pa - pb;
    return String(a.id).localeCompare(String(b.id), "it");
  });
}

/**
 * Rimuove ignorati/risolti di sessione e limita a max.
 * @param {object[]} suggestions
 * @param {{ ignored?: string[], resolved?: string[], massimo?: number }} opzioni
 */
export function filterSessionSuggestions(
  suggestions = [],
  { ignored = [], resolved = [], massimo = 3 } = {}
) {
  const nascosti = new Set(
    [...ignored, ...resolved].map((id) => String(id))
  );
  return suggestions
    .filter((s) => s?.id && !nascosti.has(String(s.id)))
    .slice(0, massimo);
}
