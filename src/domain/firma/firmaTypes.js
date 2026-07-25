/**
 * Firma Cliente — tipi e factory.
 * Separata dal PDF: il PDF legge la firma, non la gestisce.
 */

export const STATI_FIRMA_CONSENTITI = Object.freeze(["Inviato", "Accettato"]);

export const VERSIONE_DOCUMENTO = Object.freeze({
  ORIGINALE: "originale",
  FIRMATO: "firmato",
});

/**
 * @typedef {Object} DocumentoVersione
 * @property {string} tipo — originale | firmato
 * @property {string} nomeFile
 * @property {string} hash
 * @property {number} generatoAt
 */

/**
 * @typedef {Object} Firma
 * @property {string} id
 * @property {string|number} preventivoId
 * @property {number} dataFirma
 * @property {string} firmatario
 * @property {string} immagineFirma — data URL PNG
 * @property {string} hashDocumento
 * @property {string} versioneDocumento
 * @property {string} note
 * @property {DocumentoVersione[]} documenti
 */

/**
 * @param {string=} prefisso
 * @returns {string}
 */
export function creaIdFirma(prefisso = "firma") {
  return `${prefisso}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * @param {string=} stato
 * @returns {boolean}
 */
export function puoFirmarePreventivo(stato) {
  return STATI_FIRMA_CONSENTITI.includes(String(stato || "").trim());
}

/**
 * @param {Partial<Firma>} dati
 * @returns {Firma}
 */
export function creaFirmaModel(dati = {}) {
  return {
    id: dati.id || creaIdFirma(),
    preventivoId: dati.preventivoId ?? null,
    dataFirma: Number(dati.dataFirma) || Date.now(),
    firmatario: String(dati.firmatario || "").trim(),
    immagineFirma: String(dati.immagineFirma || ""),
    hashDocumento: String(dati.hashDocumento || ""),
    versioneDocumento:
      dati.versioneDocumento || VERSIONE_DOCUMENTO.FIRMATO,
    note: String(dati.note || "").trim(),
    documenti: Array.isArray(dati.documenti) ? dati.documenti : [],
    creatoAt: Number(dati.creatoAt) || Date.now(),
    aggiornatoAt: Number(dati.aggiornatoAt) || Date.now(),
  };
}

/**
 * Snapshot stabile per hash documento (non include la firma).
 * @param {object} preventivo
 * @returns {string}
 */
export function snapshotHashPreventivo(preventivo = {}) {
  const payload = {
    id: preventivo.id,
    numero: preventivo.numero || "",
    cliente: preventivo.cliente || "",
    stato: preventivo.stato || "",
    lavorazioni: (preventivo.lavorazioni || []).map((l) => ({
      nome: l.nome || l.descrizione || "",
      quantita: l.quantita,
      prezzo: l.prezzo,
    })),
    sconto: preventivo.sconto,
    iva: preventivo.iva,
    totale: preventivo.totale,
    subtotale: preventivo.subtotale,
    note: preventivo.note || "",
  };
  return JSON.stringify(payload);
}

/**
 * Hash deterministico sync (djb2 hex) — integrità locale, non crittografia.
 * @param {string} testo
 * @returns {string}
 */
export function hashTesto(testo) {
  const input = String(testo || "");
  let h = 5381;
  for (let i = 0; i < input.length; i += 1) {
    h = (h * 33) ^ input.charCodeAt(i);
  }
  return `h${(h >>> 0).toString(16)}`;
}

/**
 * @param {object} preventivo
 * @returns {string}
 */
export function calcolaHashDocumento(preventivo) {
  return hashTesto(snapshotHashPreventivo(preventivo));
}

/**
 * @param {object} preventivo
 * @param {boolean=} firmato
 * @returns {string}
 */
export function nomeFilePdfPreventivo(preventivo = {}, firmato = false) {
  const base = String(preventivo.numero || "Preventivo")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^\w.-]+/g, "");
  const safe = base || "Preventivo";
  return firmato ? `${safe}_firmato.pdf` : `${safe}.pdf`;
}

/**
 * Mappa Firma → DTO firme per il motore PDF (il PDF non conosce il modulo firma).
 * @param {Firma|null|undefined} firma
 * @returns {object|undefined}
 */
export function mappaFirmaPerPdf(firma) {
  if (!firma?.immagineFirma) return undefined;
  const dataIso = firma.dataFirma
    ? new Date(firma.dataFirma).toLocaleDateString("it-IT")
    : "";
  return {
    clienteLabel: "Firma Cliente",
    installatoreLabel: "Firma Installatore",
    clienteImmagine: firma.immagineFirma,
    firmatario: firma.firmatario || "",
    dataFirma: dataIso,
    installatoreImmagine: null,
    installatorePlaceholder: true,
  };
}
