import { SESSION_STORAGE_KEY } from "./constants";

function leggiGrezzo() {
  if (typeof sessionStorage === "undefined") {
    return { ignored: [], resolved: [] };
  }
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return { ignored: [], resolved: [] };
    const parsed = JSON.parse(raw);
    return {
      ignored: Array.isArray(parsed?.ignored)
        ? parsed.ignored.map(String)
        : [],
      resolved: Array.isArray(parsed?.resolved)
        ? parsed.resolved.map(String)
        : [],
    };
  } catch {
    return { ignored: [], resolved: [] };
  }
}

function scrivi(stato) {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({
        ignored: [...new Set(stato.ignored.map(String))],
        resolved: [...new Set(stato.resolved.map(String))],
      })
    );
  } catch {
    // storage pieno / privato: ignora
  }
}

export function leggiSessioneIntelligence() {
  return leggiGrezzo();
}

export function ignoraSuggerimentoSessione(id) {
  const corrente = leggiGrezzo();
  const next = {
    ignored: [...corrente.ignored, String(id)],
    resolved: corrente.resolved,
  };
  scrivi(next);
  return next;
}

export function risolviSuggerimentoSessione(id) {
  const corrente = leggiGrezzo();
  const next = {
    ignored: corrente.ignored,
    resolved: [...corrente.resolved, String(id)],
  };
  scrivi(next);
  return next;
}

/** Solo test */
export function resetSessioneIntelligence() {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // ignore
  }
}
