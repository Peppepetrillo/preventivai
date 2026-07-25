/**
 * Proposal Service — costruisce un preventivo economico da Catalogo + Listino.
 * I prezzi si risolvono SOLO tramite catalogoId → chiaveListino → Listino.
 * Nessun confronto di descrizioni.
 */

import { calcolaTotali, normalizzaNumero } from "../../utils/preventivi";
import { generaPropostaPreventivo } from "../knowledge/preventivoIntelligenteService";
import { ottieniPattern } from "../brain/brainPatternService";
import { caricaCatalogoListino } from "../../features/listino/listinoCatalogService";
import { applicaDecisionMemoryAConoscenza } from "../decisionMemory";
import {
  nomeDaCatalogo,
  categoriaDaCatalogo,
  normalizzaRiferimentoCatalogo,
  risolviPrezzoDaCatalogo,
} from "../catalogo";
import {
  creaLavorazioneProposal,
  creaPreventivoProposal,
  ORIGINE_LAVORAZIONE,
} from "./preventivoProposalTypes";
import { creaPreventivo } from "../../features/preventivi/preventiviDomain";

/**
 * Estrae riferimenti Catalogo dalla proposta Knowledge.
 * @param {object} conoscenzaProposta
 * @returns {Array<{ id: string, quantita: number, meta: object, origine: string, regola: string, perche: string, affidabilita: number|null }>}
 */
export function estraiSuggerimentiEconomici(conoscenzaProposta = {}) {
  const elenco = [];
  const visti = new Set();

  const push = (voce, meta = {}) => {
    const rif = normalizzaRiferimentoCatalogo(voce);
    if (!rif) return;
    if (visti.has(rif.id)) {
      // Aggiorna quantità se maggiore (es. punti)
      const esistente = elenco.find((e) => e.id === rif.id);
      if (esistente) {
        esistente.quantita = Math.max(esistente.quantita, rif.quantita);
        esistente.meta = { ...esistente.meta, ...rif.meta };
      }
      return;
    }
    visti.add(rif.id);
    elenco.push({
      id: rif.id,
      quantita: rif.quantita,
      meta: rif.meta || {},
      origine:
        (typeof voce === "object" && voce.origine) ||
        meta.origine ||
        ORIGINE_LAVORAZIONE.BASE,
      regola: meta.regola || "",
      perche:
        (typeof voce === "object" && (voce.perche || voce.percheBrain)) ||
        meta.perche ||
        "",
      affidabilita:
        typeof voce === "object" && voce.affidabilita != null
          ? Number(voce.affidabilita)
          : meta.affidabilita ?? null,
    });
  };

  (conoscenzaProposta.suggerimenti || []).forEach((voce) => push(voce));

  // Quadro: se presente come catalogoId e non già nei suggerimenti
  if (conoscenzaProposta.quadroCatalogoId) {
    push(
      {
        id: conoscenzaProposta.quadroCatalogoId,
        quantita: 1,
        meta: { moduli: conoscenzaProposta.quadroModuli },
      },
      { regola: "quadroSuggerito" }
    );
  }

  return elenco;
}

/**
 * Risolve prezzo Listino da catalogoId. Mai per descrizione.
 * @param {string} catalogoId
 * @param {object[]} listino
 */
export function risolviVoceListinoDaCatalogo(catalogoId, listino = []) {
  const esito = risolviPrezzoDaCatalogo(catalogoId, listino);
  return {
    ...esito,
    voce: esito.voceListino,
  };
}

/**
 * @deprecated Usare risolviVoceListinoDaCatalogo. Mantenuto solo per import legacy nei test.
 */
export function risolviVoceListino(descrizione, listino = []) {
  const rif = normalizzaRiferimentoCatalogo(descrizione);
  if (!rif) {
    return { voce: null, prezzoConfigurato: false };
  }
  const esito = risolviPrezzoDaCatalogo(rif.id, listino);
  return {
    voce: esito.voceListino,
    prezzoConfigurato: esito.prezzoConfigurato,
    catalogoId: rif.id,
  };
}

/**
 * @deprecated Alias rimossi — il Catalogo è la fonte di verità.
 */
export const SUGGERIMENTO_LISTINO_ALIAS = Object.freeze({});

/**
 * Costruisce PreventivoProposal da output Knowledge + listino via Catalogo.
 */
