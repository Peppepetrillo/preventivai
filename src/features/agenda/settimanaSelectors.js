import {
  aggiungiGiorni,
  inizioGiornata,
  selezionaInterventiGiorno,
} from "./agendaSelectors";

/**
 * Inizio settimana (lunedì) per una data.
 * @param {Date} data
 */
export function inizioSettimana(data = new Date()) {
  const d = inizioGiornata(data);
  const giorno = d.getDay(); // 0=dom
  const offset = giorno === 0 ? -6 : 1 - giorno;
  return aggiungiGiorni(d, offset);
}

/**
 * Giorni della settimana a partire da lunedì.
 * @param {Date} [riferimento]
 */
export function giorniDellaSettimana(riferimento = new Date()) {
  const lunedi = inizioSettimana(riferimento);
  return Array.from({ length: 7 }, (_, i) => aggiungiGiorni(lunedi, i));
}

/**
 * @param {object[]} cantieri
 * @param {Date} [riferimento]
 * @param {Date} [oggi]
 */
export function selezionaInterventiSettimana(
  cantieri = [],
  riferimento = new Date(),
  oggi = new Date()
) {
  return giorniDellaSettimana(riferimento).map((giorno) => ({
    giorno,
    lavori: selezionaInterventiGiorno(cantieri, giorno, oggi),
  }));
}

/**
 * Vista agenda: oggi | domani | settimana
 * @typedef {"oggi"|"domani"|"settimana"} VistaAgenda
 */

/**
 * @param {VistaAgenda} vista
 * @param {Date} oggi
 */
export function risolviGiornoDaVista(vista, oggi = new Date()) {
  if (vista === "domani") return aggiungiGiorni(oggi, 1);
  return inizioGiornata(oggi);
}
