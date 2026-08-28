import { STORAGE_KEYS } from "../../app/storageKeys";
import { creaRepositoryLocale } from "../../repositories/localStorageRepository";
import {
  aggiornaAttivita,
  completaAttivita,
  creaAttivita,
} from "./attivitaDomain";

const repo = creaRepositoryLocale(STORAGE_KEYS.attivita, []);

export function leggiAttivita() {
  const elenco = repo.leggi();
  return Array.isArray(elenco) ? elenco : [];
}

export function salvaAttivita(elenco = []) {
  return repo.salva(Array.isArray(elenco) ? elenco : []);
}

/**
 * @param {Parameters<typeof creaAttivita>[0]} input
 */
export function aggiungiAttivita(input) {
  const attivita = creaAttivita(input);
  salvaAttivita([...leggiAttivita(), attivita]);
  return attivita;
}

/**
 * @param {string} id
 * @param {Partial<import("./attivitaTypes").Attivita>} modifiche
 */
export function aggiornaAttivitaPerId(id, modifiche = {}) {
  const elenco = leggiAttivita();
  const idx = elenco.findIndex((item) => String(item.id) === String(id));
  if (idx < 0) return null;
  const aggiornata = aggiornaAttivita(elenco[idx], modifiche);
  salvaAttivita(elenco.map((item, i) => (i === idx ? aggiornata : item)));
  return aggiornata;
}

/**
 * @param {string} id
 */
export function completaAttivitaPerId(id) {
  const elenco = leggiAttivita();
  const idx = elenco.findIndex((item) => String(item.id) === String(id));
  if (idx < 0) return null;
  const aggiornata = completaAttivita(elenco[idx]);
  salvaAttivita(elenco.map((item, i) => (i === idx ? aggiornata : item)));
  return aggiornata;
}

/**
 * @param {string} id
 */
export function eliminaAttivitaPerId(id) {
  const elenco = leggiAttivita();
  const prossimo = elenco.filter((item) => String(item.id) !== String(id));
  if (prossimo.length === elenco.length) return false;
  salvaAttivita(prossimo);
  return true;
}

/**
 * @param {string} id
 */
export function trovaAttivitaPerId(id) {
  return leggiAttivita().find((item) => String(item.id) === String(id)) || null;
}

/**
 * Scollega le attività dal cantiere senza cancellarle.
 * @param {string|number} cantiereId
 */
export function scollegaAttivitaDalCantiere(cantiereId) {
  const id = String(cantiereId ?? "");
  if (!id) return leggiAttivita();

  const elenco = leggiAttivita();
  const prossimo = elenco.map((attivita) =>
    String(attivita?.lavoroId || "") === id
      ? aggiornaAttivita(attivita, { lavoroId: "" })
      : attivita
  );
  salvaAttivita(prossimo);
  return prossimo;
}

export { creaAttivita, aggiornaAttivita, completaAttivita };
