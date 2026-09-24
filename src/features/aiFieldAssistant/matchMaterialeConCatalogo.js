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
 * @param {{ descrizione?: string, descrizioneNormalizzata?: string, descrizioneOriginale?: string, quantita?: number, unita?: string, specifiche?: string[] }} elemento
 * @param {Array=} catalogo
 */
export function matchMaterialeConCatalogo(
  elemento,
  catalogo = CATALOGO_MATERIALI_SEED
) {
  const descrizioneOriginale = String(
    elemento?.descrizioneOriginale || elemento?.descrizione || ""
  ).trim();
  const descrizioneNormalizzata = String(
    elemento?.descrizioneNormalizzata ||
      elemento?.descrizione ||
      descrizioneOriginale
  ).trim();
  const descrizioneNorm = normalizzaTestoField(
    [descrizioneNormalizzata, ...(elemento?.specifiche || [])].join(" ")
  );
  const elenco = Array.isArray(catalogo) ? catalogo : CATALOGO_MATERIALI_SEED;
  const baseEl = {
    ...elemento,
    descrizione: descrizioneNormalizzata || descrizioneOriginale,
    descrizioneOriginale: descrizioneOriginale || descrizioneNormalizzata,
    descrizioneNormalizzata: descrizioneNormalizzata || descrizioneOriginale,
  };

  if (!descrizioneNorm) {
    return {
      stato: "non_trovato",
      id: null,
      candidati: [],
      confidence: 0,
      messaggio: "Materiale non trovato nel catalogo",
      candidato: null,
      elemento: baseEl,
    };
  }

  // ID variante esatto
  const varianteIdReq = String(elemento?.varianteId || "").trim();
  if (varianteIdReq) {
    for (const famiglia of elenco) {
      const variante = (famiglia.varianti || []).find(
        (v) => v.id === varianteIdReq
      );
      if (variante) {
        const c = {
          id: variante.id,
          famigliaId: famiglia.id,
          varianteId: variante.id,
          nome: `${famiglia.nome} — ${variante.etichetta}`,
          unita: variante.unita || famiglia.unitaDefault || elemento.unita || "pz",
          prezzoIndicativo:
            variante.prezzoIndicativo != null
              ? Number(variante.prezzoIndicativo)
              : null,
          prezzoDalCatalogo: variante.prezzoIndicativo != null,
          punteggio: 100,
          confidence: 0.99,
          metodo: "id",
        };
        return {
          stato: "match",
          id: c.varianteId,
          candidati: [c],
          confidence: 0.99,
          messaggio: "",
          candidato: c,
          elemento: baseEl,
        };
      }
    }
  }

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
    id: variante.id,
    famigliaId: famiglia.id,
    varianteId: variante.id,
    nome: `${famiglia.nome} — ${variante.etichetta}`,
    unita: variante.unita || famiglia.unitaDefault || elemento.unita || "pz",
    prezzoIndicativo:
      variante.prezzoIndicativo != null &&
      Number.isFinite(Number(variante.prezzoIndicativo))
        ? Number(variante.prezzoIndicativo)
        : null,
    prezzoDalCatalogo: variante.prezzoIndicativo != null,
    punteggio,
    confidence: Math.min(0.99, Math.max(0.4, punteggio / 50)),
    metodo: "fuzzy",
  }));

  if (candidati.length === 0) {
    return {
      stato: "non_trovato",
      id: null,
      candidati: [],
      confidence: 0,
      messaggio: "Materiale non trovato nel catalogo",
      candidato: null,
      elemento: baseEl,
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
      id: candidati[0].varianteId,
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
 * @param {Array=} catalogo
 */
export function abbinaMaterialiAlCatalogo(elementi = [], catalogo) {
  return (Array.isArray(elementi) ? elementi : []).map((el) => ({
    ...el,
    descrizione:
      el.descrizioneNormalizzata || el.descrizione || el.descrizioneOriginale,
    descrizioneOriginale: el.descrizioneOriginale || el.descrizione || "",
    descrizioneNormalizzata: el.descrizioneNormalizzata || el.descrizione || "",
    match: matchMaterialeConCatalogo(el, catalogo),
    quantita: el.quantita ?? 1,
  }));
}
