import { STORAGE_KEYS } from "../../app/storageKeys";
import { creaRepositoryLocale } from "../../repositories/localStorageRepository";
import {
  aggiornaVoceListaSpesa,
  allineaAcquistatoDaMaterialeCantiere,
  creaVoceListaSpesa,
  rimuoviVoceListaPerMaterialeEliminato,
  rimuoviVociListaPerCantiere,
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
 * Imposta acquistato su più voci originali (toggle aggregato).
 * Non crea record aggregati persistenti.
 *
 * @param {string[]} ids
 * @param {boolean} acquistato
 */
export function impostaAcquistatoVociListaSpesa(ids = [], acquistato = true) {
  const set = new Set((ids || []).map((id) => String(id)));
  if (set.size === 0) return leggiListaSpesa();
  const prossimo = leggiListaSpesa().map((voce) =>
    set.has(String(voce.id))
      ? aggiornaVoceListaSpesa(voce, { acquistato: Boolean(acquistato) })
      : voce
  );
  salvaListaSpesa(prossimo);
  return prossimo;
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

/**
 * Allinea acquistato lista ← materiale cantiere (Step 8.0).
 * @param {object} cantiere
 * @param {object} materiale
 */
export function sincronizzaAcquistatoMaterialeSuLista(cantiere, materiale) {
  const prossimo = allineaAcquistatoDaMaterialeCantiere(
    leggiListaSpesa(),
    cantiere,
    materiale
  );
  salvaListaSpesa(prossimo);
  return prossimo;
}

/**
 * Policy delete materiale cantiere → lista (Step 8.0).
 * @param {object} cantiere
 * @param {object} materialeEliminato
 */
export function sincronizzaEliminazioneMaterialeSuLista(
  cantiere,
  materialeEliminato
) {
  const prossimo = rimuoviVoceListaPerMaterialeEliminato(
    leggiListaSpesa(),
    cantiere,
    materialeEliminato
  );
  salvaListaSpesa(prossimo);
  return prossimo;
}

export function leggiDaComprare() {
  return selezionaVociDaComprare(leggiListaSpesa());
}

/**
 * Elimina le voci lista spesa del cantiere (lavoroId / cantiereId).
 * @param {string|number} cantiereId
 */
export function rimuoviVociListaSpesaPerCantiere(cantiereId) {
  const prossimo = rimuoviVociListaPerCantiere(leggiListaSpesa(), cantiereId);
  salvaListaSpesa(prossimo);
  return prossimo;
}

export {
  creaVoceListaSpesa,
  aggiornaVoceListaSpesa,
  sincronizzaMaterialiDaCantiere,
  allineaAcquistatoDaMaterialeCantiere,
  rimuoviVoceListaPerMaterialeEliminato,
};
