/**
 * Match deterministico lavorazione → listino.
 * Ordine: id → codiceArticolo → nome esatto → normalizzato → sinonimi → fuzzy.
 * Max 3 candidate. L'AI non sceglie prezzi.
 */

import { FIELD_AI_LIMITI } from "./fieldAssistantContract";
import {
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
    ...new Set([...base, ...extra.flatMap((s) => tokenizzaField(s))]),
  ];
}

function toCandidato(voce, punteggio, metodo) {
  return {
    id: voce.id ?? null,
    listinoId: voce.id ?? null,
    codiceArticolo: voce.codiceArticolo || null,
    nome: voce.nome,
    categoria: voce.categoria || "Lavorazioni",
    prezzo: Number(voce.prezzo) || 0,
    unita: voce.unita || "cad",
    prezzoDalListino: true,
    punteggio,
    metodo,
    confidence: Math.min(0.99, Math.max(0.4, punteggio / 40)),
  };
}

function scoreFuzzy(descrizioneNorm, voce) {
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

  const moduliDesc = descrizioneNorm.match(/(\d+)\s*moduli/);
  const moduliVoce = nomeNorm.match(/(\d+)\s*moduli/);
  if (moduliDesc && moduliVoce && moduliDesc[1] === moduliVoce[1]) {
    punteggio += 15;
  }

  return punteggio;
}

/**
 * @param {{ descrizione?: string, descrizioneNormalizzata?: string, descrizioneOriginale?: string, quantita?: number, unita?: string, note?: string }} elemento
 * @param {Array<object>} listino
 */
export function matchLavorazioneConListino(elemento, listino = []) {
  const descrizioneOriginale = String(
    elemento?.descrizioneOriginale || elemento?.descrizione || ""
  ).trim();
  const descrizioneNormalizzata = String(
    elemento?.descrizioneNormalizzata ||
      elemento?.descrizione ||
      descrizioneOriginale
  ).trim();
  const descrizioneNorm = normalizzaTestoField(descrizioneNormalizzata);
  const elenco = Array.isArray(listino) ? listino : [];

  const baseEl = {
    ...elemento,
    descrizione: descrizioneNormalizzata || descrizioneOriginale,
    descrizioneOriginale: descrizioneOriginale || descrizioneNormalizzata,
    descrizioneNormalizzata: descrizioneNormalizzata || descrizioneOriginale,
  };

  if (!descrizioneNorm || elenco.length === 0) {
    return {
      stato: "non_trovato",
      id: null,
      candidati: [],
      confidence: 0,
      messaggio: `Non ho trovato «${descrizioneOriginale || "lavorazione"}» nel listino.`,
      candidato: null,
      elemento: baseEl,
    };
  }

  // 1) ID esatto (se l'elemento porta già un listinoId)
  const idRichiesto = String(
    elemento?.listinoId || elemento?.matchId || elemento?.id || ""
  ).trim();
  if (idRichiesto) {
    const hit = elenco.find((v) => String(v.id) === idRichiesto);
    if (hit) {
      const c = toCandidato(hit, 100, "id");
      return {
        stato: "match",
        id: c.listinoId,
        candidati: [c],
        confidence: 0.99,
        messaggio: "",
        candidato: c,
        elemento: baseEl,
      };
    }
  }

  // 2) Codice articolo esatto
  const codice = String(
    elemento?.codiceArticolo || elemento?.codice || ""
  )
    .trim()
    .toLowerCase();
  if (codice) {
    const hit = elenco.find(
      (v) =>
        String(v.codiceArticolo || "")
          .trim()
          .toLowerCase() === codice
    );
    if (hit) {
      const c = toCandidato(hit, 95, "codice");
      return {
        stato: "match",
        id: c.listinoId,
        candidati: [c],
        confidence: 0.97,
        messaggio: "",
        candidato: c,
        elemento: baseEl,
      };
    }
  }

  // 3) Nome esatto (case-insensitive raw)
  const nomeEsatto = elenco.filter(
    (v) =>
      String(v.nome || "").trim().toLowerCase() ===
      descrizioneNormalizzata.toLowerCase()
  );
  if (nomeEsatto.length === 1) {
    const c = toCandidato(nomeEsatto[0], 90, "nome_esatto");
    return {
      stato: "match",
      id: c.listinoId,
      candidati: [c],
      confidence: 0.96,
      messaggio: "",
      candidato: c,
      elemento: baseEl,
    };
  }

  // 4) Nome normalizzato esatto
  const nomeNormHits = elenco.filter(
    (v) => normalizzaTestoField(v.nome) === descrizioneNorm
  );
  if (nomeNormHits.length === 1) {
    const c = toCandidato(nomeNormHits[0], 85, "nome_normalizzato");
    return {
      stato: "match",
      id: c.listinoId,
      candidati: [c],
      confidence: 0.94,
      messaggio: "",
      candidato: c,
      elemento: baseEl,
    };
  }
  if (nomeNormHits.length > 1) {
    const candidati = nomeNormHits
      .slice(0, FIELD_AI_LIMITI.maxCandidateMatch)
      .map((v, i) => toCandidato(v, 80 - i, "nome_normalizzato"));
    return {
      stato: "ambigui",
      id: null,
      candidati,
      confidence: 0.55,
      messaggio: "Possibili corrispondenze — scegli tu.",
      candidato: null,
      elemento: baseEl,
    };
  }

  // 5–6) Sinonimi + fuzzy
  const ranked = elenco
    .map((voce) => ({
      voce,
      punteggio: scoreFuzzy(descrizioneNorm, voce),
    }))
    .filter((x) => x.punteggio >= 5)
    .sort((a, b) => b.punteggio - a.punteggio);

  const top = ranked.slice(0, FIELD_AI_LIMITI.maxCandidateMatch);
  const candidati = top.map(({ voce, punteggio }) =>
    toCandidato(voce, punteggio, "fuzzy")
  );

  if (candidati.length === 0) {
    return {
      stato: "non_trovato",
      id: null,
      candidati: [],
      confidence: 0,
      messaggio: `Non ho trovato «${descrizioneNormalizzata}» nel listino.`,
      candidato: null,
      elemento: baseEl,
    };
  }

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
      id: candidati[0].listinoId,
      candidati: candidati.slice(0, 1),
      confidence: candidati[0].confidence,
      messaggio: "",
      candidato: candidati[0],
      elemento: baseEl,
    };
  }

  return {
    stato: "ambigui",
    id: null,
    candidati,
    confidence: 0.5,
    messaggio: "Possibili corrispondenze — scegli tu.",
    candidato: null,
    elemento: baseEl,
  };
}

/**
 * @param {object[]} elementi
 * @param {object[]} listino
 */
export function abbinaLavorazioniAlListino(elementi = [], listino = []) {
  return (Array.isArray(elementi) ? elementi : []).map((el) => {
    const match = matchLavorazioneConListino(el, listino);
    return {
      ...el,
      descrizione:
        el.descrizioneNormalizzata || el.descrizione || el.descrizioneOriginale,
      descrizioneOriginale:
        el.descrizioneOriginale || el.descrizione || "",
      descrizioneNormalizzata:
        el.descrizioneNormalizzata || el.descrizione || "",
      match,
      quantita: el.quantita ?? 1,
    };
  });
}

export function _punteggioVoceTest(descrizione, voce) {
  return scoreFuzzy(normalizzaTestoField(descrizione), voce);
}
