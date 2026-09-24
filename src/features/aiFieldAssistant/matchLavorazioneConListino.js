/**
 * Match deterministico lavorazione → listino.
 * L'AI non sceglie prezzi. Max 3 candidate se ambigue.
 */

import { FIELD_AI_LIMITI } from "./fieldAssistantContract";
import {
  escapeRegexField,
  normalizzaTestoField,
  radiceTokenField,
  tokenizzaField,
} from "./fieldAssistantTextUtils";

const SINONIMI = Object.freeze({
  presa: ["prese", "schuko", "punto presa", "punti presa"],
  prese: ["presa", "schuko", "punto presa", "punti presa"],
  luce: ["luci", "punto luce", "punti luce", "lampade", "faretti"],
  luci: ["luce", "punto luce", "punti luce"],
  punto: ["punti"],
  punti: ["punto"],
  quadro: ["centralino", "quadro elettrico"],
  canalina: ["canaline", "passa cavi"],
  corrugato: ["tubo corrugato", "tubo"],
  cavo: ["cavi", "cavo elettrico"],
  citofono: ["videocitofono", "citofoni"],
  videocitofono: ["citofono", "videocitofoni"],
  linea: ["linee", "linea dedicata", "linee dedicate"],
  predisposizione: ["predisposizioni", "pred"],
  climatizzatore: ["climatizzatori", "clima", "condizionatore"],
});

function espandi(token) {
  const base = [token, radiceTokenField(token)];
  const extra = SINONIMI[token] || SINONIMI[radiceTokenField(token)];
  if (!extra) return [...new Set(base)];
  return [
    ...new Set([
      ...base,
      ...extra.flatMap((s) => tokenizzaField(s)),
    ]),
  ];
}

function punteggioVoce(descrizioneNorm, voce) {
  const tokenVoce = tokenizzaField(`${voce.nome} ${voce.categoria || ""}`);
  let punteggio = 0;
  const tokensDesc = new Set(tokenizzaField(descrizioneNorm));

  for (const token of tokenVoce) {
    const candidati = espandi(token);
    if (
      candidati.some((c) => descrizioneNorm.includes(c) || tokensDesc.has(c))
    ) {
      punteggio += Math.max(token.length, 3);
    }
  }

  const nomeNorm = normalizzaTestoField(voce.nome);
  if (nomeNorm.length > 4 && descrizioneNorm.includes(nomeNorm)) {
    punteggio += 12;
  }
  if (descrizioneNorm.length > 4 && nomeNorm.includes(descrizioneNorm)) {
    punteggio += 8;
  }

  const partiNome = tokenizzaField(voce.nome);
  if (partiNome.length >= 2) {
    const ok = partiNome.every((p) =>
      espandi(p).some((c) => descrizioneNorm.includes(c))
    );
    if (ok) punteggio += 10;
  }

  // Bonus moduli quadro
  const moduliDesc = descrizioneNorm.match(/(\d+)\s*moduli/);
  const moduliVoce = nomeNorm.match(/(\d+)\s*moduli/);
  if (moduliDesc && moduliVoce && moduliDesc[1] === moduliVoce[1]) {
    punteggio += 15;
  }

  return punteggio;
}

/**
 * @param {{ descrizione: string, quantita?: number, unita?: string, note?: string }} elemento
 * @param {Array<object>} listino
 * @returns {{
 *   stato: "match"|"ambigui"|"non_trovato",
 *   messaggio: string,
 *   candidato?: object,
 *   candidati: object[],
 *   elemento: object,
 * }}
 */
export function matchLavorazioneConListino(elemento, listino = []) {
  const descrizione = String(elemento?.descrizione || "").trim();
  const descrizioneNorm = normalizzaTestoField(descrizione);
  const elenco = Array.isArray(listino) ? listino : [];

  if (!descrizioneNorm || elenco.length === 0) {
    return {
      stato: "non_trovato",
      messaggio: `Non ho trovato «${descrizione || "lavorazione"}» nel listino.`,
      candidati: [],
      elemento,
    };
  }

  const ranked = elenco
    .map((voce) => ({
      voce,
      punteggio: punteggioVoce(descrizioneNorm, voce),
    }))
    .filter((x) => x.punteggio >= 5)
    .sort((a, b) => b.punteggio - a.punteggio);

  const top = ranked.slice(0, FIELD_AI_LIMITI.maxCandidateMatch);
  const candidati = top.map(({ voce, punteggio }, index) => ({
    id: voce.id ?? `listino-${index}`,
    listinoId: voce.id ?? null,
    nome: voce.nome,
    categoria: voce.categoria || "Lavorazioni",
    prezzo: Number(voce.prezzo) || 0,
    unita: voce.unita || elemento.unita || "cad",
    prezzoDalListino: true,
    punteggio,
  }));

  if (candidati.length === 0) {
    return {
      stato: "non_trovato",
      messaggio: `Non ho trovato «${descrizione}» nel listino.`,
      candidati: [],
      elemento,
    };
  }

  // Match unico chiaro se primo nettamente sopra il secondo
  const primo = ranked[0];
  const secondo = ranked[1];
  const chiaro =
    candidati.length === 1 ||
    (primo &&
      secondo &&
      primo.punteggio >= secondo.punteggio + 6 &&
      primo.punteggio >= 10);

  if (chiaro) {
    return {
      stato: "match",
      messaggio: "",
      candidato: candidati[0],
      candidati: candidati.slice(0, 1),
      elemento,
    };
  }

  return {
    stato: "ambigui",
    messaggio: "Possibili corrispondenze — scegli tu.",
    candidati,
    elemento,
  };
}

/**
 * Applica match a una lista di elementi estratti.
 * @param {object[]} elementi
 * @param {object[]} listino
 */
export function abbinaLavorazioniAlListino(elementi = [], listino = []) {
  return (Array.isArray(elementi) ? elementi : []).map((el) => {
    const match = matchLavorazioneConListino(el, listino);
    return {
      ...el,
      match,
      quantita: el.quantita ?? 1,
    };
  });
}

/** @deprecated internal helper kept for tests */
export function _punteggioVoceTest(descrizione, voce) {
  return punteggioVoce(normalizzaTestoField(descrizione), voce);
}

void escapeRegexField;
