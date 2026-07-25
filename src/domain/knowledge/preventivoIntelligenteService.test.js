import { beforeEach, describe, expect, it } from "vitest";

import { generaPropostaPreventivo } from "./preventivoIntelligenteService";
import { KNOWLEDGE_ORIGINE } from "./knowledgePriorityService";
import { resetConoscenze } from "../brain/personalKnowledgeRepository";

describe("preventivoIntelligenteService", () => {
  beforeEach(() => {
    localStorage.clear();
    resetConoscenze();
  });

  it("restituisce success e proposta dal Knowledge Engine", () => {
    const risultato = generaPropostaPreventivo({
      superficieMq: 160,
      numeroLivelli: "1",
      tipoImmobile: "appartamento",
      extra: {},
    });

    expect(risultato.success).toBe(true);
    expect(risultato.proposta).toMatchObject({
      puntiStimati: 160,
      quadroSuggerito: "Quadro 36 moduli",
    });
    expect(risultato.proposta.regoleApplicate.length).toBeGreaterThan(0);
    expect(
      risultato.proposta.suggerimenti.map((s) => s.titolo)
    ).toContain("Quadro 36 moduli");
    expect(
      risultato.proposta.suggerimenti.find(
        (s) => s.titolo === "Quadro 36 moduli"
      ).origine
    ).toBe(KNOWLEDGE_ORIGINE.BASE);
  });

  it("integra conoscenze personali iniettate senza toccare le base", () => {
    const risultato = generaPropostaPreventivo(
      {
        tipoImmobile: "villa",
        superficieMq: 180,
        numeroLivelli: "2",
        livelloImpianto: "premium",
      },
      {
        conoscenzePersonali: [
          {
            id: "pk-irrigazione",
            titolo: "Irrigazione",
            affidabilita: 91,
            osservazioni: 18,
            payload: {
              condizioni: {
                tipoImmobile: "villa",
                fasciaMq: "150+",
                livelli: 2,
                livelloImpianto: "premium",
              },
              suggerimento: {
                testo: "Predisposizione irrigazione giardino",
              },
            },
          },
        ],
      }
    );

    const brain = risultato.proposta.suggerimenti.find(
      (s) => s.titolo === "Predisposizione irrigazione giardino"
    );
    expect(brain).toMatchObject({
      origine: KNOWLEDGE_ORIGINE.BRAIN,
      affidabilita: 91,
      osservazioni: 18,
    });
    expect(brain.perche).toContain("18 lavori simili");
    expect(risultato.proposta.quadroSuggerito).toBe("Quadro 36 moduli");
  });

  it("non crea preventivo né lavorazioni — solo proposta knowledge", () => {
    const risultato = generaPropostaPreventivo(
      { mq: 50 },
      { conoscenzePersonali: [] }
    );

    expect(risultato.success).toBe(true);
    expect(risultato.proposta.puntiStimati).toBe(50);
    expect(risultato.proposta.suggerimenti).toEqual([]);
    expect(risultato.proposta.quadroSuggerito).toBeNull();
    expect(risultato.proposta.regoleApplicate).toEqual([
      {
        id: "RULE_001",
        nome: "Stima punti impianto",
        origine: KNOWLEDGE_ORIGINE.BASE,
        layer: "BASE",
      },
    ]);
    expect(risultato.proposta.lavorazioni).toBeUndefined();
    expect(risultato.preventivo).toBeUndefined();
  });
});
