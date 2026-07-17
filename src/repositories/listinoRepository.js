import { STORAGE_FALLBACKS, STORAGE_KEYS } from "../app/storageKeys";
import { creaRepositoryLocale } from "./localStorageRepository";

const listinoRepository = creaRepositoryLocale(
  STORAGE_KEYS.listino,
  STORAGE_FALLBACKS[STORAGE_KEYS.listino]
);

export function leggiListino() {
  return listinoRepository.leggi();
}

export function salvaListino(listino) {
  return listinoRepository.salva(listino);
}
