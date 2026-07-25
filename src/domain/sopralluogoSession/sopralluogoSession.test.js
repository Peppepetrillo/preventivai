/**
 * Sopralluogo Session + isolamento Decision Memory.
 */

import { beforeEach, describe, expect, it } from "vitest";
import {
  SESSIONE_STATO,
  assicuratiSessioneAttiva,
  chiudiSessione,
  creaNuovaSessione,
  nuovaSessioneSopralluogo,
  ottieniSessioneAttiva,
  resetSessioniSopralluogo,
} from "./index";
import {
  MEMORY_STATO,
  applicaDecisionMemoryAConoscenza,
  elencaMemoriaPerScope,
  ottieniMemoriaPerCatalogo,
  registraSceltaAssistente,
  resetMemoriaDecisioni,
} from "../decisionMemory";
import { generaPreventivoEconomico } from "../preventivi";

const INPUT_CLIMA = {
  tipoImmobile: "appartamento",
  superficieMq: 80,
  climatizzazione: true,
  livelloImpianto: "standard",
};

describe("Sopralluogo Session Memory", () => {
  beforeEach(() => {
    resetSessioniSopralluogo();
    resetMemoriaDecisioni();
  });

  it("crea una sessione attiva", () => {
    const s = creaNuovaSessione();
    expect(s.id).toBeTruthy();
    expect(s.stato).toBe(SESSIONE_STATO.ATTIVA);
    expect(s.decisionIds).toEqual([]);
    expect(ottieniSessioneAttiva().id).toBe(s.id);
  });

  it("assicura sessione senza duplicarla se già attiva", () => {
    const a = assicuratiSessioneAttiva();
    const b = assicuratiSessioneAttiva();
    expect(b.id).toBe(a.id);
  });

  it("isola decisioni tra due sessioni / preventivi", () => {
    const s1 = creaNuovaSessione({ preventivoId: "prev-A" });
    const s2 = nuovaSessioneSopralluogo({ preventivoId: "prev-B" });

    registraSceltaAssistente({
      sessionId: s1.id,
      preventivoId: "prev-A",
      domandaId: "ASK_CLIMA_QUANTI",
      catalogoId: "CLIMA",
      valorePrecedente: 1,
      valoreScelto: 7,
      stato: MEMORY_STATO.MODIFICATA,
    });

    registraSceltaAssistente({
      sessionId: s2.id,
      preventivoId: "prev-B",
      domandaId: "ASK_CLIMA_QUANTI",
      catalogoId: "CLIMA",
      valorePrecedente: 1,
      valoreScelto: 2,
      stato: MEMORY_STATO.MODIFICATA,
    });

    expect(
      Number(
        ottieniMemoriaPerCatalogo("CLIMA", { sessionId: s1.id }).valoreScelto
      )
    ).toBe(7);
    expect(
      Number(
        ottieniMemoriaPerCatalogo("CLIMA", { sessionId: s2.id }).valoreScelto
      )
    ).toBe(2);

    const outA = generaPreventivoEconomico(INPUT_CLIMA, {
      sessionId: s1.id,
      preventivoId: "prev-A",
    });
    const outB = generaPreventivoEconomico(INPUT_CLIMA, {
      sessionId: s2.id,
      preventivoId: "prev-B",
    });

    expect(
      outA.proposal.lavorazioni.find((l) => l.catalogoId === "CLIMA").quantita
    ).toBe(7);
    expect(
      outB.proposal.lavorazioni.find((l) => l.catalogoId === "CLIMA").quantita
    ).toBe(2);
  });

  it("recupera solo decisioni della sessione corrente", () => {
    const s1 = creaNuovaSessione();
    const s2 = nuovaSessioneSopralluogo();

    registraSceltaAssistente({
      sessionId: s1.id,
      domandaId: "ASK_CLIMA_QUANTI",
      catalogoId: "CLIMA",
      valoreScelto: 4,
      stato: MEMORY_STATO.CONFERMATA,
    });
    registraSceltaAssistente({
      sessionId: s2.id,
      domandaId: "ASK_UFFICIO_POSTAZIONI_DATI",
      catalogoId: "PUNTO_DATI",
      valoreScelto: 10,
      stato: MEMORY_STATO.CONFERMATA,
    });

    const scope1 = elencaMemoriaPerScope({ sessionId: s1.id });
    expect(scope1).toHaveLength(1);
    expect(scope1[0].catalogoId).toBe("CLIMA");

    const scope2 = elencaMemoriaPerScope({ sessionId: s2.id });
    expect(scope2).toHaveLength(1);
    expect(scope2[0].catalogoId).toBe("PUNTO_DATI");
  });

  it("nessun crosstalk senza scope in merge", () => {
    const s = creaNuovaSessione();
    registraSceltaAssistente({
      sessionId: s.id,
      domandaId: "ASK_CLIMA_QUANTI",
      catalogoId: "CLIMA",
      valoreScelto: 9,
      stato: MEMORY_STATO.MODIFICATA,
    });

    const senzaScope = generaPreventivoEconomico(INPUT_CLIMA);
    expect(
      senzaScope.proposal.lavorazioni.find((l) => l.catalogoId === "CLIMA")
        .quantita
    ).toBe(1);

    const conScope = generaPreventivoEconomico(INPUT_CLIMA, {
      sessionId: s.id,
    });
    expect(
      conScope.proposal.lavorazioni.find((l) => l.catalogoId === "CLIMA")
        .quantita
    ).toBe(9);
  });

  it("rigenerazione con memoria corretta per sessione", () => {
    const s = creaNuovaSessione();
    registraSceltaAssistente({
      sessionId: s.id,
      domandaId: "ASK_CLIMA_QUANTI",
      catalogoId: "CLIMA",
      valorePrecedente: 1,
      valoreScelto: 3,
      stato: MEMORY_STATO.MODIFICATA,
    });

    const a = generaPreventivoEconomico(INPUT_CLIMA, { sessionId: s.id });
    const b = generaPreventivoEconomico(INPUT_CLIMA, { sessionId: s.id });
    expect(
      a.proposal.lavorazioni.find((l) => l.catalogoId === "CLIMA").quantita
    ).toBe(3);
    expect(
      b.proposal.lavorazioni.find((l) => l.catalogoId === "CLIMA").quantita
    ).toBe(3);
  });

  it("chiudi sessione e nuova sessione isolano la memoria", () => {
    const s1 = creaNuovaSessione();
    registraSceltaAssistente({
      sessionId: s1.id,
      domandaId: "ASK_CLIMA_QUANTI",
      catalogoId: "CLIMA",
      valoreScelto: 5,
      stato: MEMORY_STATO.MODIFICATA,
    });

    const chiusa = chiudiSessione(s1.id);
    expect(chiusa.stato).toBe(SESSIONE_STATO.CHIUSA);

    const s2 = nuovaSessioneSopralluogo();
    expect(s2.id).not.toBe(s1.id);

    const out = generaPreventivoEconomico(INPUT_CLIMA, { sessionId: s2.id });
    expect(
      out.proposal.lavorazioni.find((l) => l.catalogoId === "CLIMA").quantita
    ).toBe(1);
  });

  it("rifiuta salvataggio memoria senza sessionId", () => {
    expect(() =>
      registraSceltaAssistente({
        domandaId: "ASK_CLIMA_QUANTI",
        catalogoId: "CLIMA",
        valoreScelto: 1,
        stato: MEMORY_STATO.CONFERMATA,
      })
    ).toThrow(/sessionId/i);
  });

  it("rifiuta recupero memoria globale", () => {
    expect(() => elencaMemoriaPerScope({})).toThrow(/sessionId|preventivoId/i);

    const merged = applicaDecisionMemoryAConoscenza(
      { suggerimenti: [{ id: "CLIMA", quantita: 1 }] },
      {}
    );
    expect(merged.decisionMemoryApplicata).toBeUndefined();
    expect(merged.suggerimenti[0].quantita).toBe(1);
  });
});
