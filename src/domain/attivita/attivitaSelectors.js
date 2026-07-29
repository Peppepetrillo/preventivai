import {
  inizioGiornata,
  parseDataAgenda,
} from "../../features/agenda/agendaSelectors";
import {
  etichettaCategoriaAttivita,
  minutiOraAttivita,
  ordinaAttivitaPerOra,
} from "./attivitaDomain";
import { STATI_ATTIVITA } from "./attivitaTypes";

/**
 * Determina se un'attività appartiene al giorno selezionato.
 * @param {import("./attivitaTypes").Attivita} attivita
 * @param {Date} giorno
 */
export function attivitaAppartieneAlGiorno(attivita, giorno) {
  const data = parseDataAgenda(attivita?.data);
  if (!data) return false;
  return data.getTime() === inizioGiornata(giorno).getTime();
}

/**
 * @param {import("./attivitaTypes").Attivita[]} elenco
 * @param {Date} giorno
 */
export function selezionaAttivitaGiorno(elenco = [], giorno) {
  return ordinaAttivitaPerOra(
    elenco.filter((item) => item && attivitaAppartieneAlGiorno(item, giorno))
  ).map((attivita) => ({
    ...attivita,
    categoriaLabel: etichettaCategoriaAttivita(attivita.categoria),
    minuti: minutiOraAttivita(attivita.ora),
  }));
}

/**
 * @param {import("./attivitaTypes").Attivita[]} elenco
 * @param {Date} inizioSettimana
 */
export function selezionaAttivitaSettimana(elenco = [], inizioSettimana) {
  const inizio = inizioGiornata(inizioSettimana);
  const fine = new Date(inizio);
  fine.setDate(fine.getDate() + 6);

  return ordinaAttivitaPerOra(
    elenco.filter((item) => {
      const data = parseDataAgenda(item?.data);
      if (!data) return false;
      const t = data.getTime();
      return t >= inizio.getTime() && t <= fine.getTime();
    })
  );
}

/**
 * Telefonate aperte del giorno.
 * @param {import("./attivitaTypes").Attivita[]} elenco
 * @param {Date} giorno
 */
export function selezionaTelefonateGiorno(elenco = [], giorno) {
  return selezionaAttivitaGiorno(elenco, giorno).filter(
    (a) =>
      a.categoria === "telefonata" && a.stato !== STATI_ATTIVITA.COMPLETATA
  );
}

/**
 * Attività urgenti (priorità alta, non completate).
 * @param {import("./attivitaTypes").Attivita[]} elenco
 * @param {Date} giorno
 */
export function selezionaAttivitaUrgenti(elenco = [], giorno) {
  return selezionaAttivitaGiorno(elenco, giorno).filter(
    (a) => a.priorita === "alta" && a.stato !== STATI_ATTIVITA.COMPLETATA
  );
}
