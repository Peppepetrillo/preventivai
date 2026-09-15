import { STORAGE_FALLBACKS, STORAGE_KEYS } from "../../app/storageKeys";
import { creaRepositoryLocale } from "../../repositories/localStorageRepository";
import { normalizzaMovimentoEconomiaGenerale } from "./economiaMovimentiTypes";

const repo = creaRepositoryLocale(
  STORAGE_KEYS.economiaMovimenti,
  STORAGE_FALLBACKS[STORAGE_KEYS.economiaMovimenti]
);

/**
 * @returns {object[]}
 */
export function leggiMovimentiEconomiaGenerali() {
  const elenco = repo.leggi();
  if (!Array.isArray(elenco)) return [];
  return elenco
    .map((voce) => normalizzaMovimentoEconomiaGenerale(voce))
    .filter(Boolean);
}

/**
 * @param {object[]} movimenti
 */
export function salvaMovimentiEconomiaGenerali(movimenti = []) {
  const normalizzati = (Array.isArray(movimenti) ? movimenti : [])
    .map((voce) => normalizzaMovimentoEconomiaGenerale(voce))
    .filter(Boolean);
  return repo.salva(normalizzati);
}

/**
 * @param {object} input
 * @returns {object|null}
 */
export function aggiungiMovimentoEconomiaGenerale(input = {}) {
  const movimento = normalizzaMovimentoEconomiaGenerale(input);
  if (!movimento) return null;
  const elenco = leggiMovimentiEconomiaGenerali();
  salvaMovimentiEconomiaGenerali([movimento, ...elenco]);
  return movimento;
}
