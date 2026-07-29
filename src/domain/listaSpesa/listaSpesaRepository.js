import { STORAGE_KEYS } from "../../app/storageKeys";
import { creaRepositoryLocale } from "../../repositories/localStorageRepository";
import {
  aggiornaVoceListaSpesa,
  creaVoceListaSpesa,
  selezionaVociDaComprare,
  sincronizzaMaterialiDaCantiere,
} from "./listaSpesaDomain";

const repo = creaRepositoryLocale(STORAGE_KEYS.listaSpesa, []);

export function leggiListaSpesa() {
  const elenco = repo.leggi();
  return Array.isArray(elenco) ? elenco : [];
}

export function salvaListaSpesa(elenco = []) {
  return repo.salva(Array.isArray(elenco) ? elenco : []);
}

/**
 * @param {Parameters<typeof creaVoceListaSpesa>[0]} input
 */
export function aggiungiVoceListaSpesa(input) {
  const voce = creaVoceListaSpesa(input);
  salvaListaSpesa([...leggiListaSpesa(), voce]);
  return voce;
}

/**
 * @param {string} id
 * @param {Partial<import("./listaSpesaDomain").VoceListaSpesa>} modifiche
 */
export function aggiornaVoceListaSpesaPerId(id, modifiche = {}) {
  const elenco = leggiListaSpesa();
  const idx = elenco.findIndex((item) => String(item.id) === String(id));
  if (idx < 0) return null;
  const aggiornata = aggiornaVoceListaSpesa(elenco[idx], modifiche);
  salvaListaSpesa(elenco.map((item, i) => (i === idx ? aggiornata : item)));
  return aggiornata;
}

/**
 * @param {string} id
 */
export function toggleAcquistatoListaSpesa(id) {
  const voce = leggiListaSpesa().find((item) => String(item.id) === String(id));
  if (!voce) return null;
  return aggiornaVoceListaSpesaPerId(id, { acquistato: !voce.acquistato });
}

/**
 * @param {string} id
 */
export function eliminaVoceListaSpesa(id) {
  const elenco = leggiListaSpesa();
  const prossimo = elenco.filter((item) => String(item.id) !== String(id));
  if (prossimo.length === elenco.length) return false;
  salvaListaSpesa(prossimo);
  return true;
}

/**
 * @param {object} cantiere
 */
export function sincronizzaListaSpesaDaCantiere(cantiere) {
  const prossimo = sincronizzaMaterialiDaCantiere(leggiListaSpesa(), cantiere);
  salvaListaSpesa(prossimo);
  return selezionaVociDaComprare(prossimo).filter(
    (voce) => String(voce.lavoroId) === String(cantiere.id)
  );
}

export function leggiDaComprare() {
  return selezionaVociDaComprare(leggiListaSpesa());
}

export { creaVoceListaSpesa, aggiornaVoceListaSpesa, sincronizzaMaterialiDaCantiere };
