import { APP_EVENTS, notificaEventoApp } from "../app/events";
import { STORAGE_FALLBACKS, STORAGE_KEYS } from "../app/storageKeys";
import { filtraRecordAttivi } from "../domain/cestino/cestinoTypes";
import { creaRepositoryLocale } from "./localStorageRepository";

const cantieriRepository = creaRepositoryLocale(
  STORAGE_KEYS.cantieri,
  STORAGE_FALLBACKS[STORAGE_KEYS.cantieri]
);

/**
 * Tutti i cantieri (inclusi cestinati). Usare per scritture, sync interni e Cestino.
 * @returns {object[]}
 */
export function leggiCantieriTutti() {
  const elenco = cantieriRepository.leggi();
  return Array.isArray(elenco) ? elenco : [];
}

/**
 * Cantieri attivi (senza deletedAt). Default per liste / agenda / selettori.
 * @param {{ includiCestinati?: boolean }=} opzioni
 * @returns {object[]}
 */
export function leggiCantieri(opzioni = {}) {
  const tutti = leggiCantieriTutti();
  if (opzioni.includiCestinati) return tutti;
  return filtraRecordAttivi(tutti);
}

export function salvaCantieri(cantieri) {
  const risultato = cantieriRepository.salva(cantieri);
  notificaEventoApp(APP_EVENTS.cantieriAggiornati);
  return risultato;
}
