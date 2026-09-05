/**
 * Payload inviato al backend AI (minimo, privacy-safe).
 * Il client NON contiene API key.
 */

import { AI_AZIONE, AI_LIMITI } from "./aiContract";

/**
 * @param {object} contesto — da costruisciContestoPreventivAI
 */
export function costruisciPayloadInsightAi(contesto = {}) {
  const stats = contesto.statistiche || {};
  const nuovo = contesto.nuovoLavoro || {};

  return {
    azione: AI_AZIONE,
    versione: 1,
    vincoli: {
      nonInventarePrezzi: true,
      nonInventareDati: true,
      seDatiInsufficienti: "dichiararlo chiaramente",
      lingua: "it",
      tono: "elettricista-professionale",
    },
    nuovoLavoro: {
      titolo: nuovo.titolo || null,
      descrizione: nuovo.descrizione || null,
      tipoLavoro: nuovo.tipoLavoro || null,
      tipologiaImpianto: nuovo.tipologiaImpianto || null,
      categoria: nuovo.categoria || null,
      categoriaEtichetta: nuovo.categoriaEtichetta || null,
      voci: (nuovo.lavorazioni || []).slice(0, AI_LIMITI.maxVoci).map((v) => ({
        nome: v.nome,
        categoria: v.categoria || null,
      })),
      materiali: (nuovo.materiali || []).slice(0, AI_LIMITI.maxVoci),
    },
    portfolio: contesto.portfolio || {},
    livelloConfidenza: contesto.livelloConfidenza,
    lavoriSimili: (contesto.lavoriSimili || [])
      .slice(0, AI_LIMITI.maxLavoriSimili)
      .map((l) => ({
        score: l.score,
        motivi: l.motiviSomiglianza,
        contaGiornate: l.contaGiornate,
        oreLavorate: l.oreLavorate,
        speseMateriali: l.speseMateriali,
        altreSpese: l.altreSpese,
        uscite: l.uscite,
        entrate: l.entrate,
        saldo: l.saldo,
      })),
    statistiche: {
      numeroConfrontabili: stats.numeroConfrontabili,
      conDatiUtili: stats.conDatiUtili,
      giornate: stats.giornate,
      ore: stats.ore,
      speseMateriali: stats.speseMateriali,
      altreSpese: stats.altreSpese,
      uscite: stats.uscite,
      entrate: stats.entrate,
      saldo: stats.saldo,
    },
    formatoRisposta: {
      titolo: "string",
      valutazione: "string",
      motivazione: "string",
      datiDiConfronto: [{ etichetta: "string", valore: "string" }],
      rischi: "string[]",
      cosaControllare: "string[]",
      suggerimento: "string",
      livelloConfidenza: "insufficiente|bassa|media|buona",
    },
  };
}
