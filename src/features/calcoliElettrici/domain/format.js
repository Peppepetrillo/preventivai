/**
 * Parsing / formattazione numeri per calcolatori elettrici.
 * Interno: number pieno. UI: arrotondamento solo in display.
 */

/**
 * @param {unknown} valore
 * @returns {{ ok: true, value: number }|{ ok: false, errore: string }}
 */
export function parseNumeroPositivo(valore, { zeroConsentito = false } = {}) {
  if (valore === "" || valore == null) {
    return { ok: false, errore: "Inserisci un valore valido." };
  }
  const n = Number(String(valore).trim().replace(",", "."));
  if (!Number.isFinite(n)) {
    return { ok: false, errore: "Inserisci un valore valido." };
  }
  if (n < 0) {
    return { ok: false, errore: "Controlla i valori inseriti." };
  }
  if (!zeroConsentito && n === 0) {
    return { ok: false, errore: "Il valore deve essere maggiore di zero." };
  }
  return { ok: true, value: n };
}

/**
 * @param {unknown} valore
 * @returns {{ ok: true, value: number|null }|{ ok: false, errore: string }}
 */
export function parseNumeroOpzionale(valore) {
  if (valore === "" || valore == null) {
    return { ok: true, value: null };
  }
  const n = Number(String(valore).trim().replace(",", "."));
  if (!Number.isFinite(n)) {
    return { ok: false, errore: "Inserisci un valore valido." };
  }
  if (n < 0) {
    return { ok: false, errore: "Controlla i valori inseriti." };
  }
  return { ok: true, value: n };
}

/**
 * @param {number} valore
 * @param {number} decimali
 */
export function formatNumeroIt(valore, decimali = 2) {
  if (!Number.isFinite(valore)) return "—";
  return new Intl.NumberFormat("it-IT", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimali,
  }).format(valore);
}
