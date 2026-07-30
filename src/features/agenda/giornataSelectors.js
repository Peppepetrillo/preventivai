import { formatEuro } from "../../utils/preventivi";
import {
  selezionaAttivitaGiorno,
  selezionaAttivitaUrgenti,
  selezionaTelefonateGiorno,
} from "../../domain/attivita/attivitaSelectors";
import { selezionaVociDaComprare } from "../../domain/listaSpesa/listaSpesaDomain";
import { calcolaOrePreviste } from "../lavori/lavoriDomain";
import {
  aggregaMaterialiGiorno,
  inizioGiornata,
  selezionaInterventiGiorno,
} from "./agendaSelectors";

/**
 * Unisce materiali da lavori del giorno + lista spesa dedicata.
 * @param {ReturnType<typeof aggregaMaterialiGiorno>} materialiGiorno
 * @param {object[]} listaSpesa
 */
function unisciMaterialiDaComprare(materialiGiorno, listaSpesa = []) {
  const mappa = new Map();

  for (const voce of materialiGiorno.mancanti || []) {
    const chiave = String(voce.nome).trim().toLowerCase();
    mappa.set(chiave, {
      nome: voce.nome,
      quantita: voce.quantita,
      unita: voce.unita || "cad",
      fonte: "lavoro",
    });
  }

  for (const voce of selezionaVociDaComprare(listaSpesa)) {
    const chiave = String(voce.nome).trim().toLowerCase();
    if (mappa.has(chiave)) {
      const esistente = mappa.get(chiave);
      esistente.quantita =
        (Number(esistente.quantita) || 0) + (Number(voce.quantita) || 0);
    } else {
      mappa.set(chiave, {
        id: voce.id,
        nome: voce.nome,
        quantita: voce.quantita,
        unita: voce.unita || "cad",
        fonte: "lista",
      });
    }
  }

  return [...mappa.values()].sort((a, b) => a.nome.localeCompare(b.nome, "it"));
}

/**
 * Riepilogo operativo della giornata per Home e assistente agenda.
 * @param {object[]} cantieri
 * @param {Date} [oggi]
 * @param {{ attivita?: object[], listaSpesa?: object[] }} [extra]
 */
export function preparaRiepilogoGiornata(
  cantieri = [],
  oggi = new Date(),
  extra = {}
) {
  const giorno = inizioGiornata(oggi);
  const lavori = selezionaInterventiGiorno(cantieri, giorno, giorno);
  const materiali = aggregaMaterialiGiorno(lavori);
  const orePreviste = calcolaOrePreviste(lavori);
  const attivita = selezionaAttivitaGiorno(extra.attivita || [], giorno);
  const telefonate = selezionaTelefonateGiorno(extra.attivita || [], giorno);
  const attivitaUrgenti = selezionaAttivitaUrgenti(extra.attivita || [], giorno);
  const materialiDaComprare = unisciMaterialiDaComprare(
    materiali,
    extra.listaSpesa || []
  );

  const pagamentiPrevisti = lavori
    .filter((lavoro) => lavoro.saldo > 0)
    .map((lavoro) => ({
      id: lavoro.id,
      cliente: lavoro.cliente || lavoro.titolo,
      importo: lavoro.saldo,
      importoLabel: formatEuro(lavoro.saldo),
      link: lavoro.link,
    }));

  const lavoriUrgenti = lavori.filter(
    (lavoro) =>
      lavoro.urgente ||
      lavoro.stato === "in-corso" ||
      (lavoro.checklist.length > 0 &&
        lavoro.stato !== "completato" &&
        lavoro.stato !== "rimandato")
  );

  const urgenze = [
    ...lavoriUrgenti.map((l) => ({
      id: `lav-${l.id}`,
      titolo: l.cliente || l.titolo,
      tipo: "lavoro",
    })),
    ...attivitaUrgenti.map((a) => ({
      id: `att-${a.id}`,
      titolo: a.titolo,
      tipo: "attivita",
    })),
  ];

  return {
    giorno,
    lavori,
    attivita,
    totaleLavori: lavori.length,
    totaleAttivita: attivita.length,
    orePreviste,
    materialiDaComprare,
    materialiDaPortare: materiali.daPortare,
    telefonate,
    pagamentiPrevisti,
    totalePagamentiPrevisti: pagamentiPrevisti.reduce(
      (acc, voce) => acc + voce.importo,
      0
    ),
    lavoriUrgenti,
    urgenze,
    haContenuto:
      lavori.length > 0 ||
      attivita.length > 0 ||
      materialiDaComprare.length > 0 ||
      materiali.daPortare.length > 0 ||
      pagamentiPrevisti.length > 0 ||
      telefonate.length > 0,
  };
}

/**
 * Versione compatta per la card Home (limite lavori visibili).
 * @param {object[]} cantieri
 * @param {Date} [oggi]
 * @param {number} [limite]
 * @param {{ attivita?: object[], listaSpesa?: object[] }} [extra]
 */
export function preparaAnteprimaGiornata(
  cantieri = [],
  oggi = new Date(),
  limite = 5,
  extra = {}
) {
  const riepilogo = preparaRiepilogoGiornata(cantieri, oggi, extra);
  return {
    ...riepilogo,
    lavori: riepilogo.lavori.slice(0, limite),
    attivita: riepilogo.attivita.slice(0, limite),
  };
}
