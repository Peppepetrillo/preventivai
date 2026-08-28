/**
 * Flag UI effimero (sessionStorage) per banner post-conversione.
 * Non è una STORAGE_KEY di dominio: solo UX in sessione.
 */

const PREFIX = "preventivai:ux:postConversione:";

/**
 * @param {string|number} cantiereId
 * @param {{ incassatoPreventivo?: number }} [opzioni]
 */
export function marcaPostConversioneCantiere(cantiereId, opzioni = {}) {
  const id = String(cantiereId || "").trim();
  if (!id || typeof sessionStorage === "undefined") return;
  const incassato = Number(opzioni.incassatoPreventivo) || 0;
  try {
    sessionStorage.setItem(
      `${PREFIX}${id}`,
      JSON.stringify({
        incassatoPreventivo: incassato > 0 ? incassato : 0,
        at: Date.now(),
      })
    );
  } catch {
    /* ignore quota / private mode */
  }
}

/**
 * @param {string|number} cantiereId
 * @returns {{ incassatoPreventivo: number } | null}
 */
export function leggiPostConversioneCantiere(cantiereId) {
  const id = String(cantiereId || "").trim();
  if (!id || typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(`${PREFIX}${id}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      incassatoPreventivo: Number(parsed?.incassatoPreventivo) || 0,
    };
  } catch {
    return null;
  }
}

/**
 * @param {string|number} cantiereId
 */
export function chiudiPostConversioneCantiere(cantiereId) {
  const id = String(cantiereId || "").trim();
  if (!id || typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.removeItem(`${PREFIX}${id}`);
  } catch {
    /* ignore */
  }
}
