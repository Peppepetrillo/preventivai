/**
 * Utility pure per l'assistente contestuale al preventivo.
 * Nessuna UI, nessuna persistenza.
 */

export const MAX_SUGGERIMENTI_PREVENTIVO = 3;

/**
 * @param {object} card
 * @param {Set<string>} nomiCarrello lowercase
 * @returns {boolean}
 */
function giaPresenteNelCarrello(card, nomiCarrello) {
  if (!card || card.tipo === "durata") return false;

  const titolo = String(card.titolo || "")
    .trim()
    .toLowerCase();
  if (!titolo) return false;

  for (const nome of nomiCarrello) {
    if (!nome) continue;
    if (titolo === nome || titolo.includes(nome) || nome.includes(titolo)) {
      return true;
    }
  }

  return false;
}

/**
 * Seleziona fino a 3 card ad alta priorità non già presenti nel carrello.
 * @param {{ cards?: object[] }|null|undefined} payload
 * @param {object[]=} lavorazioni
 * @returns {object[]}
 */
export function selezionaCardPreventivo(payload, lavorazioni = []) {
  const nomiCarrello = new Set(
    (Array.isArray(lavorazioni) ? lavorazioni : [])
      .map((item) => String(item?.nome || "").trim().toLowerCase())
      .filter(Boolean)
  );

  const cards = Array.isArray(payload?.cards) ? payload.cards : [];

  return cards
    .filter((card) => card && card.priorita === "alta")
    .filter((card) => !giaPresenteNelCarrello(card, nomiCarrello))
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
 * Trova una voce listino corrispondente al titolo del suggerimento.
 * @param {string} nome
 * @param {object[]} listino
 * @returns {object|null}
 */
export function risolviVoceListinoDaNome(nome, listino) {
  const chiave = String(nome || "")
    .trim()
    .toLowerCase();
  if (!chiave || !Array.isArray(listino)) return null;

  const esatto = listino.find(
    (voce) => String(voce?.nome || "").trim().toLowerCase() === chiave
  );
  if (esatto) return esatto;

  const contenuto = listino.find((voce) => {
    const nomeVoce = String(voce?.nome || "")
      .trim()
      .toLowerCase();
    return nomeVoce && (chiave.includes(nomeVoce) || nomeVoce.includes(chiave));
  });

  return contenuto || null;
}
