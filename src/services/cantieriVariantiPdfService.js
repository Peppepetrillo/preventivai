import jsPDF from "jspdf";

import { formatEuro } from "../utils/preventivi";
import {
  importoSegnatoVariante,
  riepilogoEconomicoCantiere,
} from "../features/cantieri/cantiereVariantiDomain";

/**
 * PDF riepilogo economico del cantiere (preventivo originale + varianti).
 * Non modifica il PDF preventivo esistente.
 *
 * @param {object} cantiere
 * @param {object=} datiAzienda
 */
export async function generaPdfVariantiCantiere(cantiere, datiAzienda = {}) {
  const doc = new jsPDF();
  const riepilogo = riepilogoEconomicoCantiere(cantiere);
  let y = 20;

  doc.setFontSize(16);
  doc.setFont(undefined, "bold");
  doc.text(datiAzienda.nomeDitta || "PreventivAI", 14, y);
  y += 10;

  doc.setFontSize(18);
  doc.text("Riepilogo cantiere", 14, y);
  y += 8;

  doc.setFont(undefined, "normal");
  doc.setFontSize(11);
  doc.setTextColor(80);
  doc.text(cantiere?.nome || "Cantiere", 14, y);
  y += 6;
  doc.text(cantiere?.cliente || "Cliente non indicato", 14, y);
  y += 10;

  doc.setTextColor(0);
  doc.setFont(undefined, "bold");
  doc.text("Preventivo originale", 14, y);
  doc.text(formatEuro(riepilogo.preventivoOriginale), 196, y, { align: "right" });
  y += 8;

  doc.setDrawColor(200);
  doc.line(14, y, 196, y);
  y += 10;

  doc.text("Varianti", 14, y);
  y += 8;
  doc.setFont(undefined, "normal");

  if (riepilogo.varianti.length === 0) {
    doc.setTextColor(120);
    doc.text("Nessuna variante", 14, y);
    y += 8;
  } else {
    for (const variante of riepilogo.varianti) {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      const importo = importoSegnatoVariante(variante);
      const prefisso = importo >= 0 ? "+" : "−";
      doc.setTextColor(0);
      doc.text(
        `${variante.data || ""}  ${prefisso} ${variante.descrizione || ""}`,
        14,
        y,
        { maxWidth: 140 }
      );
      doc.text(
        `${prefisso}${formatEuro(Math.abs(importo))}`,
        196,
        y,
        { align: "right" }
      );
      y += 8;
    }
  }

  y += 4;
  doc.setDrawColor(200);
  doc.line(14, y, 196, y);
  y += 10;

  doc.setFont(undefined, "bold");
  doc.setFontSize(13);
  doc.setTextColor(0);
  doc.text("Totale finale", 14, y);
  doc.text(formatEuro(riepilogo.totaleAggiornato), 196, y, { align: "right" });

  const nomeFile = `cantiere-varianti-${cantiere?.id || "export"}.pdf`;
  doc.save(nomeFile);
  return nomeFile;
}
