import { STORAGE_FALLBACKS, STORAGE_KEYS } from "../app/storageKeys";
import { creaRepositoryLocale } from "./localStorageRepository";

const datiAziendaRepository = creaRepositoryLocale(
  STORAGE_KEYS.datiAzienda,
  STORAGE_FALLBACKS[STORAGE_KEYS.datiAzienda]
);

const pinAccessoRepository = creaRepositoryLocale(
  STORAGE_KEYS.pinAccesso,
  STORAGE_FALLBACKS[STORAGE_KEYS.pinAccesso]
);

export function leggiDatiAzienda() {
  return datiAziendaRepository.leggi();
}

export function salvaDatiAzienda(datiAzienda) {
  return datiAziendaRepository.salva(datiAzienda);
}

export function leggiPinAccesso() {
  return pinAccessoRepository.leggi();
}

export function salvaPinAccesso(pinAccesso) {
  return pinAccessoRepository.salva(pinAccesso);
}
