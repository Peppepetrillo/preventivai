/**
 * Proposal Service — costruisce un preventivo economico da suggerimenti + listino.
 * Non conosce la UI. Non inventa prezzi.
 */

import { calcolaTotali, normalizzaNumero } from "../../utils/preventivi";
import { generaPropostaPreventivo } from "../knowledge/preventivoIntelligenteService";
import { ottieniPattern } from "../brain/brainPatternService";
import { caricaCatalogoListino } from "../../features/listino/listinoCatalogService";
import { selezionaVociAttive } from "../../features/listino/listinoCatalogDomain";
import {
  creaLavorazioneProposal,
  creaPreventivoProposal,
  ORIGINE_LAVORAZIONE,
} from "./preventivoProposalTypes";
import { creaPreventivo } from "../../features/preventivi/preventiviDomain";

/** Alias suggerimento Knowledge → nomi listino candidati (ordine preferenza). */
export const SUGGERIMENTO_LISTINO_ALIAS = Object.freeze({
  "quadro 24 moduli": ["quadro elettrico"],
  "quadro 36 moduli": ["quadro elettrico"],
  "predisposizione climatizzazione": [
    "predisposizione termostato",
    "predisposizione clima",
  ],
  gateway: ["gateway living now", "gateway"],
  "citofono/videocitofono": ["predisposizione citofono", "citofono"],
  "predisposizione cancello": ["predisposizione cancello", "cancello"],
  "illuminazione esterna": ["punto luce", "faretto", "illuminazione esterna"],
  allarme: ["predisposizione impianto allarme", "allarme"],
  videosorveglianza: ["videosorveglianza", "telecamera"],
  bus: ["bus"],
  alimentatore: ["alimentatore"],
  "distribuzione linee per piano": [
    "distribuzione linee per piano",
    "montante",
  ],
});

function normalizzaTesto(valore) {
  return String(valore || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function titoloSuggerimento(voce) {
  if (!voce) return "";
  if (typeof voce === "string") return voce;
  return String(voce.titolo || voce.testo || "").trim();
}

/**
 * Cerca una voce listino per un suggerimento. Mai inventa prezzo.
 * @param {string} descrizione
 * @param {object[]} listino
 * @returns {{ voce: object|null, prezzoConfigurato: boolean }}
 */
export function risolviVoceListino(descrizione, listino = []) {
  const attive = selezionaVociAttive(listino);
  const chiave = normalizzaTesto(descrizione);
  if (!chiave || attive.length === 0) {
    return { voce: null, prezzoConfigurato: false };
  }

  const alias = SUGGERIMENTO_LISTINO_ALIAS[chiave] || [];
  for (const candidato of alias) {
    const hit = attive.find(
      (v) => normalizzaTesto(v.nome) === normalizzaTesto(candidato)
    );
    if (hit) {
      return { voce: hit, prezzoConfigurato: true };
    }
  }

  const esatto = attive.find((v) => normalizzaTesto(v.nome) === chiave);
  if (esatto) {
    return { voce: esatto, prezzoConfigurato: true };
  }

  // Match soft: nome contiene suggerimento o viceversa (min 4 char)
  if (chiave.length >= 4) {
    const soft = attive.find((v) => {
      const nome = normalizzaTesto(v.nome);
      return nome.includes(chiave) || chiave.includes(nome);
    });
    if (soft) {
      return { voce: soft, prezzoConfigurato: true };
    }
  }

  return { voce: null, prezzoConfigurato: false };
}

/**
 * Estrae titoli unici da proposta knowledge (+ quadro se assente).
 * @param {object} conoscenzaProposta
 * @returns {Array<{ titolo: string, origine: string, regola: string, perche: string, affidabilita: number|null }>}
 */
export function estraiSuggerimentiEconomici(conoscenzaProposta = {}) {
  const elenco = [];
  const visti = new Set();

  const push = (titolo, meta = {}) => {
    const t = String(titolo || "").trim();
    if (!t) return;
    const key = normalizzaTesto(t);
    if (visti.has(key)) return;
    visti.add(key);
    elenco.push({
      titolo: t,
      origine: meta.origine || ORIGINE_LAVORAZIONE.BASE,
      regola: meta.regola || "",
      perche: meta.perche || "",
      affidabilita:
        meta.affidabilita === null || meta.affidabilita === undefined
          ? null
          : Number(meta.affidabilita),
    });
  };

  (conoscenzaProposta.suggerimenti || []).forEach((voce) => {
    push(titoloSuggerimento(voce), {
      origine:
        typeof voce === "object" ? voce.origine : ORIGINE_LAVORAZIONE.BASE,
      perche: typeof voce === "object" ? voce.perche || voce.percheBrain : "",
      affidabilita: typeof voce === "object" ? voce.affidabilita : null,
      regola: "",
    });
  });

  if (conoscenzaProposta.quadroSuggerito) {
    push(conoscenzaProposta.quadroSuggerito, {
      origine: ORIGINE_LAVORAZIONE.BASE,
      regola: "quadroSuggerito",
    });
  }

  return elenco;
}

/**
 * Costruisce PreventivoProposal da output Knowledge + listino.
 * @param {{
 *   conoscenzaProposta: object,
 *   listino?: object[],
 *   input?: object,
 *   iva?: number,
 *   sconto?: number,
 *   brainInsights?: object,
 * }} params
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
    const { voce, prezzoConfigurato } = risolviVoceListino(sug.titolo, listino);
    return creaLavorazioneProposal({
      descrizione: sug.titolo,
      quantita: 1,
      prezzoUnitario: prezzoConfigurato ? normalizzaNumero(voce?.prezzo) : null,
      unita: voce?.unita || "cad",
      origine: sug.origine || ORIGINE_LAVORAZIONE.BASE,
      regola: sug.regola || "",
      perche: sug.perche || "",
      prezzoConfigurato,
      listinoId: voce?.id || null,
      categoria: voce?.categoria || "",
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
 * Orchestrazione app: Knowledge → Proposal economica.
 * La UI chiama solo questa (non il Knowledge Engine).
 *
 * @param {object} form
 * @param {{
 *   listino?: object[],
 *   iva?: number,
 *   sconto?: number,
 *   conoscenzePersonali?: object[],
 *   brainPatterns?: object[],
 * }=} opzioni
 * @returns {{ success: boolean, proposal?: object, error?: string }}
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

    const listino =
      opzioni.listino !== undefined
        ? opzioni.listino
        : caricaCatalogoListino();

    const patterns =
      opzioni.brainPatterns !== undefined
        ? opzioni.brainPatterns
        : ottieniPattern();

    const proposal = costruisciPreventivoProposal({
      conoscenzaProposta: conoscenza.proposta,
      listino,
      input: form,
      iva: opzioni.iva ?? 22,
      sconto: opzioni.sconto ?? 0,
      brainInsights: { patterns },
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
 * Converte una Proposal in preventivo dominio (Bozza), senza inventare prezzi.
 * Lavorazioni senza prezzo entrano a 0 € (da completare in dettaglio).
 *
 * @param {object} proposal
 * @param {{ archivio?: object[], cliente?: string, note?: string, iva?: number, sconto?: number }=} opzioni
 */
export function convertiProposalInPreventivo(proposal, opzioni = {}) {
  if (!proposal) {
    throw new Error("Proposal assente.");
  }

  const lavorazioni = (proposal.lavorazioni || []).map((l) => ({
    id: l.id,
    nome: l.descrizione,
    categoria: l.categoria || "Lavorazioni",
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
