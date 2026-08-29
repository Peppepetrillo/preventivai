import { normalizzaNumero } from "../../utils/preventivi";
import { normalizzaUnitaMateriale } from "../../domain/catalogoMateriali/materialiTypes";

export const ORIGINE_VOCE = Object.freeze({
  listino: "listino",
  catalogoMateriale: "catalogo-materiale",
  manuale: "manuale",
});

/**
 * @param {{
 *   nome: string,
 *   quantita?: number,
 *   unita?: string,
 *   prezzoUnitario: number,
 *   famigliaId?: string,
 *   varianteId?: string,
 *   prezzoCatalogoOriginale?: number,
 *   categoria?: string,
 * }} payload
 */
export function creaLavorazioneDaCatalogoMateriale(payload) {
  const prezzo = normalizzaNumero(payload.prezzoUnitario);
  const quantita = Math.max(normalizzaNumero(payload.quantita, 1), 0.001);
  const unita = normalizzaUnitaMateriale(payload.unita || "pz");
  const prezzoCatalogo =
    payload.prezzoCatalogoOriginale != null
      ? normalizzaNumero(payload.prezzoCatalogoOriginale)
      : prezzo;

  return {
    id: `mat-${payload.varianteId || Date.now()}-${Date.now()}`,
    nome: String(payload.nome || "Materiale").trim(),
    categoria: payload.categoria || "Materiali",
    prezzo,
    quantita,
    unita,
    origineVoce: ORIGINE_VOCE.catalogoMateriale,
    famigliaId: payload.famigliaId || undefined,
    varianteId: payload.varianteId || undefined,
    prezzoCatalogoOriginale: prezzoCatalogo,
    listinoId: null,
    catalogoId: null,
  };
}

/**
 * @param {{ nome: string, prezzo: number, quantita?: number, unita?: string }} payload
 */
export function creaLavorazioneManuale(payload) {
  return {
    id: payload.id || `custom-${Date.now()}`,
    nome: String(payload.nome || "").trim(),
    categoria: payload.categoria || "Lavorazioni",
    prezzo: normalizzaNumero(payload.prezzo),
    quantita: Math.max(normalizzaNumero(payload.quantita, 1), 0.001),
    unita: payload.unita || "cad",
    origineVoce: ORIGINE_VOCE.manuale,
    listinoId: null,
    catalogoId: null,
  };
}
