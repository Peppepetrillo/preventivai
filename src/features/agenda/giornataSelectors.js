import { formatEuro } from "../../utils/preventivi";
import {
  selezionaAttivitaGiorno,
  selezionaAttivitaUrgenti,
  selezionaTelefonateGiorno,
} from "../../domain/attivita/attivitaSelectors";
import { selezionaDaComprareOggi } from "../../domain/listaSpesa/acquistiSelectors";
import { calcolaOrePreviste } from "../lavori/lavoriDomain";
import {
  aggregaMaterialiGiorno,
  inizioGiornata,
  selezionaInterventiGiorno,
} from "./agendaSelectors";

/**
 * Riepilogo operativo della giornata per Home e assistente agenda.
 * "Da comprare" usa la fonte unica Acquisti (listaSpesa + gap-fill).
 *
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
  const materialiDaComprare = selezionaDaComprareOggi(
    extra.listaSpesa || [],
    lavori
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
