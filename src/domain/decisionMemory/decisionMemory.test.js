/**
 * Decision Memory — test salvataggio, priorità, rigenerazione, pricing.
 * Sempre scoped per sessionId.
 */

import { beforeEach, describe, expect, it } from "vitest";
import {
  MEMORY_STATO,
  applicaDecisionMemoryAConoscenza,
  elencaMemoriaPerScope,
  inferisciStatoMemoria,
  leggiDecisioniAttive,
  ottieniMemoriaPerCatalogo,
  registraSceltaAssistente,
  resetMemoriaDecisioni,
  salvaDecisioneMemoria,
} from "./index";
import {
  creaNuovaSessione,
  resetSessioniSopralluogo,
} from "../sopralluogoSession";
import { generaPreventivoEconomico } from "../preventivi";
import { generaPropostaPreventivo } from "../knowledge/preventivoIntelligenteService";

const INPUT_CLIMA = {
  tipoImmobile: "appartamento",
  superficieMq: 80,
  climatizzazione: true,
  livelloImpianto: "standard",
};

describe("Decision Memory", () => {
  /** @type {string} */
  let sessionId;

  beforeEach(() => {
    resetMemoriaDecisioni();
    resetSessioniSopralluogo();
    sessionId = creaNuovaSessione().id;
  });

  it("salva e recupera una decisione scoped", () => {
    const salvata = salvaDecisioneMemoria({
      sessionId,
      domandaId: "ASK_CLIMA_QUANTI",
      catalogoId: "CLIMA",
      valorePrecedente: 1,
      valoreScelto: 3,
      tipoAzione: "AGGIORNA_QUANTITA",
      stato: MEMORY_STATO.CONFERMATA,
    });

    expect(salvata.sessionId).toBe(sessionId);
    expect(salvata.id).toBeTruthy();

    const trovata = ottieniMemoriaPerCatalogo("CLIMA", { sessionId });
    expect(trovata).toMatchObject({
      catalogoId: "CLIMA",
      valoreScelto: 3,
      stato: MEMORY_STATO.CONFERMATA,
      sessionId,
    });
    expect(elencaMemoriaPerScope({ sessionId })).toHaveLength(1);
  });

  it("inferisce MODIFICATA se valore diverso da KE", () => {
    expect(inferisciStatoMemoria(2, 3)).toBe(MEMORY_STATO.MODIFICATA);
    expect(inferisciStatoMemoria(3, 3)).toBe(MEMORY_STATO.CONFERMATA);
  });

  it("priorità: MODIFICATA prevale su CONFERMATA e su KE", () => {
    registraSceltaAssistente({
      sessionId,
      domandaId: "ASK_CLIMA_QUANTI",
      catalogoId: "CLIMA",
      valorePrecedente: 1,
      valoreScelto: 3,
      stato: MEMORY_STATO.CONFERMATA,
    });
    registraSceltaAssistente({
      sessionId,
      domandaId: "ASK_CLIMA_QUANTI",
      catalogoId: "CLIMA",
      valorePrecedente: 3,
      valoreScelto: 2,
      stato: MEMORY_STATO.MODIFICATA,
    });

    const attive = leggiDecisioniAttive({ sessionId });
    expect(attive[0].stato).toBe(MEMORY_STATO.MODIFICATA);
    expect(Number(attive[0].valoreScelto)).toBe(2);

    const ke = generaPropostaPreventivo(INPUT_CLIMA);
    const merged = applicaDecisionMemoryAConoscenza(ke.proposta, {
      sessionId,
    });
    const clima = merged.suggerimenti.find(
      (s) => (s.id || s.catalogoId) === "CLIMA"
    );
    expect(clima.quantita).toBe(2);
  });

  it("modifica manuale: stato MODIFICATA e valoreScelto aggiornato", () => {
    registraSceltaAssistente({
      sessionId,
      domandaId: "ASK_CLIMA_QUANTI",
      catalogoId: "CLIMA",
      valorePrecedente: 3,
      valoreScelto: 3,
      stato: MEMORY_STATO.CONFERMATA,
    });

    const modificata = registraSceltaAssistente({
      sessionId,
      domandaId: "ASK_CLIMA_QUANTI",
      catalogoId: "CLIMA",
      valorePrecedente: 3,
      valoreScelto: 2,
      stato: MEMORY_STATO.MODIFICATA,
    });

    expect(modificata.stato).toBe(MEMORY_STATO.MODIFICATA);
    expect(Number(modificata.valoreScelto)).toBe(2);
  });

  it("rigenerazione: memoria prevale su KE senza sovrascrittura", () => {
    registraSceltaAssistente({
      sessionId,
      domandaId: "ASK_CLIMA_QUANTI",
      catalogoId: "CLIMA",
      valorePrecedente: 1,
      valoreScelto: 2,
      stato: MEMORY_STATO.MODIFICATA,
    });

    const prima = generaPreventivoEconomico(INPUT_CLIMA, { sessionId });
    const seconda = generaPreventivoEconomico(INPUT_CLIMA, { sessionId });
    expect(
      prima.proposal.lavorazioni.find((l) => l.catalogoId === "CLIMA").quantita
    ).toBe(2);
    expect(
      seconda.proposal.lavorazioni.find((l) => l.catalogoId === "CLIMA")
        .quantita
    ).toBe(2);
  });

  it("pricing invariato: prezzo unitario da Listino, non dalla memoria", () => {
    const senzaMemoria = generaPreventivoEconomico(INPUT_CLIMA);
    const climaBase = senzaMemoria.proposal.lavorazioni.find(
      (l) => l.catalogoId === "CLIMA"
    );
    const prezzoUnitario = climaBase.prezzoUnitario;

    registraSceltaAssistente({
      sessionId,
      domandaId: "ASK_CLIMA_QUANTI",
      catalogoId: "CLIMA",
      valorePrecedente: 1,
      valoreScelto: 5,
      stato: MEMORY_STATO.MODIFICATA,
    });

    const conMemoria = generaPreventivoEconomico(INPUT_CLIMA, { sessionId });
    const clima = conMemoria.proposal.lavorazioni.find(
      (l) => l.catalogoId === "CLIMA"
    );
    expect(clima.quantita).toBe(5);
    expect(clima.prezzoUnitario).toBe(prezzoUnitario);
    expect(clima.totale).toBe(5 * prezzoUnitario);
  });

  it("IGNORATA non override KE", () => {
    registraSceltaAssistente({
      sessionId,
      domandaId: "ASK_CLIMA_QUANTI",
      catalogoId: "CLIMA",
      valorePrecedente: 1,
      valoreScelto: 9,
      stato: MEMORY_STATO.IGNORATA,
    });

    const out = generaPreventivoEconomico(INPUT_CLIMA, { sessionId });
    const clima = out.proposal.lavorazioni.find(
      (l) => l.catalogoId === "CLIMA"
    );
    expect(clima.quantita).toBe(1);
  });

  it("rifiuta record con prezzi o senza sessionId", () => {
    expect(() =>
      salvaDecisioneMemoria({
        sessionId,
        domandaId: "ASK_CLIMA_QUANTI",
        catalogoId: "CLIMA",
        valoreScelto: 2,
        stato: MEMORY_STATO.CONFERMATA,
        prezzo: 100,
      })
    ).toThrow(/prezzi/i);

    expect(() =>
      salvaDecisioneMemoria({
        domandaId: "ASK_CLIMA_QUANTI",
        catalogoId: "CLIMA",
        valoreScelto: 2,
        stato: MEMORY_STATO.CONFERMATA,
      })
    ).toThrow(/sessionId/i);
  });
});
