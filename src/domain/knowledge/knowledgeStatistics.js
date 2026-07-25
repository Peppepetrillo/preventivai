/**
 * Statistiche Knowledge Base — lettura strutturata del registro regole.
 * Non esegue le regole: solo metadati per UI e monitoraggio.
 */

import { knowledgeRules } from "./knowledgeRules";
import { KNOWLEDGE_CATEGORIES } from "./knowledgeCategories";

/**
 * @param {object[]=} regole
 * @returns {number}
 */
export function getNumeroRegole(regole = knowledgeRules) {
  return Array.isArray(regole) ? regole.length : 0;
}

/**
 * Conteggio regole per categoria (include categorie ancora a zero).
 * @param {object[]=} regole
 * @returns {Record<string, number>}
 */
export function getRegolePerCategoria(regole = knowledgeRules) {
  const conteggi = Object.fromEntries(
    KNOWLEDGE_CATEGORIES.map((categoria) => [categoria, 0])
  );

  (regole || []).forEach((regola) => {
    const categoria = regola?.categoria;
    if (!categoria) return;
    if (!(categoria in conteggi)) {
      conteggi[categoria] = 0;
    }
    conteggi[categoria] += 1;
  });

  return conteggi;
}

/**
 * @param {object[]=} regole
 * @returns {object[]}
 */
export function getRegoleAttive(regole = knowledgeRules) {
  return (regole || []).filter((regola) => regola?.enabled !== false);
}

/**
 * @param {object[]=} regole
 * @returns {object[]}
 */
export function getRegoleDisattivate(regole = knowledgeRules) {
  return (regole || []).filter((regola) => regola?.enabled === false);
}
