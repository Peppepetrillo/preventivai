/**
 * Contesto strutturato privacy-safe per PreventivAI Intelligence.
 * Solo aggregati e segnali tecnici — niente PII inutili.
 */

import { analizzaLavoroStorico, isLavoroConcluso } from "../storico/storicoLavoriService";
import { classificaLavoro } from "./classificaLavoro";
import {
  calcolaStatisticheSimili,
  valutaConfidenzaAi,
} from "./aiStatistiche";
import { trovaLavoriSimili } from "./trovaLavoriSimili";
import { ETICHETTE_CATEGORIA_LAVORO } from "./aiTypes";

/**
 * Normalizza input nuovo lavoro dal wizard / form.
 * @param {object} grezzo
 */
export function normalizzaNuovoLavoroAi(grezzo = {}) {
  const lavorazioni = Array.isArray(grezzo.lavorazioni)
    ? grezzo.lavorazioni.map((v) => ({
        nome: String(v?.nome || "").trim(),
        categoria: String(v?.categoria || "").trim(),
      })).filter((v) => v.nome)
    : [];

  const materiali = Array.isArray(grezzo.materiali)
    ? grezzo.materiali
        .map((m) => (typeof m === "string" ? m : m?.nome || ""))
        .map((n) => String(n).trim())
        .filter(Boolean)
    : lavorazioni
        .filter((v) => /material/i.test(v.categoria || ""))
        .map((v) => v.nome);

  return {
    titolo: String(grezzo.titolo || grezzo.nome || "").trim(),
    descrizione: String(grezzo.descrizione || "").trim(),
    tipoLavoro: String(grezzo.tipoLavoro || "").trim(),
    tipologiaImpianto: String(grezzo.tipologiaImpianto || "").trim(),
    lavorazioni,
    materiali,
    // Mai includere: cliente, telefono, email, indirizzo, CF, P.IVA, IBAN
  };
}

/**
 * Costruisce il contesto completo (deterministico).
 *
 * @param {{
 *   cantieri?: object[],
 *   nuovoLavoro?: object,
 * }} input
 */
export function costruisciContestoPreventivAI(input = {}) {
  const nuovoLavoro = normalizzaNuovoLavoroAi(input.nuovoLavoro || {});
  const cantieri = Array.isArray(input.cantieri) ? input.cantieri : [];

  const classificazione = classificaLavoro(nuovoLavoro);
  const simili = trovaLavoriSimili(nuovoLavoro, cantieri);
  const statistiche = calcolaStatisticheSimili(simili);
  const livelloConfidenza = valutaConfidenzaAi(statistiche, classificazione);

  const conclusi = cantieri.filter(isLavoroConcluso);
  const riepiloghiConclusi = conclusi
    .map((c) => analizzaLavoroStorico(c))
    .filter(Boolean);

  const portfolio = {
    lavoriConclusi: conclusi.length,
    lavoriTotali: cantieri.length,
    conRegistro: riepiloghiConclusi.filter((r) => r.contaGiornate > 0).length,
  };

  return {
    versione: 1,
    generatoIl: new Date().toISOString(),
    nuovoLavoro: {
      ...nuovoLavoro,
      categoria: classificazione.categoria,
      categoriaEtichetta: classificazione.categoria
        ? ETICHETTE_CATEGORIA_LAVORO[classificazione.categoria] || null
        : null,
      classificazioneConfidence: classificazione.confidence,
      segnaliClassificazione: classificazione.segnali,
    },
    classificazione,
    lavoriSimili: simili.map((s) => ({
      cantiereId: s.cantiereId,
      score: s.score,
      motiviSomiglianza: s.motiviSomiglianza,
      // Metriche aggregate senza nome cliente
      contaGiornate: s.riepilogo?.contaGiornate ?? null,
      oreLavorate: s.riepilogo?.oreLavorate ?? null,
      speseMateriali: s.riepilogo?.speseMateriali ?? null,
      altreSpese: s.riepilogo?.altreSpese ?? null,
      uscite: s.riepilogo?.uscite ?? null,
      entrate: s.riepilogo?.entrate ?? null,
      saldo: s.riepilogo?.saldo ?? null,
      etichettaTecnica: s.riepilogo?.nome
        ? String(s.riepilogo.nome).slice(0, 80)
        : null,
    })),
    statistiche,
    portfolio,
    livelloConfidenza,
    limiti: {
      privacy: "Niente nomi clienti, indirizzi, contatti, CF, P.IVA, IBAN.",
      stima:
        "Le medie sono descrittive sui lavori confrontabili, non prezzi consigliati.",
      inventare: false,
    },
  };
}
