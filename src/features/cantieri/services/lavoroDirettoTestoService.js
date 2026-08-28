import {
  etichettaTipoIntervento,
  isCantiereDiretto,
} from "../cantieriDomain";
import {
  calcolaRimanenzaCantiere,
  leggiTotaleCantiereEconomico,
  leggiTotaleIncassato,
} from "./pagamentiCantiereService";
import { formatEuro } from "../../../utils/preventivi";
import { apriUrlEsterno } from "../../../utils/nativeExport";

/**
 * Testo riepilogo professionale per lavoro diretto (WhatsApp / copia).
 * @param {object} cantiere
 */
export function generaTestoRiepilogoLavoroDiretto(cantiere = {}) {
  const cliente = String(cantiere.cliente || "").trim() || "Cliente";
  const tipo = etichettaTipoIntervento(cantiere.tipoIntervento);
  const descrizione = String(
    cantiere.descrizioneIntervento || cantiere.descrizione || ""
  ).trim();
  const totale = isCantiereDiretto(cantiere)
    ? leggiTotaleCantiereEconomico(cantiere)
    : Number(cantiere.preventivoOriginaleTotale || 0);
  const acconto = leggiTotaleIncassato(cantiere);
  const saldo = calcolaRimanenzaCantiere(cantiere, totale);

  const righe = [
    "INTERVENTO — PreventivAI",
    "",
    `Cliente: ${cliente}`,
    `Intervento: ${tipo}`,
  ];

  if (cantiere.indirizzo) {
    righe.push(`Indirizzo: ${String(cantiere.indirizzo).trim()}`);
  }

  if (descrizione) {
    righe.push("", "Descrizione:", descrizione);
  }

  righe.push(
    "",
    `Totale intervento: ${formatEuro(totale)}`,
    `Già incassato: ${formatEuro(acconto)}`,
    `Resta da incassare: ${formatEuro(saldo)}`,
    "",
    "Grazie."
  );

  return righe.join("\n");
}

/**
 * @param {string} testo
 * @param {string=} telefono
 */
export function apriWhatsAppConTesto(testo, telefono = "") {
  const phone = String(telefono || "").replace(/\D/g, "");
  const text = encodeURIComponent(String(testo || ""));
  const url = phone
    ? `https://wa.me/${phone}?text=${text}`
    : `https://wa.me/?text=${text}`;
  if (typeof window !== "undefined") {
    apriUrlEsterno(url);
  }
  return url;
}
