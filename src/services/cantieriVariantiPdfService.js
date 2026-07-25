/**
 * PDF Varianti Cantiere — struttura pronta, export disabilitato (Sprint PDF).
 */

import {
  esportaPdfVariantiNonDisponibile,
  preparaDocumentoVariantiPdf,
} from "../domain/varianti";

/**
 * Prepara i dati per il PDF senza generare file.
 * @param {object} cantiere
 * @param {object=} datiAzienda
 */
export function preparaPdfVariantiCantiere(cantiere, datiAzienda = {}) {
  return preparaDocumentoVariantiPdf(cantiere, { datiAzienda });
}

/**
 * Export non abilitato in questo sprint.
 * @deprecated Verrà attivato nello Sprint PDF
 */
export async function generaPdfVariantiCantiere(cantiere, datiAzienda = {}) {
  const risultato = esportaPdfVariantiNonDisponibile(cantiere, { datiAzienda });
  throw new Error(risultato.messaggio);
}

export { preparaDocumentoVariantiPdf };
