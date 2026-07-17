import { STORAGE_FALLBACKS, STORAGE_KEYS } from "../app/storageKeys";
import { creaRepositoryLocale } from "./localStorageRepository";

const cantieriRepository = creaRepositoryLocale(
  STORAGE_KEYS.cantieri,
  STORAGE_FALLBACKS[STORAGE_KEYS.cantieri]
);

export function leggiCantieri() {
  return cantieriRepository.leggi();
}

export function salvaCantieri(cantieri) {
  return cantieriRepository.salva(cantieri);
}
