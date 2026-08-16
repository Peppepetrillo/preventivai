/**
 * Condivisione Service — condivide un PDF già pronto.
 * Non genera PDF. Preferisce il firmato se presente.
 * Web Share / mailto / wa.me / download restano qui (la UI non li conosce).
 */

import {
  TIPI_CONDIVISIONE,
  STATI_CONDIVISIONE,
  ESITI_CONDIVISIONE,
  creaCondivisioneModel,
  calcolaStatisticheCondivisioni,
  TIPI_CONDIVISIONE_LABEL,
} from "./condivisioneTypes";
import * as repoDefault from "./condivisioneRepository";
import {
  documentoFirmato,
  nomeFilePdfPreventivo,
} from "../firma";
import { apriUrlEsterno, esportaBlob } from "../../utils/nativeExport";

/**
 * @param {Blob|File|null|undefined} file
 * @param {string} nomeFile
 * @returns {File|null}
 */
export function normalizzaFileCondivisione(file, nomeFile = "Preventivo.pdf") {
  if (!file) return null;
  if (typeof File !== "undefined" && file instanceof File) return file;
  if (typeof Blob !== "undefined" && file instanceof Blob) {
    const tipo = file.type || "application/pdf";
    try {
      return new File([file], nomeFile, { type: tipo });
    } catch {
      return file;
    }
  }
  return null;
}

/**
 * Risolve quale PDF condividere (firmato se esiste), senza generarlo.
 * @param {string|number} preventivoId
 * @param {object=} preventivo
 * @returns {{ nomeFile: string, firmato: boolean }}
 */
export function risolviDocumentoDaCondividere(preventivoId, preventivo = null) {
  const info = documentoFirmato(preventivoId);
  if (info.firmato && info.documento?.nomeFile) {
    return { nomeFile: info.documento.nomeFile, firmato: true };
  }
  if (info.originale?.nomeFile) {
    return { nomeFile: info.originale.nomeFile, firmato: false };
  }
  if (info.firma?.immagineFirma && preventivo) {
    return {
      nomeFile: nomeFilePdfPreventivo(preventivo, true),
      firmato: true,
    };
  }
  return {
    nomeFile: nomeFilePdfPreventivo(preventivo || {}, false),
    firmato: false,
  };
}

function pulisciTelefonoWhatsApp(telefono) {
  return String(telefono || "").replace(/\D/g, "");
}

function costruisciMailto({ destinatario, oggetto, corpo }) {
  const to = encodeURIComponent(String(destinatario || "").trim());
  const subject = encodeURIComponent(oggetto || "Preventivo");
  const body = encodeURIComponent(corpo || "");
  return `mailto:${to}?subject=${subject}&body=${body}`;
}

function costruisciWaMe({ destinatario, messaggio }) {
  const phone = pulisciTelefonoWhatsApp(destinatario);
  const text = encodeURIComponent(messaggio || "");
  if (phone) return `https://wa.me/${phone}?text=${text}`;
  return `https://wa.me/?text=${text}`;
}

/**
 * @param {object=} deps
 */
