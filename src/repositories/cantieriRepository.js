import { STORAGE_FALLBACKS, STORAGE_KEYS } from "../app/storageKeys";
import { leggiDatoLocale, salvaDatoLocale } from "./localStorageRepository";

export function leggiCantieri() {
  return leggiDatoLocale(
    STORAGE_KEYS.cantieri,
    STORAGE_FALLBACKS[STORAGE_KEYS.cantieri]
  );
}

export function salvaCantieri(cantieri) {
  return salvaDatoLocale(STORAGE_KEYS.cantieri, cantieri);
}
