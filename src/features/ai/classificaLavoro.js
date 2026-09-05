/**
 * Classificazione deterministica del lavoro (nessun ML).
 * Se i segnali non bastano → categoria null, confidence 0.
 */

import { CATEGORIE_LAVORO_AI } from "./aiTypes";
import { normalizzaTestoAi, testoLavoroAi, tokenizzaAi } from "./aiTextUtils";

/** Keyword → categoria (ordine = priorità se pari). */
const REGOLE_CATEGORIA = Object.freeze([
  {
    id: CATEGORIE_LAVORO_AI.fotovoltaico,
    keywords: [
      "fotovoltaico",
      "fotovolt",
      "pannello",
      "pannelli",
      "inverter",
      "fv",
      "solare",
    ],
  },
  {
    id: CATEGORIE_LAVORO_AI.quadro_elettrico,
    keywords: [
      "quadro",
      "centralino",
      "magnetotermico",
      "differenziale",
      "interruttore",
    ],
  },
  {
    id: CATEGORIE_LAVORO_AI.illuminazione,
    keywords: [
      "illuminazione",
      "illuminare",
      "faretti",
      "faretto",
      "led",
      "lampada",
      "lampade",
      "plafoniera",
    ],
  },
  {
    id: CATEGORIE_LAVORO_AI.automazione,
    keywords: [
      "automazione",
      "domotica",
      "tapparelle",
      "cancello",
      "videocitofono",
      "allarme",
      "antintrusione",
    ],
  },
  {
    id: CATEGORIE_LAVORO_AI.manutenzione,
    keywords: [
      "manutenzione",
      "riparazione",
      "guasto",
      "sostituzione",
      "intervento",
      "urgenza",
    ],
  },
  {
    id: CATEGORIE_LAVORO_AI.ristrutturazione,
    keywords: [
      "ristrutturazione",
      "ristrutturare",
      "rifacimento",
      "cantiere",
      "appartamento",
      "bagno",
      "cucina",
    ],
  },
  {
    id: CATEGORIE_LAVORO_AI.impianto_elettrico,
    keywords: [
      "impianto",
      "elettrico",
      "civile",
      "punto luce",
      "prese",
      "canalina",
      "cavidotto",
    ],
  },
]);

/**
 * @param {object} nuovoLavoro
 * @returns {{ categoria: string|null, confidence: number, segnali: string[] }}
 */
export function classificaLavoro(nuovoLavoro = {}) {
  const testo = testoLavoroAi(nuovoLavoro);
  const tokens = new Set(tokenizzaAi(testo));

  if (tokens.size === 0 && !testo) {
    return { categoria: null, confidence: 0, segnali: [] };
  }

  /** @type {{ id: string, hits: string[], score: number }[]} */
  const candidati = [];

  for (const regola of REGOLE_CATEGORIA) {
    const hits = regola.keywords.filter((kw) => {
      const n = normalizzaTestoAi(kw);
      return testo.includes(n) || tokens.has(n);
    });
    if (hits.length === 0) continue;
    candidati.push({
      id: regola.id,
      hits,
      score: hits.reduce((s, h) => s + h.length, 0),
    });
  }

  if (candidati.length === 0) {
    // Tipologia impianto / tipo lavoro espliciti senza keyword match
    const tip = normalizzaTestoAi(nuovoLavoro.tipologiaImpianto || "");
    if (tip.includes("fotovolt")) {
      return {
        categoria: CATEGORIE_LAVORO_AI.fotovoltaico,
        confidence: 0.4,
        segnali: ["tipologiaImpianto"],
      };
    }
    return { categoria: null, confidence: 0, segnali: [] };
  }

  candidati.sort((a, b) => b.score - a.score);
  const best = candidati[0];
  const confidence = Math.min(0.95, 0.35 + best.hits.length * 0.15);

  return {
    categoria: best.id,
    confidence: Number(confidence.toFixed(2)),
    segnali: best.hits.slice(0, 6),
  };
}
