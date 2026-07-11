import { STORAGE_FALLBACKS, STORAGE_KEYS } from "../app/storageKeys";
import { leggiDatoLocale, salvaDatoLocale } from "./localStorageRepository";

export function leggiClienti() {
  return leggiDatoLocale(
    STORAGE_KEYS.clienti,
    STORAGE_FALLBACKS[STORAGE_KEYS.clienti]
  );
}

export function salvaClienti(clienti) {
  return salvaDatoLocale(STORAGE_KEYS.clienti, clienti);
}

export function trovaCliente(id) {
  return leggiClienti().find((cliente) => String(cliente.id) === String(id));
}