export function costruisciPreventivoProposal({
  conoscenzaProposta = {},
  listino = [],
  input = {},
  iva = 22,
  sconto = 0,
  brainInsights = {},
} = {}) {
  const suggerimenti = estraiSuggerimentiEconomici(conoscenzaProposta);

  const lavorazioni = suggerimenti.map((sug) => {
    const prezzo = risolviPrezzoDaCatalogo(sug.id, listino);
    const descrizione =
      (sug.id === "QUADRO_ELETTRICO" || sug.id === "QUADRO_12_MODULI") &&
      sug.meta?.moduli
        ? `Quadro ${sug.meta.moduli} moduli`
        : nomeDaCatalogo(sug.id);

    return creaLavorazioneProposal({
      id: sug.id,
      descrizione,
      quantita: sug.quantita,
      prezzoUnitario: prezzo.prezzoConfigurato
        ? prezzo.prezzoUnitario
        : null,
      unita: prezzo.unita || "cad",
      origine: sug.origine || ORIGINE_LAVORAZIONE.BASE,
      regola: sug.regola || "",
      perche: sug.perche || "",
      prezzoConfigurato: prezzo.prezzoConfigurato,
      listinoId: prezzo.voceListino?.id || prezzo.catalogo?.chiaveListino || null,
      catalogoId: sug.id,
      categoria: categoriaDaCatalogo(sug.id),
    });
  });

  const perCalcolo = lavorazioni
    .filter((l) => l.prezzoConfigurato)
    .map((l) => ({
      prezzo: l.prezzoUnitario,
      quantita: l.quantita,
    }));

  const totali = calcolaTotali(perCalcolo, sconto, iva);

  const suggerimentiBrain = (conoscenzaProposta.suggerimenti || []).filter(
    (s) => typeof s === "object" && s.origine === "BRAIN"
  );

  return creaPreventivoProposal({
    riepilogo: {
      superficieMq: input.superficieMq ?? input.mq ?? null,
      livelloImpianto: input.livelloImpianto || "",
      tipoImmobile: input.tipoImmobile || "",
      puntiStimati: conoscenzaProposta.puntiStimati ?? null,
      quadroSuggerito: conoscenzaProposta.quadroSuggerito || null,
      quadroCatalogoId: conoscenzaProposta.quadroCatalogoId || null,
    },
    lavorazioni,
    subtotale: totali.subtotale,
    totaleIVA: totali.importoIva,
    totale: totali.totale,
    ivaPercentuale: iva,
    scontoPercentuale: sconto,
    regoleApplicate: conoscenzaProposta.regoleApplicate || [],
    brainInsights: {
      patterns: brainInsights.patterns || [],
      suggerimentiBrain,
      ...(brainInsights || {}),
    },
    conoscenzaProposta,
    input,
  });
}

/**
 * Orchestrazione: Knowledge → Decision Memory → Catalogo → Listino → Proposal.
 */
export function generaPreventivoEconomico(form = {}, opzioni = {}) {
  try {
    const conoscenza = generaPropostaPreventivo(form, {
      conoscenzePersonali: opzioni.conoscenzePersonali,
      regoleBase: opzioni.regoleBase,
    });

    if (!conoscenza?.success || !conoscenza.proposta) {
      return { success: false, error: "proposta_knowledge_fallita" };
    }

    const conoscenzaConMemoria = applicaDecisionMemoryAConoscenza(
      conoscenza.proposta,
      {
        sessionId: opzioni.sessionId ?? null,
        preventivoId: opzioni.preventivoId ?? null,
        decisioni: opzioni.decisioniMemoria,
      }
    );

    let listino = opzioni.listino;
    if (listino === undefined) {
      try {
        listino = caricaCatalogoListino();
      } catch {
        listino = [];
      }
    }

    let patterns = opzioni.brainPatterns;
    if (patterns === undefined) {
      try {
        patterns = ottieniPattern();
      } catch {
        patterns = [];
      }
    }

    const proposal = costruisciPreventivoProposal({
      conoscenzaProposta: conoscenzaConMemoria,
      listino: Array.isArray(listino) ? listino : [],
      input: form,
      iva: opzioni.iva ?? 22,
      sconto: opzioni.sconto ?? 0,
      brainInsights: { patterns: Array.isArray(patterns) ? patterns : [] },
    });

    return { success: true, proposal };
  } catch (errore) {
    return {
      success: false,
      error: errore?.message || "generazione_fallita",
    };
  }
}

/**
 * Converte Proposal → preventivo dominio, preservando catalogoId.
 */
export function convertiProposalInPreventivo(proposal, opzioni = {}) {
  if (!proposal) {
    throw new Error("Proposal assente.");
  }

  const lavorazioni = (proposal.lavorazioni || []).map((l) => ({
    id: l.catalogoId || l.id,
    catalogoId: l.catalogoId || null,
    listinoId: l.listinoId || null,
    nome: l.descrizione,
    categoria: l.categoria || "Lavorazioni",
    // Mai inventare un prezzo: senza listino resta 0 in archivio ma flaggiamo
    prezzoConfigurato: Boolean(l.prezzoConfigurato),
    prezzo: l.prezzoConfigurato ? normalizzaNumero(l.prezzoUnitario) : 0,
    quantita: normalizzaNumero(l.quantita, 1),
    unita: l.unita || "cad",
  }));

  const noteParti = [
    opzioni.note || "",
    "Generato da Preventivo Intelligente.",
    proposal.riepilogo?.quadroSuggerito
      ? `Quadro suggerito: ${proposal.riepilogo.quadroSuggerito}.`
      : "",
    (proposal.lavorazioni || []).some((l) => !l.prezzoConfigurato)
      ? "Alcune voci richiedono configurazione prezzo nel listino."
      : "",
  ].filter(Boolean);

  return creaPreventivo({
    archivio: opzioni.archivio || [],
    cliente: String(opzioni.cliente || "Da completare").trim() || "Da completare",
    lavorazioni,
    sconto: opzioni.sconto ?? proposal.scontoPercentuale ?? 0,
    iva: opzioni.iva ?? proposal.ivaPercentuale ?? 22,
    validita: opzioni.validita ?? 30,
    pagamento: opzioni.pagamento || "Bonifico bancario",
    acconto: opzioni.acconto ?? 0,
    note: noteParti.join(" "),
    tipoLavoro: opzioni.tipoLavoro || "impianto",
  });
}

export { creaLavorazioneProposal, creaPreventivoProposal, ORIGINE_LAVORAZIONE };
