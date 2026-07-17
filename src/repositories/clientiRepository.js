import { STORAGE_FALLBACKS, STORAGE_KEYS } from "../app/storageKeys";
import { creaRepositoryLocale } from "./localStorageRepository";

const clientiRepository = creaRepositoryLocale(
  STORAGE_KEYS.clienti,
  STORAGE_FALLBACKS[STORAGE_KEYS.clienti]
);

export function leggiClienti() {
  return clientiRepository.leggi();
}

export function salvaClienti(clienti) {
  return clientiRepository.salva(clienti);
}

export function trovaCliente(id) {
  return leggiClienti().find((cliente) => String(cliente.id) === String(id));
}
