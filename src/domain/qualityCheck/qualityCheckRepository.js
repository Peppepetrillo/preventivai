/**
 * Repository Quality Check — solo elenco regole, nessuna logica.
 */

import { QUALITY_CHECK_RULES } from "./qualityCheckRules";

/**
 * @returns {ReadonlyArray<object>}
 */
export function leggiRegoleQualityCheck() {
  return QUALITY_CHECK_RULES;
}

/**
 * @returns {number}
 */
export function contaRegoleQualityCheck() {
  return QUALITY_CHECK_RULES.length;
}
