import { describe, expect, it } from "vitest";

import {
  condizioniPersonaliSoddisfatte,
  conoscenzaPersonaleToRegola,
  costruisciPercheBrain,
  mergeKnowledgeRules,
  statisticheMerge,
} from "./knowledgeMergeService";
import { KNOWLEDGE_LAYER, KNOWLEDGE_ORIGINE } from "./knowledgePriorityService";
import { knowledgeRules } from "./knowledgeRules";
import { runKnowledgeEngine } from "./knowledgeEngine";

function conoscenzaCancello(overrides = {}) {
  return {
    id: "pk-cancello-1",
    titolo: "VILLA · >150 mq · CANCELLO",
    categoria: "Immobile",
    descrizione: "Predisposizione cancello",
    origine: "brain",
    patternId: "pat-1",
    affidabilita: 94,
    osservazioni: 18,
    payload: {
      condizioni: {
        tipoImmobile: "villa",
        fasciaMq: "150+",
        fasciaMqLabel: ">150 mq",
        livelli: 2,
        livelloImpianto: "premium",
      },
      suggerimento: {
        tipo: "extra",
        chiave: "automazioneCancello",
        testo: "Predisposizione cancello",
      },
    },
    ...overrides,
  };
}

describe("knowledgeMergeService", () => {
  it("merge conserva tutte le regole base e aggiunge personali", () => {
    const regole = mergeKnowledgeRules({
      base: knowledgeRules,
      personali: [conoscenzaCancello()],
    });
    const stats = statisticheMerge(regole);
    expect(stats.base).toBe(knowledgeRules.length);
    expect(stats.personali).toBe(1);
    expect(stats.totale).toBe(knowledgeRules.length + 1);
    expect(regole.some((r) => r.id === "RULE_001")).toBe(true);
    expect(regole.some((r) => r.id === "PK_pk-cancello-1")).toBe(true);
  });

  it("non crea duplicati di conoscenze personali con stesso id", () => {
    const regole = mergeKnowledgeRules({
      base: [],
      personali: [conoscenzaCancello(), conoscenzaCancello()],
    });
    expect(regole).toHaveLength(1);
  });

  it("condizioniPersonaliSoddisfatte filtra per contesto", () => {
    const condizioni = conoscenzaCancello().payload.condizioni;
    expect(
      condizioniPersonaliSoddisfatte(
        {
          tipoImmobile: "villa",
          mq: 180,
          livelli: 2,
          livelloImpianto: "premium",
        },
        condizioni
      )
    ).toBe(true);
    expect(
      condizioniPersonaliSoddisfatte(
        {
          tipoImmobile: "appartamento",
          mq: 180,
          livelli: 2,
          livelloImpianto: "premium",
        },
        condizioni
      )
    ).toBe(false);
  });

  it("conoscenza personale aggiunge suggerimento BRAIN senza togliere base", () => {
    const regole = mergeKnowledgeRules({
      base: knowledgeRules,
      personali: [conoscenzaCancello()],
    });
    const proposta = runKnowledgeEngine(
      {
        tipoImmobile: "villa",
        superficieMq: 180,
        numeroLivelli: "2",
        livelloImpianto: "premium",
      },
      regole
    );

    const titoli = proposta.suggerimenti.map((s) => s.titolo);
    expect(titoli).toContain("Quadro 36 moduli");
    expect(titoli).toContain("Predisposizione cancello");

    const quadro = proposta.suggerimenti.find(
      (s) => s.catalogoId === "QUADRO_ELETTRICO"
    );
    expect(quadro.origine).toBe(KNOWLEDGE_ORIGINE.BASE);

    const cancello = proposta.suggerimenti.find(
      (s) => s.catalogoId === "CANCELLO"
    );
    // Villa base ha già CANCELLO → rafforzamento Brain
    expect(cancello.origine).toBe(KNOWLEDGE_ORIGINE.BASE);
    expect(cancello.rafforzatoDalBrain).toBe(true);
    expect(cancello.osservazioni).toBe(18);

    expect(proposta.quadroSuggerito).toBe("Quadro 36 moduli");
    expect(
      proposta.regoleApplicate.some((r) => r.origine === KNOWLEDGE_ORIGINE.BASE)
    ).toBe(true);
  });

  it("personale può specializzare con suggerimento nuovo", () => {
    const speciale = conoscenzaCancello({
      id: "pk-speciale",
      payload: {
        condizioni: {
          tipoImmobile: "villa",
          fasciaMq: "150+",
          livelli: 2,
          livelloImpianto: "premium",
        },
        suggerimento: {
          catalogoId: "IRRIGAZIONE",
          testo: "Predisposizione irrigazione giardino",
        },
      },
      osservazioni: 12,
      affidabilita: 88,
    });

    const regole = mergeKnowledgeRules({
      base: knowledgeRules,
      personali: [speciale],
    });
    const proposta = runKnowledgeEngine(
      {
        tipoImmobile: "villa",
        superficieMq: 200,
        numeroLivelli: "2",
        livelloImpianto: "premium",
      },
      regole
    );

    const voce = proposta.suggerimenti.find(
      (s) => s.catalogoId === "IRRIGAZIONE"
    );
    expect(voce).toMatchObject({
      origine: KNOWLEDGE_ORIGINE.BRAIN,
      affidabilita: 88,
      osservazioni: 12,
    });
    expect(voce.perche).toContain("12 lavori simili");
    expect(voce.labelOrigine).toBe("Basato sul tuo metodo di lavoro");
  });

  it("personale non può eliminare regole base dal merge", () => {
    const regole = mergeKnowledgeRules({
      base: knowledgeRules,
      personali: [],
    });
    expect(regole.filter((r) => r.layer === KNOWLEDGE_LAYER.BASE)).toHaveLength(
      knowledgeRules.length
    );
  });

  it("costruisciPercheBrain formatta il messaggio", () => {
    expect(costruisciPercheBrain(18)).toBe(
      "Negli ultimi 18 lavori simili hai sempre aggiunto questa lavorazione."
    );
  });

  it("performance: merge di molte conoscenze personali è veloce", () => {
    const molte = Array.from({ length: 500 }, (_, i) =>
      conoscenzaCancello({
        id: `pk-${i}`,
        payload: {
          condizioni: { tipoImmobile: "ufficio" },
          // Solo ID Catalogo — testo libero senza match non diventa regola
          suggerimento: { catalogoId: "CANCELLO", quantita: 1 },
        },
      })
    );

    const t0 = performance.now();
    const regole = mergeKnowledgeRules({
      base: knowledgeRules,
      personali: molte,
    });
    const proposta = runKnowledgeEngine(
      { tipoImmobile: "ufficio", superficieMq: 80 },
      regole
    );
    const elapsed = performance.now() - t0;

    expect(regole.length).toBe(knowledgeRules.length + 500);
    expect(proposta.suggerimenti.length).toBeGreaterThan(0);
    expect(elapsed).toBeLessThan(250);
  });

  it("conoscenza personale senza ID Catalogo risolvibile viene scartata", () => {
    const regola = conoscenzaPersonaleToRegola(
      conoscenzaCancello({
        titolo: "Custom",
        descrizione: "",
        payload: {
          condizioni: {},
          suggerimento: { testo: "Suggerimento inventato senza catalogo" },
        },
      })
    );
    expect(regola).toBeNull();
  });

  it("conoscenzaPersonaleToRegola ignora voci senza titolo utile", () => {
    expect(
      conoscenzaPersonaleToRegola({
        id: "x",
        titolo: "",
        descrizione: "",
        payload: {},
      })
    ).toBeNull();
  });
});
