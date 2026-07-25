/**
 * Repository Assistente Sopralluogo — lettura domande.
 */

import {
  ASSISTANT_DOMANDE,
  ASSISTANT_DOMANDE_BY_ID,
} from "./assistantQuestions";

/**
 * @returns {ReadonlyArray<object>}
 */
export function leggiDomande() {
  return ASSISTANT_DOMANDE;
}

/**
 * @param {string} id
 * @returns {object|null}
 */
export function trovaDomandaPerId(id) {
  if (!id) return null;
  return ASSISTANT_DOMANDE_BY_ID[String(id)] || null;
}

/**
 * @returns {number}
 */
export function contaDomande() {
  return ASSISTANT_DOMANDE.length;
}
