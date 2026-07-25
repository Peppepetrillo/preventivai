/**
 * Condivisione preventivo — tipi e factory.
 * Non genera PDF: riceve un documento già pronto.
 */

export const TIPI_CONDIVISIONE = Object.freeze({
  EMAIL: "EMAIL",
  WHATSAPP: "WHATSAPP",
  SHARE: "SHARE",
  DOWNLOAD: "DOWNLOAD",
});

export const TIPI_CONDIVISIONE_LABEL = Object.freeze({
  [TIPI_CONDIVISIONE.EMAIL]: "Email",
  [TIPI_CONDIVISIONE.WHATSAPP]: "WhatsApp",
  [TIPI_CONDIVISIONE.SHARE]: "Condivisione",
  [TIPI_CONDIVISIONE.DOWNLOAD]: "Download",
});

export const STATI_CONDIVISIONE = Object.freeze({
  IN_CORSO: "in_corso",
  COMPLETATO: "completato",
  FALLITO: "fallito",
  ANNULLATO: "annullato",
});

export const ESITI_CONDIVISIONE = Object.freeze({
  INVIATO: "Inviato",
  CONSEGNATO: "Consegnato",
  COMPLETATO: "Completato",
  APERTO: "Aperto",
  CONDIVISO: "Condiviso",
  FALLITO: "Fallito",
  ANNULLATO: "Annullato",
});

/**
 * @typedef {Object} Condivisione
 * @property {string} id
 * @property {string|number} preventivoId
 * @property {string} tipo
 * @property {string} file — nome file condiviso
 * @property {string} stato
 * @property {number} data
 * @property {string} destinatario
 * @property {string} esito
 * @property {string} errore
 * @property {boolean=} firmato
 * @property {string=} canale — web_share | mailto | wa.me | download
 */

/**
 * @param {string=} prefisso
 * @returns {string}
 */
export function creaIdCondivisione(prefisso = "share") {
  return `${prefisso}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * @param {string=} tipo
 * @returns {string}
 */
export function normalizzaTipoCondivisione(tipo) {
  const grezzo = String(tipo || "")
    .trim()
    .toUpperCase();
  if (Object.values(TIPI_CONDIVISIONE).includes(grezzo)) return grezzo;
  return TIPI_CONDIVISIONE.SHARE;
}

/**
 * @param {Partial<Condivisione>} dati
 * @returns {Condivisione}
 */
export function creaCondivisioneModel(dati = {}) {
  return {
    id: dati.id || creaIdCondivisione(),
    preventivoId: dati.preventivoId ?? null,
    tipo: normalizzaTipoCondivisione(dati.tipo),
    file: String(dati.file || "").trim(),
    stato: dati.stato || STATI_CONDIVISIONE.COMPLETATO,
    data: Number(dati.data) || Date.now(),
    destinatario: String(dati.destinatario || "").trim() || "Locale",
    esito: String(dati.esito || ESITI_CONDIVISIONE.COMPLETATO).trim(),
    errore: String(dati.errore || "").trim(),
    firmato: Boolean(dati.firmato),
    canale: String(dati.canale || "").trim(),
  };
}

/**
 * @param {object[]} storico
 * @returns {{ numero: number, ultima: number|null, canalePreferito: string|null, canalePreferitoLabel: string }}
 */
export function calcolaStatisticheCondivisioni(storico = []) {
  const elenco = Array.isArray(storico) ? storico : [];
  if (elenco.length === 0) {
    return {
      numero: 0,
      ultima: null,
      canalePreferito: null,
      canalePreferitoLabel: "—",
    };
  }

  const conteggio = {};
  let ultima = null;
  for (const voce of elenco) {
    const tipo = normalizzaTipoCondivisione(voce.tipo);
    conteggio[tipo] = (conteggio[tipo] || 0) + 1;
    const ts = Number(voce.data) || 0;
    if (!ultima || ts > ultima) ultima = ts;
  }

  let canalePreferito = null;
  let max = -1;
  for (const [tipo, n] of Object.entries(conteggio)) {
    if (n > max) {
      max = n;
      canalePreferito = tipo;
    }
  }

  return {
    numero: elenco.length,
    ultima,
    canalePreferito,
    canalePreferitoLabel: canalePreferito
      ? TIPI_CONDIVISIONE_LABEL[canalePreferito] || canalePreferito
      : "—",
  };
}
