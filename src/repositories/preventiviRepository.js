import { APP_EVENTS, notificaEventoApp } from "../app/events";
import { STORAGE_FALLBACKS, STORAGE_KEYS } from "../app/storageKeys";
import { filtraRecordAttivi } from "../domain/cestino/cestinoTypes";
import { leggiDatoLocale, salvaDatoLocale } from "./localStorageRepository";

/**
 * Tutti i preventivi (inclusi cestinati). Usare per scritture e Cestino.
 * @returns {object[]}
 */
export function leggiPreventiviTutti() {
  const elenco = leggiDatoLocale(
    STORAGE_KEYS.preventivi,
    STORAGE_FALLBACKS[STORAGE_KEYS.preventivi]
  );
  return Array.isArray(elenco) ? elenco : [];
}

/**
 * Preventivi attivi (senza deletedAt). Default per archivio e selettori.
 * @param {{ includiCestinati?: boolean }=} opzioni
 * @returns {object[]}
 */
export function leggiPreventivi(opzioni = {}) {
  const tutti = leggiPreventiviTutti();
  if (opzioni.includiCestinati) return tutti;
  return filtraRecordAttivi(tutti);
}

export function salvaPreventivi(preventivi) {
  const risultato = salvaDatoLocale(STORAGE_KEYS.preventivi, preventivi);
  notificaEventoApp(APP_EVENTS.preventiviAggiornati);
  return risultato;
}

/**
 * @param {string|number} id
 * @param {{ includiCestinati?: boolean }=} opzioni
 */
export function trovaPreventivo(id, opzioni = { includiCestinati: true }) {
  const elenco = opzioni.includiCestinati
    ? leggiPreventiviTutti()
    : leggiPreventivi();
  return elenco.find((preventivo) => String(preventivo.id) === String(id));
}

export function salvaNuovoPreventivo(preventivo) {
  salvaPreventivi([...leggiPreventiviTutti(), preventivo]);
}

export function aggiornaPreventivo(id, aggiorna) {
  const preventivi = leggiPreventiviTutti();
  const preventiviAggiornati = preventivi.map((preventivo) =>
    String(preventivo.id) === String(id) ? aggiorna(preventivo) : preventivo
  );

  salvaPreventivi(preventiviAggiornati);
  return preventiviAggiornati;
}

export function eliminaPreventivo(id) {
  salvaPreventivi(
    leggiPreventiviTutti().filter(
      (preventivo) => String(preventivo.id) !== String(id)
    )
  );
}
