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
