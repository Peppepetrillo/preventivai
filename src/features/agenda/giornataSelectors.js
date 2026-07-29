import { formatEuro } from "../../utils/preventivi";
import { calcolaOrePreviste } from "../lavori/lavoriDomain";
import {
  aggregaMaterialiGiorno,
  inizioGiornata,
  selezionaInterventiGiorno,
} from "./agendaSelectors";

/**
 * Riepilogo operativo della giornata per Home e assistente agenda.
 * @param {object[]} cantieri
 * @param {Date} [oggi]
 */
export function preparaRiepilogoGiornata(cantieri = [], oggi = new Date()) {
  const giorno = inizioGiornata(oggi);
  const lavori = selezionaInterventiGiorno(cantieri, giorno, giorno);
  const materiali = aggregaMaterialiGiorno(lavori);
  const orePreviste = calcolaOrePreviste(lavori);

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
      (lavoro.checklist.length > 0 && lavoro.stato !== "completato")
  );

  return {
    giorno,
    lavori,
    totaleLavori: lavori.length,
    orePreviste,
    materialiDaComprare: materiali.mancanti,
    materialiDaPortare: materiali.daPortare,
    pagamentiPrevisti,
    totalePagamentiPrevisti: pagamentiPrevisti.reduce(
      (acc, voce) => acc + voce.importo,
      0
    ),
    lavoriUrgenti,
    haContenuto:
      lavori.length > 0 ||
      materiali.mancanti.length > 0 ||
      materiali.daPortare.length > 0 ||
      pagamentiPrevisti.length > 0,
  };
}

/**
 * Versione compatta per la card Home (limite lavori visibili).
 * @param {object[]} cantieri
 * @param {Date} [oggi]
 * @param {number} [limite]
 */
export function preparaAnteprimaGiornata(cantieri = [], oggi = new Date(), limite = 5) {
  const riepilogo = preparaRiepilogoGiornata(cantieri, oggi);
  return {
    ...riepilogo,
    lavori: riepilogo.lavori.slice(0, limite),
  };
}
