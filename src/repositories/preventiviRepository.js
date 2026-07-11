import { APP_EVENTS, notificaEventoApp } from "../app/events";
import { STORAGE_FALLBACKS, STORAGE_KEYS } from "../app/storageKeys";
import { leggiDatoLocale, salvaDatoLocale } from "./localStorageRepository";

export function leggiPreventivi() {
  return leggiDatoLocale(
    STORAGE_KEYS.preventivi,
    STORAGE_FALLBACKS[STORAGE_KEYS.preventivi]
  );
}

export function salvaPreventivi(preventivi) {
  const risultato = salvaDatoLocale(STORAGE_KEYS.preventivi, preventivi);
  notificaEventoApp(APP_EVENTS.preventiviAggiornati);
  return risultato;
}

export function trovaPreventivo(id) {
  return leggiPreventivi().find((preventivo) => String(preventivo.id) === String(id));
}

export function salvaNuovoPreventivo(preventivo) {
  salvaPreventivi([...leggiPreventivi(), preventivo]);
}

export function aggiornaPreventivo(id, aggiorna) {
  const preventivi = leggiPreventivi();
  const preventiviAggiornati = preventivi.map((preventivo) =>
    String(preventivo.id) === String(id) ? aggiorna(preventivo) : preventivo
  );

  salvaPreventivi(preventiviAggiornati);
  return preventiviAggiornati;
}

export function eliminaPreventivo(id) {
  salvaPreventivi(
    leggiPreventivi().filter((preventivo) => String(preventivo.id) !== String(id))
  );
}
