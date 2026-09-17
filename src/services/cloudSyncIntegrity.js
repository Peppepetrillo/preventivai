/**
 * Regole pure di integrità sync cloud (RC-1A).
 * Nessuna dipendenza da React, LocalStorage o Supabase.
 */

/**
 * @param {unknown} iso
 * @returns {number}
 */
export function tempoDaIso(iso) {
  if (iso == null || iso === "") return 0;
  const t = Date.parse(String(iso));
  return Number.isFinite(t) ? t : 0;
}

/**
 * True se il valore locale ha contenuto reale rispetto al fallback della chiave.
 * @param {unknown} valore
 * @param {unknown} fallback
 */
export function haValoreLocaleSignificativo(valore, fallback) {
  if (Array.isArray(fallback)) {
    return Array.isArray(valore) && valore.length > 0;
  }
  if (fallback && typeof fallback === "object") {
    return (
      Boolean(valore) &&
      typeof valore === "object" &&
      !Array.isArray(valore) &&
      Object.keys(valore).length > 0
    );
  }
  return valore !== undefined && valore !== null && valore !== fallback;
}

/**
 * True se il payload cloud è vuoto/null in modo che applicare
 * sovrascriverebbe un locale non vuoto (wipe accidentale).
 * @param {unknown} payload
 * @param {unknown} fallback
 */
export function isPayloadCloudVuoto(payload, fallback) {
  if (payload == null) return true;
  if (Array.isArray(fallback)) {
    return !Array.isArray(payload) || payload.length === 0;
  }
  if (fallback && typeof fallback === "object") {
    return (
      typeof payload !== "object" ||
      payload === null ||
      Array.isArray(payload) ||
      Object.keys(payload).length === 0
    );
  }
  return false;
}

/**
 * Protezione anti-wipe: locale pieno + cloud vuoto → non applicare.
 * @param {{
 *   haValoreLocale: boolean,
 *   payloadCloud?: unknown,
 *   fallback?: unknown,
 * }} params
 */
export function deveProteggereLocaleDaWipeCloud({
  haValoreLocale,
  payloadCloud,
  fallback,
}) {
  if (!haValoreLocale) return false;
  return isPayloadCloudVuoto(payloadCloud, fallback);
}

/**
 * Payload da scrivere in locale: mai forma errata (es. {} su chiave array).
 * Cloud vuoto/null/tipo sbagliato → fallback della chiave.
 * @param {unknown} payload
 * @param {unknown} fallback
 */
export function normalizzaPayloadCloud(payload, fallback) {
  if (isPayloadCloudVuoto(payload, fallback)) {
    return fallback;
  }
  return payload ?? fallback;
}

/**
 * True se l'aggiornamento cloud può sostituire la copia locale.
 * La coda offline vince sempre: non applicare mai il cloud su chiavi sporche.
 *
 * @param {{
 *   chiaveInCoda: boolean,
 *   updatedAtCloud?: string|null,
 *   updatedAtLocale?: string|null,
 * }} params
 * @returns {boolean}
 */
export function deveApplicareAggiornamentoCloud({
  chiaveInCoda,
  updatedAtCloud,
  updatedAtLocale,
}) {
  if (chiaveInCoda) return false;

  const cloudMs = tempoDaIso(updatedAtCloud);
  const localeMs = tempoDaIso(updatedAtLocale);

  // Nessuna revisione locale → accetta il cloud (prima sync / legacy).
  if (localeMs <= 0) return true;

  // Nessun timestamp cloud affidabile → non sovrascrivere un locale revisionato.
  if (cloudMs <= 0) return false;

  // Cloud più recente o uguale → applica (idempotente se uguale).
  return cloudMs >= localeMs;
}

/**
 * True se il locale è più recente del cloud e va rispingere (senza essere in coda).
 *
 * @param {{
 *   chiaveInCoda: boolean,
 *   updatedAtCloud?: string|null,
 *   updatedAtLocale?: string|null,
 *   haValoreLocale: boolean,
 * }} params
 * @returns {boolean}
 */
export function deveRispingereLocaleVersoCloud({
  chiaveInCoda,
  updatedAtCloud,
  updatedAtLocale,
  haValoreLocale,
}) {
  if (chiaveInCoda || !haValoreLocale) return false;

  const cloudMs = tempoDaIso(updatedAtCloud);
  const localeMs = tempoDaIso(updatedAtLocale);

  if (localeMs <= 0) return false;
  if (cloudMs <= 0) return true;

  return localeMs > cloudMs;
}
