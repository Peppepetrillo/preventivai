/**
 * Facade PDF Preventivo — arricchisce i dati e delega al domain/pdf.
 * L'UI continua a chiamare generaPdfPreventivo(...).
 * La firma è letta dal modulo firma (non gestita qui).
 */

import { leggiClienti } from "../repositories/clientiRepository";
import {
  buildPreventivoPdfDocument,
  generaPreventivoPdfDaInput,
} from "../domain/pdf";
import {
  mappaFirmaPerPdf,
  nomeFilePdfPreventivo,
  ottieniFirma,
} from "../domain/firma";

/**
 * Risolve anagrafica cliente se disponibile (solo in facade, non nel motore PDF).
 * @param {string|object} cliente
 * @param {object=} preventivo
 */
function risolviCliente(cliente, preventivo = {}) {
  if (cliente && typeof cliente === "object") {
    return {
      nome: cliente.nome || "",
      telefono: cliente.telefono || "",
      email: cliente.email || "",
      indirizzo: cliente.indirizzo || preventivo.indirizzo || "",
    };
  }

  const nome = String(cliente || "").trim();
  const anagrafica =
    leggiClienti().find((c) => String(c.nome).trim() === nome) || null;

  return {
    nome: nome || anagrafica?.nome || "",
    telefono: anagrafica?.telefono || "",
    email: anagrafica?.email || "",
    indirizzo: preventivo.indirizzo || anagrafica?.indirizzo || "",
  };
}

/**
 * @param {object} opzioni
 * @returns {Promise<{ doc: object, pagine: number, blob?: Blob, blobUrl?: string, document?: object, nomeFile?: string }>}
 */
export async function generaPdfPreventivo({
  preventivo,
  datiAzienda,
  cliente,
  stato,
  lavorazioni,
  validita,
  pagamento,
  note,
  sconto,
  iva,
  acconto = 0,
  totali,
  salva = true,
  oggetto,
  condizioni,
  firme,
  usaFirmaSalvata = true,
  firmato = undefined,
  nomeFile,
}) {
  const clienteRisolto = risolviCliente(cliente, preventivo);

  let firmeDto = firme;
  if (!firmeDto && usaFirmaSalvata && preventivo?.id) {
    firmeDto = mappaFirmaPerPdf(ottieniFirma(preventivo.id));
  }

  const haFirma = Boolean(firmeDto?.clienteImmagine);
  const scaricaFirmato = firmato === undefined ? haFirma : Boolean(firmato);
  const fileName =
    nomeFile ||
    nomeFilePdfPreventivo(preventivo || {}, scaricaFirmato);

  return generaPreventivoPdfDaInput(
    {
      preventivo,
      datiAzienda,
      azienda: datiAzienda,
      cliente: clienteRisolto,
      stato,
      lavorazioni,
      validita,
      pagamento,
      note,
      sconto,
      iva,
      acconto,
      totali,
      oggetto,
      condizioni:
        condizioni ||
        datiAzienda?.condizioniGenerali ||
        datiAzienda?.condizioni ||
        "",
      settings: datiAzienda?.pdfSettings,
      firme: firmeDto,
    },
    { salva, nomeFile: fileName }
  );
}

/**
 * Solo DTO (utile a test / anteprima dati).
 */
export function costruisciDocumentoPdfPreventivo(opzioni = {}) {
  const clienteRisolto = risolviCliente(opzioni.cliente, opzioni.preventivo);
  let firmeDto = opzioni.firme;
  if (!firmeDto && opzioni.usaFirmaSalvata !== false && opzioni.preventivo?.id) {
    firmeDto = mappaFirmaPerPdf(ottieniFirma(opzioni.preventivo.id));
  }
  return buildPreventivoPdfDocument({
    ...opzioni,
    azienda: opzioni.azienda || opzioni.datiAzienda,
    cliente: clienteRisolto,
    condizioni:
      opzioni.condizioni ||
      opzioni.datiAzienda?.condizioniGenerali ||
      "",
    firme: firmeDto,
  });
}

export { buildPreventivoPdfDocument, generaPreventivoPdfDaInput };
