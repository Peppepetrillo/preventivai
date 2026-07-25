/**
 * Struttura documento PDF Varianti — preparazione dati.
 * L'export reale è riservato allo Sprint PDF (nessun doc.save qui).
 */

import { formatEuro } from "../../utils/preventivi";
import { calcolaTotaleCantiere } from "./variantiService";
import {
  STATI_VARIANTE_LABEL,
  TIPI_VARIANTE_LABEL,
  importoSegnatoVariante,
  varianteIncideSulTotale,
} from "./variantiTypes";

/**
 * Prepara il payload strutturato per un futuro PDF varianti.
 * NON genera né scarica file.
 *
 * @param {object} cantiere
 * @param {object=} opzioni
 * @returns {{
 *   ready: true,
 *   exportEnabled: false,
 *   titolo: string,
 *   intestazione: object,
 *   riepilogo: object,
 *   righe: object[],
 *   footer: object
 * }}
 */
export function preparaDocumentoVariantiPdf(cantiere, opzioni = {}) {
  const riepilogo =
    opzioni.riepilogo || calcolaTotaleCantiere(cantiere);
  const datiAzienda = opzioni.datiAzienda || {};

  const righe = (riepilogo.varianti || []).map((variante) => {
    const importo = importoSegnatoVariante(variante);
    return {
      id: variante.id,
      data: variante.dataCreazione || "",
      titolo: variante.titolo || variante.descrizione || "",
      tipo: variante.tipo,
      tipoLabel: TIPI_VARIANTE_LABEL[variante.tipo] || variante.tipo,
      stato: variante.stato,
      statoLabel: STATI_VARIANTE_LABEL[variante.stato] || variante.stato,
      importo,
      importoFormattato: `${importo >= 0 ? "+" : "−"}${formatEuro(Math.abs(importo))}`,
      economico: varianteIncideSulTotale(variante),
      note: variante.note || "",
    };
  });

  return {
    ready: true,
    /** Sprint PDF: abilitare export solo quando l'integrazione sarà pronta */
    exportEnabled: false,
    titolo: "Riepilogo cantiere — Varianti",
    intestazione: {
      azienda: datiAzienda.nomeDitta || "PreventivAI",
      cantiere: cantiere?.nome || "Cantiere",
      cliente: cantiere?.cliente || "Cliente non indicato",
      preventivoNumero: cantiere?.preventivoNumero || null,
    },
    riepilogo: {
      preventivoOriginale: riepilogo.preventivoOriginale,
      preventivoOriginaleFormattato: formatEuro(riepilogo.preventivoOriginale),
      deltaVarianti: riepilogo.deltaVarianti,
      deltaVariantiFormattato: `${
        riepilogo.deltaVarianti >= 0 ? "+" : ""
      }${formatEuro(riepilogo.deltaVarianti)}`,
      totaleAggiornato: riepilogo.totaleAggiornato,
      totaleAggiornatoFormattato: formatEuro(riepilogo.totaleAggiornato),
    },
    righe,
    footer: {
      nota: "Il preventivo originale non è stato modificato. Totale calcolato dinamicamente.",
    },
  };
}

/**
 * Placeholder export — intenzionalmente non genera PDF.
 * @returns {{ success: false, error: string, documento: object }}
 */
export function esportaPdfVariantiNonDisponibile(cantiere, opzioni = {}) {
  return {
    success: false,
    error: "export_pdf_non_abilitato",
    messaggio: "L'export PDF delle varianti sarà disponibile nello Sprint PDF.",
    documento: preparaDocumentoVariantiPdf(cantiere, opzioni),
  };
}
