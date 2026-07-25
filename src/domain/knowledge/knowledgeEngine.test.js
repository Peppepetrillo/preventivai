import { describe, expect, it } from "vitest";

import {
  accumulaSuggerimento,
  fondiDatiRegola,
  normalizzaInputKnowledge,
  normalizzaSuggerimento,
  ordinaRegolePerPriority,
  runKnowledgeEngine,
  consultaConoscenzaTecnica,
} from "./knowledgeEngine";
import { knowledgeRules } from "./knowledgeRules";
import { KNOWLEDGE_ORIGINE, prioritaEffettiva } from "./knowledgePriorityService";
import { mergeKnowledgeRules } from "./knowledgeMergeService";
import { CATALOGO_IDS } from "./knowledgeCatalogRefs";

describe("knowledgeEngine", () => {
  it("normalizza form UI verso input regole KE 2.0", () => {
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
      climatizzazione: true,
      domotica: true,
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
    expect(proposta.quadroCatalogoId).toBe(CATALOGO_IDS.QUADRO_ELETTRICO);
    expect(proposta.puntiStimati).toBe(180);
    expect(proposta.regoleApplicate.map((r) => r.id)).toEqual(
      expect.arrayContaining(["RULE_001", "RULE_002", "RULE_003"])
    );
  });

  it("accumula suggerimenti Catalogo senza duplicati di id", () => {
    const proposta = runKnowledgeEngine({
      superficieMq: 120,
      numeroLivelli: "2",
      tipoImmobile: "villa",
      extra: { predisposizioneClima: true, domotica: true },
    });

    expect(proposta.puntiStimati).toBe(120);
    expect(proposta.quadroSuggerito).toBe("Quadro 24 moduli");
    const ids = proposta.suggerimenti.map((s) => s.catalogoId || s.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        CATALOGO_IDS.PUNTO_IMPIANTO,
        CATALOGO_IDS.QUADRO_ELETTRICO,
        CATALOGO_IDS.CLIMA,
        CATALOGO_IDS.GATEWAY,
        CATALOGO_IDS.BUS,
        CATALOGO_IDS.ALIMENTATORE,
        CATALOGO_IDS.DISTRIBUZIONE_LINEE_PIANO,
        CATALOGO_IDS.CANCELLO,
        CATALOGO_IDS.ILLUMINAZIONE_ESTERNA,
        CATALOGO_IDS.CITOFONO,
      ])
    );
    expect(new Set(ids).size).toBe(ids.length);
    expect(
      proposta.suggerimenti.every((s) => s.origine === KNOWLEDGE_ORIGINE.BASE)
    ).toBe(true);
  });

  it("KE 2.0: caratteristiche indipendenti → catalogoId senza duplicati", () => {
    const proposta = runKnowledgeEngine({
      superficieMq: 80,
      tipoImmobile: "appartamento",
      climatizzazione: true,
      reteDati: true,
      impiantoTv: true,
      allarme: true,
      cancelloAutomatico: true,
      cucina: "induzione",
      videocitofono: true,
    });

    const ids = proposta.suggerimenti.map((s) => s.catalogoId || s.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        CATALOGO_IDS.PUNTO_IMPIANTO,
        CATALOGO_IDS.QUADRO_12_MODULI,
        CATALOGO_IDS.CLIMA,
        CATALOGO_IDS.PUNTO_DATI,
        CATALOGO_IDS.PUNTO_TV,
        CATALOGO_IDS.ALLARME,
        CATALOGO_IDS.CANCELLO,
        CATALOGO_IDS.LINEA_INDUZIONE,
        CATALOGO_IDS.VIDEOCITOFONO,
      ])
    );
    expect(new Set(ids).size).toBe(ids.length);
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
          suggerimenti: [{ id: CATALOGO_IDS.ALLARME, quantita: 1 }],
          dati: {},
        }),
      },
    ];

    expect(runKnowledgeEngine({ mq: 10 }, regole)).toMatchObject({
      puntiStimati: null,
      suggerimenti: [],
      regoleApplicate: [],
      quadroSuggerito: null,
      quadroCatalogoId: null,
      quadroModuli: null,
    });
    const out = runKnowledgeEngine({ mq: 10 }, regole);
    expect(out.schedeTecniche.map((s) => s.id)).toContain("BT_PUNTO_IMPIANTO");
  });

  it("fondiDatiRegola non sovrascrive chiavi già presenti", () => {
    expect(
      fondiDatiRegola(
        { quadroSuggerito: CATALOGO_IDS.QUADRO_ELETTRICO },
        { quadroSuggerito: "QUADRO_HACK", puntiStimati: 10 }
      )
    ).toEqual({
      quadroSuggerito: CATALOGO_IDS.QUADRO_ELETTRICO,
      puntiStimati: 10,
    });
  });

  it("normalizzaSuggerimento mappa legacy stringa a Catalogo", () => {
    const voce = normalizzaSuggerimento("Quadro 36 moduli", {
      descrizione: "Suggerisce quadro 36 moduli oltre 150 mq.",
      knowledgeOrigine: KNOWLEDGE_ORIGINE.BASE,
    });
    expect(voce).toMatchObject({
      id: CATALOGO_IDS.QUADRO_ELETTRICO,
      catalogoId: CATALOGO_IDS.QUADRO_ELETTRICO,
      titolo: "Quadro elettrico",
      origine: KNOWLEDGE_ORIGINE.BASE,
    });
  });

  it("accumulaSuggerimento rafforza Base con Brain senza sostituire", () => {
    const lista = [
      {
        id: CATALOGO_IDS.CANCELLO,
        catalogoId: CATALOGO_IDS.CANCELLO,
        titolo: "Predisposizione cancello",
        quantita: 1,
        origine: KNOWLEDGE_ORIGINE.BASE,
        rafforzatoDalBrain: false,
      },
    ];
    accumulaSuggerimento(lista, {
      id: CATALOGO_IDS.CANCELLO,
      catalogoId: CATALOGO_IDS.CANCELLO,
      titolo: "Predisposizione cancello",
      quantita: 1,
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
          suggerimenti: [
            { id: CATALOGO_IDS.QUADRO_ELETTRICO, quantita: 1, meta: { moduli: 36 } },
          ],
          dati: {
            quadroSuggerito: CATALOGO_IDS.QUADRO_ELETTRICO,
            quadroModuli: 36,
            puntiStimati: 180,
          },
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
          suggerimenti: [{ id: "IRRIGAZIONE", quantita: 1 }],
          dati: { quadroSuggerito: "QUADRO_HACK", puntiStimati: 1 },
        }),
      },
    ];

    const proposta = runKnowledgeEngine({ mq: 180 }, regole);
    expect(proposta.quadroSuggerito).toBe("Quadro 36 moduli");
    expect(proposta.puntiStimati).toBe(180);
    expect(proposta.suggerimenti.map((s) => s.catalogoId)).toContain(
      "IRRIGAZIONE"
    );
  });

  it("consulta la Base Tecnica senza alterare regole/pricing", () => {
    const schede = consultaConoscenzaTecnica({
      cucina: "induzione",
      superficieMq: 60,
      tipoImmobile: "appartamento",
    });
    expect(schede.map((s) => s.id)).toContain("BT_CUCINA_INDUZIONE");

    const proposta = runKnowledgeEngine({
      superficieMq: 60,
      tipoImmobile: "appartamento",
      cucina: "induzione",
    });
    expect(proposta.schedeTecniche.map((s) => s.id)).toContain(
      "BT_CUCINA_INDUZIONE"
    );
    // I suggerimenti restano determinati dalle regole, non dalle schede
    expect(proposta.suggerimenti.every((s) => s.catalogoId || s.id)).toBe(true);
  });
});
