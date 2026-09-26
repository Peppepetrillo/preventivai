/**
 * Scrub conservativo di PII strutturata in testo libero inviato all'IA.
 * Non inventa contenuti: maschera solo pattern chiari (email, IBAN, CF, cellulare IT).
 * Non tocca indirizzi verbali (richiede decisione prodotto).
 */

const RE_EMAIL = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const RE_IBAN = /\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b/gi;
const RE_CF = /\b[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]\b/gi;
/** Cellulare IT: opzionale +39, poi 3xx + 6/7 cifre. */
const RE_CELLULARE_IT =
  /\b(?:\+39[\s.]?)?3\d{2}[\s./-]?\d{6,7}\b/g;

/**
 * @param {unknown} testo
 * @returns {string}
 */
export function scrubTestoLiberoAi(testo) {
  let s = String(testo ?? "");
  if (!s) return "";
  s = s.replace(RE_EMAIL, "[email]");
  s = s.replace(RE_IBAN, "[iban]");
  s = s.replace(RE_CF, "[cf]");
  s = s.replace(RE_CELLULARE_IT, "[telefono]");
  return s.replace(/[ \t]{2,}/g, " ").trim();
}