export function creaCondivisioneService(deps = {}) {
  const repo = {
    inserisciCondivisione:
      deps.inserisciCondivisione || repoDefault.inserisciCondivisione,
    leggiCondivisioniPerPreventivo:
      deps.leggiCondivisioniPerPreventivo ||
      repoDefault.leggiCondivisioniPerPreventivo,
  };

  const env = {
    canShare: deps.canShare || ((payload) => {
      try {
        return Boolean(
          globalThis.navigator?.canShare &&
            globalThis.navigator.canShare(payload)
        );
      } catch {
        return false;
      }
    }),
    share: deps.share || (async (payload) => {
      if (!globalThis.navigator?.share) {
        throw new Error("share_non_disponibile");
      }
      return globalThis.navigator.share(payload);
    }),
    openUrl: deps.openUrl || ((url) => {
      apriUrlEsterno(url);
    }),
    scaricaBlob: deps.scaricaBlob || (async (blob, nomeFile) => {
      await esportaBlob(blob, nomeFile || "Preventivo.pdf", {
        titolo: nomeFile || "Preventivo.pdf",
      });
    }),
    risolviDocumento:
      deps.risolviDocumento || risolviDocumentoDaCondividere,
  };

  function registra({
    preventivoId,
    tipo,
    file,
    destinatario,
    esito,
    stato = STATI_CONDIVISIONE.COMPLETATO,
    errore = "",
    firmato = false,
    canale = "",
  }) {
    return repo.inserisciCondivisione(
      creaCondivisioneModel({
        preventivoId,
        tipo,
        file,
        destinatario,
        esito,
        stato,
        errore,
        firmato,
        canale,
        data: Date.now(),
      })
    );
  }

  function richiedeDocumento(file, nomeFile) {
    const pronto = normalizzaFileCondivisione(file, nomeFile);
    if (!pronto) {
      return {
        success: false,
        error: "documento_assente",
        message:
          "Nessun PDF pronto. Genera o visualizza il documento prima di condividere.",
      };
    }
    return { success: true, file: pronto };
  }

  /**
   * Download locale del PDF già pronto.
   */
  async function downloadPdf({
    preventivoId,
    file,
    preventivo = null,
    destinatario = "Locale",
  } = {}) {
    if (preventivoId === undefined || preventivoId === null) {
      return { success: false, error: "preventivo_assente" };
    }
    const docInfo = env.risolviDocumento(preventivoId, preventivo);
    const check = richiedeDocumento(file, docInfo.nomeFile);
    if (!check.success) return check;

    try {
      env.scaricaBlob(check.file, docInfo.nomeFile);
      const voce = registra({
        preventivoId,
        tipo: TIPI_CONDIVISIONE.DOWNLOAD,
        file: docInfo.nomeFile,
        destinatario: destinatario || "Locale",
        esito: ESITI_CONDIVISIONE.COMPLETATO,
        firmato: docInfo.firmato,
        canale: "download",
      });
      return { success: true, condivisione: voce, nomeFile: docInfo.nomeFile };
    } catch (errore) {
      const voce = registra({
        preventivoId,
        tipo: TIPI_CONDIVISIONE.DOWNLOAD,
        file: docInfo.nomeFile,
        destinatario: destinatario || "Locale",
        esito: ESITI_CONDIVISIONE.FALLITO,
        stato: STATI_CONDIVISIONE.FALLITO,
        errore: errore?.message || "download_fallito",
        firmato: docInfo.firmato,
        canale: "download",
      });
      return { success: false, error: "download_fallito", condivisione: voce };
    }
  }

  /**
   * Condivisione generica (Web Share API o fallback download).
   */
  async function condividi({
    preventivoId,
    file,
    preventivo = null,
    titolo = "Preventivo",
    testo = "",
    destinatario = "Sistema",
  } = {}) {
    if (preventivoId === undefined || preventivoId === null) {
      return { success: false, error: "preventivo_assente" };
    }
    const docInfo = env.risolviDocumento(preventivoId, preventivo);
    const check = richiedeDocumento(file, docInfo.nomeFile);
    if (!check.success) return check;

    const payloadFiles = { files: [check.file], title: titolo, text: testo };

    try {
      if (env.canShare(payloadFiles)) {
        await env.share(payloadFiles);
        const voce = registra({
          preventivoId,
          tipo: TIPI_CONDIVISIONE.SHARE,
          file: docInfo.nomeFile,
          destinatario,
          esito: ESITI_CONDIVISIONE.CONDIVISO,
          firmato: docInfo.firmato,
          canale: "web_share",
        });
        return {
          success: true,
          condivisione: voce,
          canale: "web_share",
          nomeFile: docInfo.nomeFile,
        };
      }

      // Fallback: download
      env.scaricaBlob(check.file, docInfo.nomeFile);
      const voce = registra({
        preventivoId,
        tipo: TIPI_CONDIVISIONE.SHARE,
        file: docInfo.nomeFile,
        destinatario: "Locale",
        esito: ESITI_CONDIVISIONE.COMPLETATO,
        firmato: docInfo.firmato,
        canale: "download",
      });
      return {
        success: true,
        condivisione: voce,
        canale: "download",
        fallback: true,
        nomeFile: docInfo.nomeFile,
      };
    } catch (errore) {
      if (errore?.name === "AbortError") {
        const voce = registra({
          preventivoId,
          tipo: TIPI_CONDIVISIONE.SHARE,
          file: docInfo.nomeFile,
          destinatario,
          esito: ESITI_CONDIVISIONE.ANNULLATO,
          stato: STATI_CONDIVISIONE.ANNULLATO,
          errore: "annullato_utente",
          firmato: docInfo.firmato,
          canale: "web_share",
        });
        return { success: false, error: "annullato", condivisione: voce };
      }

      // Fallback download su errore share
      try {
        env.scaricaBlob(check.file, docInfo.nomeFile);
        const voce = registra({
          preventivoId,
          tipo: TIPI_CONDIVISIONE.SHARE,
          file: docInfo.nomeFile,
          destinatario: "Locale",
          esito: ESITI_CONDIVISIONE.COMPLETATO,
          firmato: docInfo.firmato,
          canale: "download",
        });
        return {
          success: true,
          condivisione: voce,
          canale: "download",
          fallback: true,
          nomeFile: docInfo.nomeFile,
        };
      } catch (errDownload) {
        const voce = registra({
          preventivoId,
          tipo: TIPI_CONDIVISIONE.SHARE,
          file: docInfo.nomeFile,
          destinatario,
          esito: ESITI_CONDIVISIONE.FALLITO,
          stato: STATI_CONDIVISIONE.FALLITO,
          errore: errDownload?.message || errore?.message || "share_fallito",
          firmato: docInfo.firmato,
          canale: "web_share",
        });
        return { success: false, error: "share_fallito", condivisione: voce };
      }
    }
  }

  /**
   * Email: Web Share se possibile, altrimenti mailto.
   */
  async function condividiEmail({
    preventivoId,
    file,
    preventivo = null,
    destinatario = "",
    oggetto = "",
    corpo = "",
  } = {}) {
    if (preventivoId === undefined || preventivoId === null) {
      return { success: false, error: "preventivo_assente" };
    }
    const docInfo = env.risolviDocumento(preventivoId, preventivo);
    const check = richiedeDocumento(file, docInfo.nomeFile);
    if (!check.success) return check;

    const subject =
      oggetto ||
      `Preventivo ${preventivo?.numero || ""}`.trim() ||
      "Preventivo";
    const body =
      corpo ||
      `In allegato il preventivo${docInfo.firmato ? " firmato" : ""} (${docInfo.nomeFile}).`;

    const payloadFiles = {
      files: [check.file],
      title: subject,
      text: body,
    };

    try {
      if (env.canShare(payloadFiles)) {
        await env.share(payloadFiles);
        const voce = registra({
          preventivoId,
          tipo: TIPI_CONDIVISIONE.EMAIL,
          file: docInfo.nomeFile,
          destinatario: destinatario || "Email",
          esito: ESITI_CONDIVISIONE.INVIATO,
          firmato: docInfo.firmato,
          canale: "web_share",
        });
        return {
          success: true,
          condivisione: voce,
          canale: "web_share",
          nomeFile: docInfo.nomeFile,
        };
      }
    } catch (errore) {
      if (errore?.name === "AbortError") {
        const voce = registra({
          preventivoId,
          tipo: TIPI_CONDIVISIONE.EMAIL,
          file: docInfo.nomeFile,
          destinatario: destinatario || "Email",
          esito: ESITI_CONDIVISIONE.ANNULLATO,
          stato: STATI_CONDIVISIONE.ANNULLATO,
          errore: "annullato_utente",
          firmato: docInfo.firmato,
          canale: "web_share",
        });
        return { success: false, error: "annullato", condivisione: voce };
      }
    }

    // Fallback mailto (senza allegato — il client email apre il messaggio)
    const url = costruisciMailto({
      destinatario,
      oggetto: subject,
      corpo: `${body}\n\nDocumento: ${docInfo.nomeFile}`,
    });
    env.openUrl(url);
    const voce = registra({
      preventivoId,
      tipo: TIPI_CONDIVISIONE.EMAIL,
      file: docInfo.nomeFile,
      destinatario: destinatario || "Email",
      esito: ESITI_CONDIVISIONE.APERTO,
      firmato: docInfo.firmato,
      canale: "mailto",
    });
    return {
      success: true,
      condivisione: voce,
      canale: "mailto",
      fallback: true,
      nomeFile: docInfo.nomeFile,
    };
  }

  /**
   * WhatsApp: Web Share se possibile, altrimenti wa.me.
   */
  async function condividiWhatsApp({
    preventivoId,
    file,
    preventivo = null,
    destinatario = "",
    messaggio = "",
  } = {}) {
    if (preventivoId === undefined || preventivoId === null) {
      return { success: false, error: "preventivo_assente" };
    }
    const docInfo = env.risolviDocumento(preventivoId, preventivo);
    const check = richiedeDocumento(file, docInfo.nomeFile);
    if (!check.success) return check;

    const text =
      messaggio ||
      `Preventivo ${preventivo?.numero || ""}${docInfo.firmato ? " firmato" : ""} — ${docInfo.nomeFile}`.trim();

    const payloadFiles = {
      files: [check.file],
      title: "Preventivo",
      text,
    };

    try {
      if (env.canShare(payloadFiles)) {
        await env.share(payloadFiles);
        const voce = registra({
          preventivoId,
          tipo: TIPI_CONDIVISIONE.WHATSAPP,
          file: docInfo.nomeFile,
          destinatario: destinatario || "WhatsApp",
          esito: ESITI_CONDIVISIONE.CONSEGNATO,
          firmato: docInfo.firmato,
          canale: "web_share",
        });
        return {
          success: true,
          condivisione: voce,
          canale: "web_share",
          nomeFile: docInfo.nomeFile,
        };
      }
    } catch (errore) {
      if (errore?.name === "AbortError") {
        const voce = registra({
          preventivoId,
          tipo: TIPI_CONDIVISIONE.WHATSAPP,
          file: docInfo.nomeFile,
          destinatario: destinatario || "WhatsApp",
          esito: ESITI_CONDIVISIONE.ANNULLATO,
          stato: STATI_CONDIVISIONE.ANNULLATO,
          errore: "annullato_utente",
          firmato: docInfo.firmato,
          canale: "web_share",
        });
        return { success: false, error: "annullato", condivisione: voce };
      }
    }

    const url = costruisciWaMe({ destinatario, messaggio: text });
    env.openUrl(url);
    const voce = registra({
      preventivoId,
      tipo: TIPI_CONDIVISIONE.WHATSAPP,
      file: docInfo.nomeFile,
      destinatario: destinatario || "WhatsApp",
      esito: ESITI_CONDIVISIONE.CONSEGNATO,
      firmato: docInfo.firmato,
      canale: "wa.me",
    });
    return {
      success: true,
      condivisione: voce,
      canale: "wa.me",
      fallback: true,
      nomeFile: docInfo.nomeFile,
    };
  }

  /**
   * @param {string|number} preventivoId
   * @returns {object[]}
   */
  function ottieniStorico(preventivoId) {
    return repo.leggiCondivisioniPerPreventivo(preventivoId);
  }

  /**
   * @param {string|number} preventivoId
   */
  function ottieniStatistiche(preventivoId) {
    return calcolaStatisticheCondivisioni(ottieniStorico(preventivoId));
  }

  return {
    condividiEmail,
    condividiWhatsApp,
    condividi,
    downloadPdf,
    ottieniStorico,
    ottieniStatistiche,
    risolviDocumentoDaCondividere: env.risolviDocumento,
  };
}

const defaultService = creaCondivisioneService();

export const condividiEmail = defaultService.condividiEmail;
export const condividiWhatsApp = defaultService.condividiWhatsApp;
export const condividi = defaultService.condividi;
export const downloadPdf = defaultService.downloadPdf;
export const ottieniStorico = defaultService.ottieniStorico;
export const ottieniStatistiche = defaultService.ottieniStatistiche;

export {
  TIPI_CONDIVISIONE,
  TIPI_CONDIVISIONE_LABEL,
  STATI_CONDIVISIONE,
  ESITI_CONDIVISIONE,
  calcolaStatisticheCondivisioni,
  creaCondivisioneModel,
};
