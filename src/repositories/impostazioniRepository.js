import { STORAGE_FALLBACKS, STORAGE_KEYS } from "../app/storageKeys";
import { leggiDatoLocale, salvaDatoLocale } from "./localStorageRepository";

export function leggiDatiAzienda() {
  return leggiDatoLocale(
    STORAGE_KEYS.datiAzienda,
    STORAGE_FALLBACKS[STORAGE_KEYS.datiAzienda]
  );
}

export function salvaDatiAzienda(datiAzienda) {
  return salvaDatoLocale(STORAGE_KEYS.datiAzienda, datiAzienda);
}

export function leggiPinAccesso() {
  return leggiDatoLocale(
    STORAGE_KEYS.pinAccesso,
    STORAGE_FALLBACKS[STORAGE_KEYS.pinAccesso]
  );
}

export function salvaPinAccesso(pinAccesso) {
  return salvaDatoLocale(STORAGE_KEYS.pinAccesso, pinAccesso);
}
