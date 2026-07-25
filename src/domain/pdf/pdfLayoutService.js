/**
 * PDF Layout Service — geometria, colori, interruzioni pagina.
 * Nessun rendering business; solo misure e helper di layout.
 */

import { PDF_PAGE } from "./pdfTypes";

/**
 * @param {object} settings
 */
export function areaUtile(settings) {
  const m = settings.margine;
  return {
    x: m,
    yTop: m,
    yBottom: PDF_PAGE.height - settings.footerAltezza,
    width: PDF_PAGE.width - m * 2,
    contentBottom: PDF_PAGE.height - settings.footerAltezza - 4,
  };
}

/**
 * @param {object} settings
 * @param {number} y
 */
export function spazioRimanente(settings, y) {
  return areaUtile(settings).contentBottom - y;
}

/**
 * Se non c'è spazio, aggiunge pagina e ritorna y di ripresa (sotto header continuo).
 * @param {import("jspdf").jsPDF} doc
 * @param {object} settings
 * @param {number} y
 * @param {number} necessario
 * @param {(doc: object, settings: object) => number} onNuovaPagina
 */
export function assicuratiSpazio(doc, settings, y, necessario, onNuovaPagina) {
  if (spazioRimanente(settings, y) >= necessario) return y;
  doc.addPage();
  return typeof onNuovaPagina === "function"
    ? onNuovaPagina(doc, settings)
    : settings.margine + 8;
}

/**
 * Colonne tabella lavorazioni (x relative al margine).
 * @param {object} settings
 */
export function colonneLavorazioni(settings) {
  const area = areaUtile(settings);
  const x0 = area.x;
  const w = area.width;
  return {
    x0,
    width: w,
    descrizione: x0 + 2,
    descrizioneMax: w * 0.48,
    quantita: x0 + w * 0.58,
    prezzo: x0 + w * 0.76,
    totale: x0 + w - 2,
  };
}

/**
 * Applica font settings al documento.
 * @param {import("jspdf").jsPDF} doc
 * @param {object} settings
 * @param {"normal"|"bold"} stile
 * @param {number=} size
 */
export function applicaFont(doc, settings, stile = "normal", size) {
  doc.setFont(settings.font || "helvetica", stile);
  doc.setFontSize(size || settings.fontSizeBase);
}

/**
 * @param {import("jspdf").jsPDF} doc
 * @param {number[]} rgb
 */
export function setFill(doc, rgb) {
  doc.setFillColor(...rgb);
}

/**
 * @param {import("jspdf").jsPDF} doc
 * @param {number[]} rgb
 */
export function setStroke(doc, rgb) {
  doc.setDrawColor(...rgb);
}

/**
 * @param {import("jspdf").jsPDF} doc
 * @param {number[]} rgb
 */
export function setText(doc, rgb) {
  doc.setTextColor(...rgb);
}

/**
 * Testo con wrap; ritorna y finale.
 * @param {import("jspdf").jsPDF} doc
 * @param {string} valore
 * @param {number} x
 * @param {number} y
 * @param {number} maxWidth
 * @param {number} lineHeight
 */
export function testoMultilinea(doc, valore, x, y, maxWidth, lineHeight = 4.2) {
  const linee = doc.splitTextToSize(String(valore || ""), maxWidth);
  doc.text(linee, x, y);
  return y + linee.length * lineHeight;
}

/**
 * Altezza stimata di un blocco testo wrappato.
 */
export function stimaAltezzaTesto(doc, valore, maxWidth, lineHeight = 4.2) {
  const linee = doc.splitTextToSize(String(valore || "—"), maxWidth);
  return Math.max(linee.length, 1) * lineHeight;
}
