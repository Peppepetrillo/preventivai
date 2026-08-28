/**
 * Utility pure per la lista Preventivi (filtro / presentation).
 * Nessuna dipendenza da React o storage.
 */

import {
  STATI_PREVENTIVO,
  normalizzaStatoPreventivo,
} from "../../domain/workflow";

export const FILTRI_PREVENTIVO = Object.freeze({
  TUTTI: "tutti",
  BOZZE: "bozze",
  INVIATI: "inviati",
  ACCETTATI: "accettati",
  IN_CANTIERE: "in-cantiere",
  DA_INVIARE: "da-inviare",
});

/** @deprecated Usa filtraPreventiviRicerca */
export function filtraPreventiviPerCliente(preventivi, ricerca) {
  return filtraPreventiviRicerca(preventivi, ricerca);
}

/**
 * Filtra per cliente, numero preventivo o importo. Stringa vuota → elenco invariato.
 * @param {object[]} preventivi
 * @param {string} ricerca
 * @returns {object[]}
 */
export function filtraPreventiviRicerca(preventivi, ricerca) {
  const elenco = Array.isArray(preventivi) ? preventivi : [];
  const query = String(ricerca || "")
    .trim()
    .toLowerCase();

  if (!query) return elenco;

  return elenco.filter((preventivo) => {
    const cliente = String(preventivo?.cliente || "").toLowerCase();
    const numero = String(
      preventivo?.numero || `PREV-${preventivo?.id ?? ""}`
    ).toLowerCase();
    const totale = String(preventivo?.totale ?? "").toLowerCase();

    return (
      cliente.includes(query) ||
      numero.includes(query) ||
      totale.includes(query)
    );
  });
}

/**
 * Filtra per chip stato UI.
 * @param {object[]} preventivi
 * @param {string} filtro
 * @returns {object[]}
 */
export function filtraPreventiviPerStato(preventivi, filtro) {
  const elenco = Array.isArray(preventivi) ? preventivi : [];
  const chiave = String(filtro || FILTRI_PREVENTIVO.TUTTI).toLowerCase();

  if (!chiave || chiave === FILTRI_PREVENTIVO.TUTTI) {
    return elenco;
  }

  return elenco.filter((preventivo) => {
    const stato = normalizzaStatoPreventivo(preventivo?.stato);

    switch (chiave) {
      case FILTRI_PREVENTIVO.BOZZE:
        return stato === STATI_PREVENTIVO.BOZZA;
      case FILTRI_PREVENTIVO.INVIATI:
        return stato === STATI_PREVENTIVO.INVIATO;
      case FILTRI_PREVENTIVO.ACCETTATI:
        return stato === STATI_PREVENTIVO.ACCETTATO;
      case FILTRI_PREVENTIVO.IN_CANTIERE:
        return (
          stato === STATI_PREVENTIVO.CONVERTITO ||
          stato === STATI_PREVENTIVO.LAVORO_COMPLETATO
        );
      // Alias legacy Home: "da-inviare" = solo bozze (coerente con conteggio UX-8.4)
      case FILTRI_PREVENTIVO.DA_INVIARE:
        return stato === STATI_PREVENTIVO.BOZZA;
      default:
        return true;
    }
  });
}

/**
 * Classe Tailwind del badge stato preventivo.
 * @param {string=} stato
 * @returns {string}
 */
export function classeColoreStatoPreventivo(stato) {
  const s = normalizzaStatoPreventivo(stato);

  switch (s) {
    case STATI_PREVENTIVO.BOZZA:
      return "bg-yellow-500";
    case STATI_PREVENTIVO.INVIATO:
      return "bg-blue-500";
    case STATI_PREVENTIVO.ACCETTATO:
      return "bg-green-500";
    case STATI_PREVENTIVO.CONVERTITO:
      return "bg-emerald-600";
    case STATI_PREVENTIVO.LAVORO_COMPLETATO:
      return "bg-slate-700";
    case STATI_PREVENTIVO.RIFIUTATO:
    case STATI_PREVENTIVO.ANNULLATO:
      return "bg-red-500";
    default:
      return "bg-slate-500";
  }
}
