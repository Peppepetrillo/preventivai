/**
 * PDF PreventivAI — tipi, settings e modello documento.
 * Nessuna dipendenza da repository o UI.
 */

import pkg from "../../../package.json";

export const APP_VERSION = pkg.version || "1.0.0";

/** Formato A4 in mm (jsPDF default). */
export const PDF_PAGE = Object.freeze({
  width: 210,
  height: 297,
  format: "a4",
  orientation: "portrait",
});

/**
 * Impostazioni layout/branding PDF (configurabili).
 * @typedef {Object} PdfSettings
 * @property {string=} logo
 * @property {number[]} colorePrincipale RGB
 * @property {number[]} coloreSecondario RGB
 * @property {string} font
 * @property {number} fontSizeBase
 * @property {number} fontSizeTitolo
 * @property {number} fontSizePiccolo
 * @property {number} margine
 * @property {number} headerAltezza
 * @property {number} footerAltezza
 */

export const PDF_SETTINGS_DEFAULT = Object.freeze({
  logo: null,
  colorePrincipale: [180, 130, 20],
  coloreSecondario: [24, 32, 48],
  coloreTesto: [35, 42, 55],
  coloreTenue: [100, 110, 125],
  coloreBordo: [210, 216, 224],
  coloreFondo: [247, 248, 250],
  coloreBianco: [255, 255, 255],
  font: "helvetica",
  fontSizeBase: 9,
  fontSizeTitolo: 16,
  fontSizePiccolo: 7.5,
  margine: 16,
  headerAltezza: 42,
  footerAltezza: 16,
  rigaTabella: 8,
});

/**
 * Unisce settings utente con i default.
 * @param {Partial<PdfSettings>|object=} grezzo
 * @returns {object}
 */
export function risolviPdfSettings(grezzo = {}) {
  const base = { ...PDF_SETTINGS_DEFAULT };
  if (!grezzo || typeof grezzo !== "object") return base;

  const rgb = (valore, fallback) =>
    Array.isArray(valore) && valore.length >= 3
      ? [Number(valore[0]) || 0, Number(valore[1]) || 0, Number(valore[2]) || 0]
      : fallback;

  return {
    ...base,
    ...grezzo,
    logo: grezzo.logo ?? base.logo,
    colorePrincipale: rgb(grezzo.colorePrincipale, base.colorePrincipale),
    coloreSecondario: rgb(grezzo.coloreSecondario, base.coloreSecondario),
    coloreTesto: rgb(grezzo.coloreTesto, base.coloreTesto),
    coloreTenue: rgb(grezzo.coloreTenue, base.coloreTenue),
    coloreBordo: rgb(grezzo.coloreBordo, base.coloreBordo),
    coloreFondo: rgb(grezzo.coloreFondo, base.coloreFondo),
    font: String(grezzo.font || base.font),
    fontSizeBase: Number(grezzo.fontSizeBase) || base.fontSizeBase,
    fontSizeTitolo: Number(grezzo.fontSizeTitolo) || base.fontSizeTitolo,
    fontSizePiccolo: Number(grezzo.fontSizePiccolo) || base.fontSizePiccolo,
    margine: Number(grezzo.margine) || base.margine,
    headerAltezza: Number(grezzo.headerAltezza) || base.headerAltezza,
    footerAltezza: Number(grezzo.footerAltezza) || base.footerAltezza,
    rigaTabella: Number(grezzo.rigaTabella) || base.rigaTabella,
  };
}

/**
 * Documento PDF completo (DTO) — input unico del motore di rendering.
 * @typedef {Object} PreventivoPdfDocument
 * @property {object} settings
 * @property {object} azienda
 * @property {object} cliente
 * @property {object} intestazione
 * @property {object[]} lavorazioni
 * @property {object} riepilogo
 * @property {object} acconto
 * @property {string} condizioni
 * @property {string} note
 * @property {object} firme
 * @property {object} meta
 */

/**
 * @param {Partial<PreventivoPdfDocument>} patch
 * @returns {PreventivoPdfDocument}
 */
export function creaPreventivoPdfDocument(patch = {}) {
  return {
    settings: risolviPdfSettings(patch.settings),
    azienda: {
      nome: "",
      indirizzo: "",
      telefono: "",
      email: "",
      partitaIva: "",
      logo: null,
      ...(patch.azienda || {}),
    },
    cliente: {
      nome: "",
      telefono: "",
      email: "",
      indirizzo: "",
      ...(patch.cliente || {}),
    },
    intestazione: {
      numero: "",
      data: "",
      validita: "",
      oggetto: "Preventivo lavori elettrici",
      stato: "",
      pagamento: "",
      ...(patch.intestazione || {}),
    },
    lavorazioni: Array.isArray(patch.lavorazioni) ? patch.lavorazioni : [],
    riepilogo: {
      subtotale: 0,
      scontoPercentuale: 0,
      importoSconto: 0,
      imponibile: 0,
      ivaPercentuale: 0,
      importoIva: 0,
      totale: 0,
      ...(patch.riepilogo || {}),
    },
    acconto: {
      richiesto: 0,
      residuo: 0,
      ...(patch.acconto || {}),
    },
    condizioni: String(patch.condizioni || ""),
    note: String(patch.note || ""),
    firme: {
      clienteLabel: "Firma Cliente",
      installatoreLabel: "Firma Installatore",
      clienteImmagine: null,
      installatoreImmagine: null,
      firmatario: "",
      dataFirma: "",
      installatorePlaceholder: true,
      ...(patch.firme || {}),
    },
    meta: {
      appName: "PreventivAI",
      appVersion: APP_VERSION,
      generatoIl: new Date().toISOString(),
      ...(patch.meta || {}),
    },
  };
}
