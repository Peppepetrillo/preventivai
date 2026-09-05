/**
 * Ricerca lavori potenzialmente simili (deterministico, no embeddings).
 */

import { analizzaLavoroStorico } from "../storico/storicoLavoriService";
import { AI_SOGLIE } from "./aiTypes";
import { classificaLavoro } from "./classificaLavoro";
import { normalizzaTestoAi, testoLavoroAi, tokenizzaAi } from "./aiTextUtils";

/**
 * Estrae segnali testuali da un cantiere storico (senza PII oltre nome lavoro tecnico).
 * @param {object} cantiere
 */
function segnaliDaCantiere(cantiere = {}) {
  const materiali = Array.isArray(cantiere.materiali)
    ? cantiere.materiali.map((m) => m?.nome || m?.descrizione || "")
    : [];
  const lavorazioni = Array.isArray(cantiere.lavorazioniOrigine)
    ? cantiere.lavorazioniOrigine.map((v) => ({
        nome: v?.nome,
        categoria: v?.categoria,
      }))
    : [];

  return {
    titolo: cantiere.nome,
    descrizione: cantiere.descrizioneIntervento || cantiere.tipoIntervento || "",
    tipoLavoro: cantiere.tipoLavoro || "",
    tipologiaImpianto: cantiere.tipologiaImpianto || "",
    materiali,
    lavorazioni,
  };
}

/**
 * @param {object} nuovo
 * @param {object} storicoSegnali
 * @param {string|null} catNuovo
 * @param {string|null} catStorico
 * @returns {{ score: number, motivi: string[] }}
 */
export function calcolaScoreSomiglianza(
  nuovo,
  storicoSegnali,
  catNuovo,
  catStorico
) {
  let score = 0;
  /** @type {string[]} */
  const motivi = [];

  if (catNuovo && catStorico && catNuovo === catStorico) {
    score += 40;
    motivi.push("stessa categoria");
  }

  const tipN = normalizzaTestoAi(nuovo.tipologiaImpianto || "");
  const tipS = normalizzaTestoAi(storicoSegnali.tipologiaImpianto || "");
  if (tipN && tipS && tipN === tipS) {
    score += 20;
    motivi.push("stessa tipologia impianto");
  }

  const tipoN = normalizzaTestoAi(nuovo.tipoLavoro || "");
  const tipoS = normalizzaTestoAi(storicoSegnali.tipoLavoro || "");
  if (tipoN && tipoS && tipoN === tipoS) {
    score += 12;
    motivi.push("stesso tipo lavoro");
  }

  const tokenNuovo = new Set(tokenizzaAi(testoLavoroAi(nuovo)));
  const tokenStorico = tokenizzaAi(testoLavoroAi(storicoSegnali));
  let overlap = 0;
  for (const t of tokenStorico) {
    if (tokenNuovo.has(t) && t.length > 3) {
      overlap += 1;
    }
  }
  if (overlap > 0) {
    const punti = Math.min(30, overlap * 5);
    score += punti;
    motivi.push(`${overlap} parole in comune`);
  }

  return { score, motivi };
}

/**
 * @param {object} nuovoLavoro
 * @param {object[]} cantieri
 * @param {{ max?: number, scoreMinimo?: number }=} opzioni
 * @returns {Array<{ cantiereId: string, score: number, motiviSomiglianza: string[], riepilogo: object|null }>}
 */
export function trovaLavoriSimili(nuovoLavoro = {}, cantieri = [], opzioni = {}) {
  const max = Number(opzioni.max) || AI_SOGLIE.maxLavoriSimili;
  const scoreMin =
    Number(opzioni.scoreMinimo) || AI_SOGLIE.scoreMinimoSimile;

  const classificazione = classificaLavoro(nuovoLavoro);
  const lista = Array.isArray(cantieri) ? cantieri : [];

  /** @type {Array<{ cantiereId: string, score: number, motiviSomiglianza: string[], riepilogo: object|null }>} */
  const risultati = [];

  for (const cantiere of lista) {
    const id = String(cantiere?.id || "").trim();
    if (!id) continue;

    const segnali = segnaliDaCantiere(cantiere);
    const classStorico = classificaLavoro(segnali);
    const { score, motivi } = calcolaScoreSomiglianza(
      nuovoLavoro,
      segnali,
      classificazione.categoria,
      classStorico.categoria
    );

    if (score < scoreMin) continue;

    risultati.push({
      cantiereId: id,
      score,
      motiviSomiglianza: motivi,
      riepilogo: analizzaLavoroStorico(cantiere),
    });
  }

  risultati.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return String(a.cantiereId).localeCompare(String(b.cantiereId));
  });

  return risultati.slice(0, max);
}
