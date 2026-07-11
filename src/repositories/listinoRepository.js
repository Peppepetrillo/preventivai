import { STORAGE_FALLBACKS, STORAGE_KEYS } from "../app/storageKeys";
import { leggiDatoLocale, salvaDatoLocale } from "./localStorageRepository";

export function leggiListino() {
  return leggiDatoLocale(
    STORAGE_KEYS.listino,
    STORAGE_FALLBACKS[STORAGE_KEYS.listino]
  );
}

export function salvaListino(listino) {
  return salvaDatoLocale(STORAGE_KEYS.listino, listino);
}
