/**
 * Match deterministico materiale → catalogo materiali.
 * Nessun prezzo inventato. Max 3 candidate.
 */

import { cercaFamiglieMateriali } from "../../domain/catalogoMateriali/materialiCatalogDomain";
import { CATALOGO_MATERIALI_SEED } from "../../domain/catalogoMateriali/materialiCatalogoSeed";
import { FIELD_AI_LIMITI } from "./fieldAssistantContract";
import {
  normalizzaTestoField,
  tokenizzaField,
} from "./fieldAssistantTextUtils";

function scoreVariante(descrizioneNorm, famiglia, variante) {
  const blob = normalizzaTestoField(
    [
      famiglia.nome,
      famiglia.descrizione,
      variante.etichetta,
      variante.id,
      ...Object.entries(variante.attributi || {}).map(
        ([k, v]) => `${k} ${v}`
      ),
    ].join(" ")
  );
  let score = 0;
  const tokens = tokenizzaField(descrizioneNorm);
  for (const t of tokens) {
    if (t.length < 2) continue;
    if (blob.includes(t)) score += Math.max(t.length, 2);
  }
  // Sezione cavo 3x2.5
  const sez = descrizioneNorm.match(/(\d+x\d+(?:[.,]\d+)?)/);
  if (sez && blob.includes(normalizzaTestoField(sez[1]))) score += 20;
  // Diametro Ø25 / 25
  const diam = descrizioneNorm.match(/(?:ø|o)?(\d{2})\b/);
  if (diam) {
    const d = diam[1];
    if (
      blob.includes(`ø${d}`) ||
      blob.includes(`o${d}`) ||
      blob.includes(` ${d}`) ||
      String(variante.attributi?.diametro || "").includes(d) ||
      String(variante.etichetta).includes(d)
    ) {
      score += 18;
    }
  }
  // Curva magnetotermico C16
  const curva = descrizioneNorm.match(/\b([bc]\d{1,2})\b/);
  if (curva && blob.includes(curva[1])) score += 18;
  // Scatola 503
  if (/\b503\b/.test(descrizioneNorm) && blob.includes("503")) score += 20;
  if (/\b504\b/.test(descrizioneNorm) && blob.includes("504")) score += 20;
  // FG16
  if (/fg\s?16/.test(descrizioneNorm) && /fg\s?16/.test(blob)) score += 12;
  // Differenziale amperaggio
  const amp = descrizioneNorm.match(/(\d+)\s*a\b/);
  if (amp && (blob.includes(`${amp[1]}a`) || blob.includes(`${amp[1]} a`))) {
    score += 16;
  }
  return score;
}

/**
 * @param {{ descrizione: string, quantita?: number, unita?: string, specifiche?: string[] }} elemento
 * @param {Array=} catalogo
 */
export function matchMaterialeConCatalogo(
  elemento,
  catalogo = CATALOGO_MATERIALI_SEED
) {
  const descrizione = String(elemento?.descrizione || "").trim();
  const descrizioneNorm = normalizzaTestoField(
    [descrizione, ...(elemento?.specifiche || [])].join(" ")
  );
  const elenco = Array.isArray(catalogo) ? catalogo : CATALOGO_MATERIALI_SEED;

  if (!descrizioneNorm) {
    return {
      stato: "non_trovato",
      messaggio: "Materiale non trovato nel catalogo",
      candidati: [],
      elemento,
    };
  }

  // Ricerca famiglia grezza poi score varianti
  const queryTokens = tokenizzaField(descrizioneNorm).filter((t) => t.length > 2);
  let famiglie = elenco;
  if (queryTokens.length) {
    const hits = new Map();
    for (const t of queryTokens.slice(0, 6)) {
      for (const f of cercaFamiglieMateriali(elenco, t)) {
        hits.set(f.id, f);
      }
    }
    if (hits.size) famiglie = [...hits.values()];
  }

  /** @type {Array<{famiglia: object, variante: object, punteggio: number}>} */
  const ranked = [];
  for (const famiglia of famiglie) {
    for (const variante of famiglia.varianti || []) {
      if (variante.attiva === false) continue;
      const punteggio = scoreVariante(descrizioneNorm, famiglia, variante);
      if (punteggio >= 8) {
        ranked.push({ famiglia, variante, punteggio });
      }
    }
  }

  ranked.sort((a, b) => b.punteggio - a.punteggio);
  const top = ranked.slice(0, FIELD_AI_LIMITI.maxCandidateMatch);

  const candidati = top.map(({ famiglia, variante, punteggio }) => ({
    famigliaId: famiglia.id,
    varianteId: variante.id,
    nome: `${famiglia.nome} — ${variante.etichetta}`,
    unita: variante.unita || famiglia.unitaDefault || elemento.unita || "pz",
    // prezzo solo se già in catalogo (indicativo) — non inventato
    prezzoIndicativo:
      variante.prezzoIndicativo != null &&
      Number.isFinite(Number(variante.prezzoIndicativo))
        ? Number(variante.prezzoIndicativo)
        : null,
    prezzoDalCatalogo: variante.prezzoIndicativo != null,
    punteggio,
  }));

  if (candidati.length === 0) {
    return {
      stato: "non_trovato",
      messaggio: "Materiale non trovato nel catalogo",
      candidati: [],
      elemento,
    };
  }

  const chiaro =
    candidati.length === 1 ||
    (top[0] &&
      top[1] &&
      top[0].punteggio >= top[1].punteggio + 8 &&
      top[0].punteggio >= 14);

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
 * @param {object[]} elementi
 * @param {Array=} catalogo
 */
export function abbinaMaterialiAlCatalogo(elementi = [], catalogo) {
  return (Array.isArray(elementi) ? elementi : []).map((el) => ({
    ...el,
    match: matchMaterialeConCatalogo(el, catalogo),
    quantita: el.quantita ?? 1,
  }));
}
