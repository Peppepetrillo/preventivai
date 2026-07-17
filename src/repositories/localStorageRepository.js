import { leggiStorage, salvaStorage } from "../utils/storage";
import { salvaDatoCloud } from "../services/cloudSyncService";

export function leggiDatoLocale(chiave, fallback) {
  return leggiStorage(chiave, fallback);
}

export function salvaDatoLocale(chiave, valore) {
  const risultato = salvaStorage(chiave, valore);
  salvaDatoCloud(chiave, valore);
  return risultato;
}

export function creaRepositoryLocale(chiave, fallback) {
  return {
    leggi() {
      return leggiDatoLocale(chiave, fallback);
    },
    salva(valore) {
      return salvaDatoLocale(chiave, valore);
    },
  };
}
