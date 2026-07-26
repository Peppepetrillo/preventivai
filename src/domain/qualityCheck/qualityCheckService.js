/**
 * Quality Check Service — analizza un preventivo e produce un report.
 *
 * Non modifica il preventivo, non aggiunge lavorazioni, non altera prezzi.
 * Assistenza professionale all'elettricista prima del PDF.
 */

import { creaQualityCheckReport } from "./qualityCheckTypes";
import * as repo from "./qualityCheckRepository";

/**
 * Esegue tutte le regole abilitate sul preventivo (sola lettura).
 *
 * @param {object} preventivo
 * @param {{
 *   regole?: object[],
 * }=} opzioni
 * @returns {{
 *   errors: object[],
 *   warnings: object[],
 *   infos: object[],
 *   score: number,
 * }}
 */
export function generateQualityChecks(preventivo = {}, opzioni = {}) {
  const regole = Array.isArray(opzioni.regole)
    ? opzioni.regole
    : repo.leggiRegoleQualityCheck();

  const findings = [];

  for (const regola of regole) {
    if (!regola || regola.enabled === false) continue;
    if (typeof regola.execute !== "function") continue;

    let esito = null;
    try {
      esito = regola.execute(preventivo);
    } catch {
      // Regola difettosa: non blocca il report
      continue;
    }

    if (esito) findings.push(esito);
  }

  return creaQualityCheckReport(findings);
}

/**
 * Alias esplicito per UI future.
 * @param {object} preventivo
 */
export function generaControlloQualita(preventivo) {
  return generateQualityChecks(preventivo);
}

/**
 * @returns {number}
 */
export function contaRegoleAttive() {
  return repo
    .leggiRegoleQualityCheck()
    .filter((r) => r.enabled !== false).length;
}
