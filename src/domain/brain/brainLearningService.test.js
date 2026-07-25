import { beforeEach, describe, expect, it, vi } from "vitest";

import { cancellaOsservazioni, salvaOsservazione } from "./brainObservationService";
import {
  accettaPattern,
  contaConoscenzeDalBrain,
  ottieniPatternDaConfermare,
  rifiutaPattern,
  statisticheLearning,
  trovaConoscenzaPerPattern,
} from "./brainLearningService";
import { BRAIN_KNOWLEDGE_ORIGINE } from "./brainLearningTypes";
import {
  analizzaOsservazioni,
  ottieniPattern,
  resetPattern,
  aggiornaPattern,
} from "./brainPatternService";
import { BRAIN_PATTERN_STATI } from "./brainPatternTypes";
import {
  elencaConoscenze,
  resetConoscenze,
} from "./personalKnowledgeRepository";
import * as patternService from "./brainPatternService";

function seedVillaClima(n = 6) {
  for (let i = 0; i < n; i += 1) {
    salvaOsservazione(
      {
        tipoImmobile: "villa",
        superficieMq: 180,
        numeroLivelli: "2",
        livelloImpianto: "premium",
        statoImmobile: "nuova-costruzione",
        serieCivile: "living-now",
        extra: { predisposizioneClima: true },
      },
      { puntiStimati: 180 },
      {}
    );
  }
}

describe("brainLearningService", () => {
  beforeEach(() => {
    localStorage.clear();
    cancellaOsservazioni();
    resetPattern();
    resetConoscenze();
    vi.restoreAllMocks();
  });

  it("accettaPattern crea conoscenza personale e marca pattern accettato", () => {
    seedVillaClima(6);
    analizzaOsservazioni();
    const pattern = ottieniPatternDaConfermare()[0];
    expect(pattern).toBeTruthy();

    const risultato = accettaPattern(pattern.id);
    expect(risultato.success).toBe(true);
    expect(risultato.pattern.stato).toBe(BRAIN_PATTERN_STATI.ACCETTATO);
    expect(risultato.pattern.decisionAt).toBeTypeOf("number");
    expect(risultato.pattern.decisionBy).toBe("utente");

    const conoscenza = risultato.conoscenza;
    expect(conoscenza.origine).toBe(BRAIN_KNOWLEDGE_ORIGINE.BRAIN);
    expect(conoscenza.patternId).toBe(pattern.id);
    expect(conoscenza.affidabilita).toBe(pattern.affidabilita);
    expect(conoscenza.osservazioni).toBe(pattern.osservazioni);
    expect(conoscenza.titolo).toBe(pattern.nome);
    expect(contaConoscenzeDalBrain()).toBe(1);
    expect(ottieniPatternDaConfermare()).toHaveLength(0);
  });

  it("rifiutaPattern marca rifiutato senza creare conoscenze", () => {
    seedVillaClima(6);
    analizzaOsservazioni();
    const pattern = ottieniPattern()[0];

    const risultato = rifiutaPattern(pattern.id, {
      motivoRifiuto: "non applicabile",
    });
    expect(risultato.success).toBe(true);
    expect(risultato.pattern.stato).toBe(BRAIN_PATTERN_STATI.RIFIUTATO);
    expect(risultato.pattern.motivoRifiuto).toBe("non applicabile");
    expect(elencaConoscenze()).toHaveLength(0);
    expect(contaConoscenzeDalBrain()).toBe(0);
  });

  it("non crea duplicati se la conoscenza per pattern esiste già", () => {
    seedVillaClima(6);
    analizzaOsservazioni();
    const pattern = ottieniPattern()[0];

    const prima = accettaPattern(pattern.id);
    expect(prima.success).toBe(true);
    expect(contaConoscenzeDalBrain()).toBe(1);

    const seconda = accettaPattern(pattern.id);
    expect(seconda.success).toBe(true);
    expect(seconda.alreadyDecided).toBe(true);
    expect(seconda.conoscenzaEsistente).toBe(true);
    expect(contaConoscenzeDalBrain()).toBe(1);
    expect(elencaConoscenze()).toHaveLength(1);
    expect(trovaConoscenzaPerPattern(pattern.id)?.id).toBe(
      prima.conoscenza.id
    );
  });

  it("persiste decisione tra sessioni (localStorage)", () => {
    seedVillaClima(6);
    analizzaOsservazioni();
    const id = ottieniPattern()[0].id;
    accettaPattern(id);

    const grezzo = JSON.parse(
      localStorage.getItem("preventivai.brain.patterns")
    );
    expect(grezzo.find((p) => p.id === id).stato).toBe(
      BRAIN_PATTERN_STATI.ACCETTATO
    );

    const conoscenze = JSON.parse(
      localStorage.getItem("preventivai.brain.personalKnowledge")
    );
    expect(conoscenze).toHaveLength(1);
    expect(conoscenze[0].patternId).toBe(id);
  });

  it("rollback ripristina pattern e conoscenze se aggiornamento fallisce", () => {
    seedVillaClima(6);
    analizzaOsservazioni();
    const pattern = ottieniPattern()[0];
    const patternsPrima = ottieniPattern();
    const conoscenzePrima = elencaConoscenze();

    vi.spyOn(patternService, "aggiornaPattern").mockImplementationOnce(() => {
      throw new Error("simulazione_errore");
    });

    const risultato = accettaPattern(pattern.id);
    expect(risultato.success).toBe(false);
    expect(risultato.error).toBe("simulazione_errore");
    expect(ottieniPattern()).toEqual(patternsPrima);
    expect(elencaConoscenze()).toEqual(conoscenzePrima);
  });

  it("statisticheLearning espone conteggi Dashboard", () => {
    seedVillaClima(6);
    analizzaOsservazioni();
    const [a, b] = ottieniPattern();
    if (a) accettaPattern(a.id);
    if (b) rifiutaPattern(b.id);

    const stats = statisticheLearning();
    expect(stats.accettati).toBeGreaterThanOrEqual(1);
    expect(stats.conoscenzeDalBrain).toBeGreaterThanOrEqual(1);
    expect(stats.daConfermare + stats.accettati + stats.rifiutati).toBe(
      ottieniPattern().length
    );
  });

  it("rifiuto di pattern già accettato fallisce senza side-effect", () => {
    seedVillaClima(6);
    analizzaOsservazioni();
    const id = ottieniPattern()[0].id;
    accettaPattern(id);

    const risultato = rifiutaPattern(id);
    expect(risultato.success).toBe(false);
    expect(risultato.error).toBe("pattern_gia_accettato");
    expect(ottieniPattern().find((p) => p.id === id).stato).toBe(
      BRAIN_PATTERN_STATI.ACCETTATO
    );
    expect(contaConoscenzeDalBrain()).toBe(1);
  });

  it("aggiornaPattern supporta decision fields", () => {
    seedVillaClima(6);
    analizzaOsservazioni();
    const id = ottieniPattern()[0].id;
    const aggiornato = aggiornaPattern(id, {
      stato: BRAIN_PATTERN_STATI.PROPOSTO,
      decisionAt: 123,
      decisionBy: "utente",
    });
    expect(aggiornato.decisionAt).toBe(123);
    expect(aggiornato.stato).toBe(BRAIN_PATTERN_STATI.PROPOSTO);
  });
});
