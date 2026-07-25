import { describe, expect, it } from "vitest";

import {
  accumulaSuggerimento,
  fondiDatiRegola,
  normalizzaInputKnowledge,
  normalizzaSuggerimento,
  ordinaRegolePerPriority,
  runKnowledgeEngine,
} from "./knowledgeEngine";
import { knowledgeRules } from "./knowledgeRules";
import { KNOWLEDGE_ORIGINE, prioritaEffettiva } from "./knowledgePriorityService";
import { mergeKnowledgeRules } from "./knowledgeMergeService";

describe("knowledgeEngine", () => {
  it("normalizza form UI verso input regole", () => {
    expect(
      normalizzaInputKnowledge({
        superficieMq: 110,
        numeroLivelli: "4+",
        tipoImmobile: "villa",
        livelloImpianto: "premium",
        extra: { predisposizioneClima: true, domotica: true },
      })
    ).toMatchObject({
      mq: 110,
      livelli: 4,
      tipoImmobile: "villa",
      livelloImpianto: "premium",
      extra: { clima: true, domotica: true },
    });
  });

  it("ordina le regole per priority effettiva decrescente", () => {
    const ordinate = ordinaRegolePerPriority(
      mergeKnowledgeRules({ base: knowledgeRules, personali: [] })
    );
    for (let i = 1; i < ordinate.length; i += 1) {
      expect(prioritaEffettiva(ordinate[i - 1])).toBeGreaterThanOrEqual(
        prioritaEffettiva(ordinate[i])
      );
    }
  });

  it("first-wins sui dati: RULE_003 vince su RULE_002 oltre 150 mq", () => {
    const proposta = runKnowledgeEngine({ mq: 180 });
    expect(proposta.quadroSuggerito).toBe("Quadro 36 moduli");
    expect(proposta.puntiStimati).toBe(180);
    expect(proposta.regoleApplicate.map((r) => r.id)).toEqual(
      expect.arrayContaining(["RULE_001", "RULE_002", "RULE_003"])
    );
  });

  it("accumula suggerimenti da più regole senza duplicati di titolo", () => {
    const proposta = runKnowledgeEngine({
      superficieMq: 120,
      numeroLivelli: "2",
      tipoImmobile: "villa",
      extra: { predisposizioneClima: true, domotica: true },
    });

    expect(proposta.puntiStimati).toBe(120);
    expect(proposta.quadroSuggerito).toBe("Quadro 24 moduli");
    const titoli = proposta.suggerimenti.map((s) => s.titolo);
    expect(titoli).toEqual(
      expect.arrayContaining([
        "Quadro 24 moduli",
        "Predisposizione climatizzazione",
        "Gateway",
        "Bus",
        "Alimentatore",
        "Distribuzione linee per piano",
        "Predisposizione cancello",
        "Illuminazione esterna",
        "Citofono/Videocitofono",
      ])
    );
    expect(new Set(titoli).size).toBe(titoli.length);
    expect(
      proposta.suggerimenti.every((s) => s.origine === KNOWLEDGE_ORIGINE.BASE)
    ).toBe(true);
  });

  it("ignora regole disabled", () => {
    const regole = [
      {
        id: "OFF",
        nome: "Off",
        enabled: false,
        priority: 999,
        execute: () => ({
          applicata: true,
          suggerimenti: ["Non deve apparire"],
          dati: {},
        }),
      },
    ];

    expect(runKnowledgeEngine({ mq: 10 }, regole)).toEqual({
      puntiStimati: null,
      suggerimenti: [],
      regoleApplicate: [],
      quadroSuggerito: null,
    });
  });

  it("fondiDatiRegola non sovrascrive chiavi già presenti", () => {
    expect(
      fondiDatiRegola(
        { quadroSuggerito: "Quadro 36 moduli" },
        { quadroSuggerito: "Quadro 24 moduli", puntiStimati: 10 }
      )
    ).toEqual({
      quadroSuggerito: "Quadro 36 moduli",
      puntiStimati: 10,
    });
  });

  it("normalizzaSuggerimento assegna origine BASE alle stringhe", () => {
    const voce = normalizzaSuggerimento("Quadro 36 moduli", {
      descrizione: "Suggerisce quadro 36 moduli oltre 150 mq.",
      knowledgeOrigine: KNOWLEDGE_ORIGINE.BASE,
    });
    expect(voce).toMatchObject({
      titolo: "Quadro 36 moduli",
      origine: KNOWLEDGE_ORIGINE.BASE,
      labelOrigine: "Conoscenza Base",
    });
  });

  it("accumulaSuggerimento rafforza Base con Brain senza sostituire", () => {
    const lista = [
      {
        titolo: "Predisposizione cancello",
        origine: KNOWLEDGE_ORIGINE.BASE,
        rafforzatoDalBrain: false,
      },
    ];
    accumulaSuggerimento(lista, {
      titolo: "Predisposizione cancello",
      origine: KNOWLEDGE_ORIGINE.BRAIN,
      affidabilita: 94,
      osservazioni: 18,
      perche: "Negli ultimi 18 lavori simili hai sempre aggiunto questa lavorazione.",
    });
    expect(lista).toHaveLength(1);
    expect(lista[0].origine).toBe(KNOWLEDGE_ORIGINE.BASE);
    expect(lista[0].rafforzatoDalBrain).toBe(true);
    expect(lista[0].osservazioni).toBe(18);
  });

  it("regola personale non sovrascrive dati strutturali base", () => {
    const regole = [
      {
        id: "BASE_Q",
        nome: "Base",
        layer: "BASE",
        knowledgeOrigine: KNOWLEDGE_ORIGINE.BASE,
        enabled: true,
        priority: 100,
        execute: () => ({
          applicata: true,
          suggerimenti: ["Quadro 36 moduli"],
          dati: { quadroSuggerito: "Quadro 36 moduli", puntiStimati: 180 },
        }),
      },
      {
        id: "PK_BAD",
        nome: "Personale aggressiva",
        layer: "PERSONALI",
        knowledgeOrigine: KNOWLEDGE_ORIGINE.BRAIN,
        enabled: true,
        priority: 999,
        execute: () => ({
          applicata: true,
          suggerimenti: ["Tentativo override"],
          dati: { quadroSuggerito: "Quadro hack", puntiStimati: 1 },
        }),
      },
    ];

    const proposta = runKnowledgeEngine({ mq: 180 }, regole);
    expect(proposta.quadroSuggerito).toBe("Quadro 36 moduli");
    expect(proposta.puntiStimati).toBe(180);
    expect(proposta.suggerimenti.map((s) => s.titolo)).toContain(
      "Tentativo override"
    );
  });
});
