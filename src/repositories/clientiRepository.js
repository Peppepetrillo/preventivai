import { STORAGE_FALLBACKS, STORAGE_KEYS } from "../app/storageKeys";
import { filtraRecordAttivi } from "../domain/cestino/cestinoTypes";
import { creaRepositoryLocale } from "./localStorageRepository";

const clientiRepository = creaRepositoryLocale(
  STORAGE_KEYS.clienti,
  STORAGE_FALLBACKS[STORAGE_KEYS.clienti]
);

/**
 * Tutti i clienti (inclusi cestinati). Usare per scritture e Cestino.
 * @returns {object[]}
 */
export function leggiClientiTutti() {
  const elenco = clientiRepository.leggi();
  return Array.isArray(elenco) ? elenco : [];
}

/**
 * Clienti attivi (senza deletedAt). Default per liste e selettori.
 * @param {{ includiCestinati?: boolean }=} opzioni
 * @returns {object[]}
 */
export function leggiClienti(opzioni = {}) {
  const tutti = leggiClientiTutti();
  if (opzioni.includiCestinati) return tutti;
  return filtraRecordAttivi(tutti);
}

export function salvaClienti(clienti) {
  return clientiRepository.salva(clienti);
}

/**
 * @param {string|number} id
 * @param {{ includiCestinati?: boolean }=} opzioni
 */
export function trovaCliente(id, opzioni = { includiCestinati: true }) {
  const elenco = opzioni.includiCestinati
    ? leggiClientiTutti()
    : leggiClienti();
  return elenco.find((cliente) => String(cliente.id) === String(id));
}
