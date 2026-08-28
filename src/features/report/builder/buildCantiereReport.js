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
import {
  etichettaTipoIntervento,
  isCantiereDiretto,
} from "../../cantieri/cantieriDomain";
import {
  calcolaRimanenzaCantiere,
  leggiPagamenti,
  leggiTotaleIncassato,
  leggiTotaleCantiereEconomico,
} from "../../cantieri/services/pagamentiCantiereService";

function valoreIncassato(cantiere = {}) {
  return leggiTotaleIncassato(cantiere);
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
  const diretto = isCantiereDiretto(cantiere);
  const economico = calcolaTotaleCantiere(cantiere);
  const totaleEconomico = leggiTotaleCantiereEconomico(cantiere);
  const incassato = valoreIncassato(cantiere);
  const rimanenza = calcolaRimanenzaCantiere(cantiere, totaleEconomico);
  const elencoPagamenti = leggiPagamenti(cantiere);
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

  const descrizioneIntervento = String(
    cantiere.descrizioneIntervento || cantiere.descrizione || ""
  ).trim();
  const tipoIntervento = etichettaTipoIntervento(cantiere.tipoIntervento);

  return {
    lavoroDiretto: diretto,
    copertina: {
      logo: datiAzienda.logo || null,
      nomeAzienda: datiAzienda.nomeDitta || "PreventivAI",
      cliente: cantiere.cliente || "",
      indirizzo: cantiere.indirizzo || "",
      numeroCantiere:
        cantiere.preventivoNumero ||
        cantiere.nome ||
        `Cantiere ${cantiere.id || ""}`,
      tipoIntervento: diretto ? tipoIntervento : "",
      titoloDocumento: diretto
        ? "Riepilogo intervento"
        : "Report Finale di Cantiere",
      dataApertura:
        cantiere.dataCreazione ||
        cantiere.creatoIl ||
        cantiere.dataAccettazione ||
        "",
      dataConclusione: risolviDataConclusione(cantiere, eventi),
    },
    riepilogo: {
      lavorazioni: diretto
        ? []
        : (cantiere.lavorazioniOrigine || []).map((voce) => ({
            nome: voce.nome,
            quantita: normalizzaNumero(voce.quantita, 1),
            unita: voce.unita || "cad",
          })),
      preventivoOrigine: diretto
        ? { numero: "", totale: 0, totaleLabel: formatEuro(0) }
        : {
            numero: cantiere.preventivoNumero || preventivo?.numero || "",
            totale: economico.preventivoOriginale,
            totaleLabel: formatEuro(economico.preventivoOriginale),
          },
      descrizioneIntervento: diretto ? descrizioneIntervento : "",
      tipoIntervento: diretto ? tipoIntervento : "",
      variantiApprovate: diretto
        ? []
        : variantiApprovate.map((variante) => ({
            id: variante.id,
            titolo: variante.titolo || variante.descrizione || "Variante",
            stato: STATI_VARIANTE_LABEL[variante.stato] || variante.stato,
            totale: normalizzaNumero(variante.totale ?? variante.importo),
            totaleLabel: formatEuro(variante.totale ?? variante.importo),
          })),
      totaleFinale: totaleEconomico,
      totaleFinaleLabel: formatEuro(totaleEconomico),
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
      saldo: rimanenza,
      saldoLabel: formatEuro(rimanenza),
      totale: totaleEconomico,
      totaleLabel: formatEuro(totaleEconomico),
      rimanenza,
      rimanenzaLabel: formatEuro(rimanenza),
      incassato,
      incassatoLabel: formatEuro(incassato),
      elenco: elencoPagamenti.map((p) => ({
        id: p.id,
        data: p.data,
        importo: p.importo,
        importoLabel: formatEuro(p.importo),
        tipo: p.tipo,
        metodo: p.metodo,
        note: p.note || "",
      })),
    },
    note: diretto && descrizioneIntervento
      ? [descrizioneIntervento, ...note]
      : note,
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
