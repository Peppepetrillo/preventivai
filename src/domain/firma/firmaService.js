/**
 * Firma Service — crea, salva, rimuove, versiona documenti.
 * Non genera PDF: espone dati che il PDF può leggere.
 */

import {
  calcolaHashDocumento,
  creaFirmaModel,
  mappaFirmaPerPdf,
  nomeFilePdfPreventivo,
  puoFirmarePreventivo,
  VERSIONE_DOCUMENTO,
} from "./firmaTypes";
import * as repoDefault from "./firmaRepository";

/**
 * @param {object=} deps
 */
export function creaFirmaService(deps = {}) {
  const repo = {
    upsertFirma: deps.upsertFirma || repoDefault.upsertFirma,
    trovaFirmaPerPreventivo:
      deps.trovaFirmaPerPreventivo || repoDefault.trovaFirmaPerPreventivo,
    eliminaFirmaPerPreventivo:
      deps.eliminaFirmaPerPreventivo || repoDefault.eliminaFirmaPerPreventivo,
  };

  /**
   * Crea modello firma (non persistito finché non salvi).
   * @param {{
   *   preventivo: object,
   *   firmatario: string,
   *   immagineFirma: string,
   *   note?: string,
   * }} input
   */
  function creaFirma({
    preventivo,
    firmatario,
    immagineFirma,
    note = "",
  } = {}) {
    if (!preventivo?.id) {
      return { success: false, error: "preventivo_assente" };
    }
    if (!puoFirmarePreventivo(preventivo.stato)) {
      return {
        success: false,
        error: "stato_non_firmabile",
        message:
          "È possibile firmare solo preventivi Inviato o Accettato.",
      };
    }
    const immagine = String(immagineFirma || "").trim();
    if (!immagine.startsWith("data:image")) {
      return { success: false, error: "immagine_firma_assente" };
    }
    const nome = String(firmatario || "").trim();
    if (!nome) {
      return { success: false, error: "firmatario_assente" };
    }

    const hashDocumento = calcolaHashDocumento(preventivo);
    const firma = creaFirmaModel({
      preventivoId: preventivo.id,
      firmatario: nome,
      immagineFirma: immagine,
      hashDocumento,
      versioneDocumento: VERSIONE_DOCUMENTO.FIRMATO,
      note,
      dataFirma: Date.now(),
      documenti: [
        {
          tipo: VERSIONE_DOCUMENTO.ORIGINALE,
          nomeFile: nomeFilePdfPreventivo(preventivo, false),
          hash: hashDocumento,
          generatoAt: Date.now(),
        },
      ],
    });

    return { success: true, firma };
  }

  /**
   * Persiste la firma e aggiorna versioni documento.
   * @param {object} firma
   * @param {{ registraFirmato?: boolean, preventivo?: object }=} opzioni
   */
  function salvaFirma(firma, opzioni = {}) {
    if (!firma?.preventivoId || !firma?.immagineFirma) {
      return { success: false, error: "firma_incompleta" };
    }

    const esistente = repo.trovaFirmaPerPreventivo(firma.preventivoId);
    let documenti = Array.isArray(firma.documenti)
      ? [...firma.documenti]
      : esistente?.documenti
        ? [...esistente.documenti]
        : [];

    if (opzioni.registraFirmato && opzioni.preventivo) {
      const nomeFirmato = nomeFilePdfPreventivo(opzioni.preventivo, true);
      const senzaFirmato = documenti.filter(
        (d) => d.tipo !== VERSIONE_DOCUMENTO.FIRMATO
      );
      documenti = [
        ...senzaFirmato,
        {
          tipo: VERSIONE_DOCUMENTO.FIRMATO,
          nomeFile: nomeFirmato,
          hash: firma.hashDocumento || calcolaHashDocumento(opzioni.preventivo),
          generatoAt: Date.now(),
        },
      ];
    }

    // Assicura versione originale presente
    if (
      opzioni.preventivo &&
      !documenti.some((d) => d.tipo === VERSIONE_DOCUMENTO.ORIGINALE)
    ) {
      documenti = [
        {
          tipo: VERSIONE_DOCUMENTO.ORIGINALE,
          nomeFile: nomeFilePdfPreventivo(opzioni.preventivo, false),
          hash: firma.hashDocumento || calcolaHashDocumento(opzioni.preventivo),
          generatoAt: Date.now(),
        },
        ...documenti,
      ];
    }

    const salvata = repo.upsertFirma({
      ...firma,
      documenti,
      aggiornatoAt: Date.now(),
    });

    return { success: true, firma: salvata };
  }

  /**
   * @param {string|number} preventivoId
   */
  function rimuoviFirma(preventivoId) {
    if (preventivoId === undefined || preventivoId === null) {
      return { success: false, error: "preventivo_assente" };
    }
    const ok = repo.eliminaFirmaPerPreventivo(preventivoId);
    return ok
      ? { success: true }
      : { success: false, error: "firma_assente" };
  }

  /**
   * @param {string|number} preventivoId
   * @returns {object|null}
   */
  function ottieniFirma(preventivoId) {
    return repo.trovaFirmaPerPreventivo(preventivoId);
  }

  /**
   * Restituisce la versione firmata del documento, se presente.
   * @param {string|number} preventivoId
   * @returns {{ firmato: boolean, documento?: object, firma?: object }}
   */
  function documentoFirmato(preventivoId) {
    const firma = repo.trovaFirmaPerPreventivo(preventivoId);
    if (!firma) {
      return { firmato: false };
    }
    const documento = (firma.documenti || []).find(
      (d) => d.tipo === VERSIONE_DOCUMENTO.FIRMATO
    );
    return {
      firmato: Boolean(documento || firma.immagineFirma),
      documento: documento || null,
      firma,
      originale: (firma.documenti || []).find(
        (d) => d.tipo === VERSIONE_DOCUMENTO.ORIGINALE
      ) || null,
    };
  }

  return {
    creaFirma,
    salvaFirma,
    rimuoviFirma,
    ottieniFirma,
    documentoFirmato,
    mappaFirmaPerPdf,
    puoFirmarePreventivo,
  };
}

const defaultService = creaFirmaService();

export const creaFirma = defaultService.creaFirma;
export const salvaFirma = defaultService.salvaFirma;
export const rimuoviFirma = defaultService.rimuoviFirma;
export const ottieniFirma = defaultService.ottieniFirma;
export const documentoFirmato = defaultService.documentoFirmato;

export {
  mappaFirmaPerPdf,
  puoFirmarePreventivo,
  nomeFilePdfPreventivo,
  calcolaHashDocumento,
  VERSIONE_DOCUMENTO,
  STATI_FIRMA_CONSENTITI,
} from "./firmaTypes";
