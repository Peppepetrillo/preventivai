/**
 * Utility pure per l'assistente contestuale al preventivo.
 * Nessuna UI, nessuna persistenza.
 */

import {
  normalizzaRiferimentoCatalogo,
  risolviPrezzoDaCatalogo,
  nomeDaCatalogo,
} from "../../../domain/catalogo";

export const MAX_SUGGERIMENTI_PREVENTIVO = 3;

/**
 * @param {object} card
 * @param {Set<string>} chiaviCarrello — catalogoId o nome lowercase
 * @returns {boolean}
 */
function giaPresenteNelCarrello(card, chiaviCarrello) {
  if (!card || card.tipo === "durata") return false;

  const rif = normalizzaRiferimentoCatalogo(
    card.catalogoId || card.titolo || ""
  );
  if (rif?.id && chiaviCarrello.has(rif.id)) return true;

  const titolo = String(card.titolo || "")
    .trim()
    .toLowerCase();
  if (!titolo) return false;

  return chiaviCarrello.has(titolo);
}

/**
 * Seleziona fino a 3 card ad alta priorità non già presenti nel carrello.
 * @param {{ cards?: object[] }|null|undefined} payload
 * @param {object[]=} lavorazioni
 * @returns {object[]}
 */
export function selezionaCardPreventivo(payload, lavorazioni = []) {
  const chiaviCarrello = new Set();
  (Array.isArray(lavorazioni) ? lavorazioni : []).forEach((item) => {
    if (item?.catalogoId) chiaviCarrello.add(String(item.catalogoId));
    const nome = String(item?.nome || "")
      .trim()
      .toLowerCase();
    if (nome) chiaviCarrello.add(nome);
  });

  const cards = Array.isArray(payload?.cards) ? payload.cards : [];

  return cards
    .filter((card) => card && card.priorita === "alta")
    .filter((card) => !giaPresenteNelCarrello(card, chiaviCarrello))
    .slice(0, MAX_SUGGERIMENTI_PREVENTIVO);
}

/**
 * Arricchisce la descrizione con il contesto dell'ultima lavorazione aggiunta.
 * @param {object} card
 * @param {object[]=} lavorazioni
 * @returns {object}
 */
export function adattaCardAlContestoPreventivo(card, lavorazioni = []) {
  if (!card || card.tipo === "durata") return card;

  const ultima = Array.isArray(lavorazioni)
    ? lavorazioni[lavorazioni.length - 1]
    : null;
  const nomeUltima = String(ultima?.nome || "").trim();

  if (!nomeUltima) return card;

  return {
    ...card,
    descrizione: `Hai aggiunto "${nomeUltima}". ${card.descrizione || ""}`.trim(),
  };
}

/**
 * Trova voce listino da titolo/catalogoId tramite Catalogo (chiaveListino).
 * @param {string} nome
 * @param {object[]} listino
 * @returns {object|null}
 */
export function risolviVoceListinoDaNome(nome, listino) {
  const rif = normalizzaRiferimentoCatalogo(nome);
  if (!rif) return null;
  const esito = risolviPrezzoDaCatalogo(rif.id, listino);
  return esito.voceListino || null;
}

/**
 * @param {string} catalogoId
 * @param {object[]} listino
 */
export function risolviVoceListinoDaCatalogoId(catalogoId, listino) {
  const esito = risolviPrezzoDaCatalogo(catalogoId, listino);
  return esito.voceListino || null;
}

export { nomeDaCatalogo };
