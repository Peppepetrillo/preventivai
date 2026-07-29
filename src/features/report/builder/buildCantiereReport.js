import {
  STATI_VARIANTE,
  STATI_VARIANTE_LABEL,
  calcolaTotaleCantiere,
  ottieniVarianti,
} from "../../../domain/varianti";
import { risolviPdfSettings } from "../../../domain/pdf/pdfTypes";
import { DIARIO_EVENT_TYPES } from "../../diario/events/constants";
import {
  formatDiarioTime,
  leggiDiarioCantiere,
  serializeDiarioEvent,
  sortDiarioEventsChronologico,
} from "../../diario/timeline/diarioTimeline";
import { formatEuro, normalizzaNumero } from "../../../utils/preventivi";

function valoreIncassato(cantiere = {}) {
  return normalizzaNumero(
    cantiere.incassato ??
      cantiere.extra?.incassato ??
      cantiere.acconto ??
      cantiere.extra?.acconto ??
      0
  );
}

function dataDaTimestamp(timestamp) {
  return new Date(Number(timestamp) || Date.now()).toLocaleDateString("it-IT");
}

function risolviDataConclusione(cantiere = {}, eventi = []) {
  const completato = eventi.find(
    (evento) => evento.type === DIARIO_EVENT_TYPES.CANTIERE_COMPLETATO
  );
  if (completato) return dataDaTimestamp(completato.timestamp);
  if (cantiere.stato === "Completato") {
    return cantiere.aggiornatoIl || cantiere.dataCreazione || "";
  }
  return "";
}

function raccogliFotografie(cantiere = {}, eventi = []) {
  const viste = new Set();
  const fotografie = [];

  for (const foto of cantiere.foto || []) {
    const src = foto.src || foto.miniatura || "";
    if (!src || viste.has(src)) continue;
    viste.add(src);
    fotografie.push({
      id: foto.id,
      src,
      thumbnail: foto.miniatura || foto.src || "",
      didascalia: foto.nome || "Foto cantiere",
    });
  }

  for (const evento of eventi) {
    if (evento.type !== DIARIO_EVENT_TYPES.FOTO) continue;
    for (const allegato of evento.attachments || []) {
      const src = allegato.src || allegato.thumbnail || "";
      if (!src || viste.has(src)) continue;
      viste.add(src);
      fotografie.push({
        id: allegato.id || evento.id,
        src,
        thumbnail: allegato.thumbnail || allegato.src || "",
        didascalia: allegato.alt || evento.description || evento.title,
      });
    }
  }

  return fotografie;
}

/**
 * Costruisce il DTO report a partire dal cantiere e dal diario.
 * @param {{ cantiere?: object, datiAzienda?: object, preventivo?: object }} input
 */
export function buildCantiereReport({
  cantiere = {},
  datiAzienda = {},
  preventivo = null,
} = {}) {
  const eventi = sortDiarioEventsChronologico(
    leggiDiarioCantiere(cantiere).map(serializeDiarioEvent)
  );
  const economico = calcolaTotaleCantiere(cantiere);
  const incassato = valoreIncassato(cantiere);
  const varianti = cantiere?.id ? ottieniVarianti(cantiere.id, cantiere) : [];
  const variantiApprovate = varianti.filter(
    (variante) =>
      variante.stato === STATI_VARIANTE.APPROVATA ||
      variante.stato === STATI_VARIANTE.ESEGUITA
  );

  const note = eventi
    .filter((evento) => evento.type === DIARIO_EVENT_TYPES.NOTA_MANUALE)
    .map((evento) => evento.description)
    .filter(Boolean);

  const cronologia = eventi.map((evento) => ({
    id: evento.id,
    ora: formatDiarioTime(evento.timestamp),
    data: dataDaTimestamp(evento.timestamp),
    icona: evento.icon,
    titolo: evento.title,
    descrizione: evento.description,
    timestamp: evento.timestamp,
  }));

  return {
    copertina: {
      logo: datiAzienda.logo || null,
      nomeAzienda: datiAzienda.nomeDitta || "PreventivAI",
      cliente: cantiere.cliente || "",
      indirizzo: cantiere.indirizzo || "",
      numeroCantiere:
        cantiere.preventivoNumero ||
        cantiere.nome ||
        `Cantiere ${cantiere.id || ""}`,
      dataApertura:
        cantiere.dataCreazione ||
        cantiere.creatoIl ||
        cantiere.dataAccettazione ||
        "",
      dataConclusione: risolviDataConclusione(cantiere, eventi),
    },
    riepilogo: {
      lavorazioni: (cantiere.lavorazioniOrigine || []).map((voce) => ({
        nome: voce.nome,
        quantita: normalizzaNumero(voce.quantita, 1),
        unita: voce.unita || "cad",
      })),
      preventivoOrigine: {
        numero: cantiere.preventivoNumero || preventivo?.numero || "",
        totale: economico.preventivoOriginale,
        totaleLabel: formatEuro(economico.preventivoOriginale),
      },
      variantiApprovate: variantiApprovate.map((variante) => ({
        id: variante.id,
        titolo: variante.titolo || variante.descrizione || "Variante",
        stato: STATI_VARIANTE_LABEL[variante.stato] || variante.stato,
        totale: normalizzaNumero(variante.totale ?? variante.importo),
        totaleLabel: formatEuro(variante.totale ?? variante.importo),
      })),
      totaleFinale: economico.totaleAggiornato,
      totaleFinaleLabel: formatEuro(economico.totaleAggiornato),
    },
    cronologia,
    fotografie: raccogliFotografie(cantiere, eventi),
    materiali: (cantiere.materiali || []).map((materiale) => ({
      id: materiale.id,
      nome: materiale.nome,
      quantita: normalizzaNumero(materiale.quantita, 1),
      unita: materiale.unita || "cad",
      acquistato: Boolean(materiale.acquistato),
    })),
    pagamenti: {
      acconto: incassato,
      accontoLabel: formatEuro(incassato),
      saldo: Math.max(economico.totaleAggiornato - incassato, 0),
      saldoLabel: formatEuro(
        Math.max(economico.totaleAggiornato - incassato, 0)
      ),
      totale: economico.totaleAggiornato,
      totaleLabel: formatEuro(economico.totaleAggiornato),
    },
    note,
    firme: {
      tecnicoLabel: "Firma Tecnico",
      clienteLabel: "Firma Cliente",
    },
    settings: risolviPdfSettings({
      ...(datiAzienda.pdfSettings || {}),
      logo: datiAzienda.logo || null,
    }),
  };
}

export function nomeFileReportCantiere(document = {}) {
  const numero = String(document.copertina?.numeroCantiere || "cantiere")
    .trim()
    .replace(/\s+/g, "_");
  return `Report_${numero}.pdf`;
}
