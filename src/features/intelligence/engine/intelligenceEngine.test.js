import { beforeEach, describe, expect, it } from "vitest";

import { STATI_PREVENTIVO } from "../../../domain/workflow";
import { INTELLIGENCE_RULES } from "../rules";
import { createSuggestion } from "../engine/createSuggestion";
import { PRIORITA, MAX_SUGGERIMENTI } from "../engine/constants";
import {
  dedupeSuggestions,
  filterSessionSuggestions,
  sortSuggestionsByPriority,
} from "../engine/prioritize";
import { runIntelligenceEngine } from "../engine/runIntelligenceEngine";
import {
  ignoraSuggerimentoSessione,
  resetSessioneIntelligence,
  risolviSuggerimentoSessione,
} from "../engine/sessionStore";

describe("intelligence engine", () => {
  beforeEach(() => {
    resetSessioneIntelligence();
  });

  it("ordina per priorità crescente", () => {
    const ordinati = sortSuggestionsByPriority([
      createSuggestion({
        id: "b",
        ruleId: "x",
        priority: PRIORITA.FOTO,
        message: "foto",
      }),
      createSuggestion({
        id: "a",
        ruleId: "y",
        priority: PRIORITA.MATERIALE,
        message: "mat",
      }),
    ]);
    expect(ordinati.map((s) => s.id)).toEqual(["a", "b"]);
  });

  it("deduplica per id", () => {
    const a = createSuggestion({
      id: "same",
      ruleId: "r",
      priority: 1,
      message: "uno",
    });
    const b = createSuggestion({
      id: "same",
      ruleId: "r",
      priority: 2,
      message: "due",
    });
    expect(dedupeSuggestions([a, b])).toHaveLength(1);
    expect(dedupeSuggestions([a, b])[0].message).toBe("uno");
  });

  it("filtra ignorati e risolti e limita a 3", () => {
    const lista = [1, 2, 3, 4].map((n) =>
      createSuggestion({
        id: `s${n}`,
        ruleId: "r",
        priority: n,
        message: `m${n}`,
      })
    );
    const filtrati = filterSessionSuggestions(lista, {
      ignored: ["s1"],
      resolved: ["s2"],
      massimo: MAX_SUGGERIMENTI,
    });
    expect(filtrati.map((s) => s.id)).toEqual(["s3", "s4"]);
  });

  it("sessione: ignorato non ricompare", () => {
    const context = {
      scope: "cantiere",
      cantiere: {
        id: "c1",
        stato: "In corso",
        materiali: [{ id: "m1", nome: "Cavo", acquistato: false }],
        checklist: [],
        foto: [{ id: "f1" }],
        preventivoOriginaleTotale: 0,
      },
      cantieri: [],
      preventivi: [],
    };

    const prima = runIntelligenceEngine(context, INTELLIGENCE_RULES, {});
    expect(prima.some((s) => s.ruleId === "materiale-da-comprare")).toBe(true);

    const id = prima.find((s) => s.ruleId === "materiale-da-comprare").id;
    const sessione = ignoraSuggerimentoSessione(id);
    const dopo = runIntelligenceEngine(context, INTELLIGENCE_RULES, sessione);
    expect(dopo.some((s) => s.id === id)).toBe(false);
  });

  it("sessione: risolto non ricompare", () => {
    const context = {
      scope: "cantiere",
      cantiere: {
        id: "c1",
        stato: "In corso",
        checklist: [{ id: "a", completata: false }],
        materiali: [],
        foto: [{ id: "f1" }],
        preventivoOriginaleTotale: 0,
      },
      cantieri: [],
      preventivi: [],
    };
    const prima = runIntelligenceEngine(context, INTELLIGENCE_RULES, {});
    const voce = prima.find((s) => s.ruleId === "checklist-incompleta");
    expect(voce).toBeTruthy();
    const sessione = risolviSuggerimentoSessione(voce.id);
    const dopo = runIntelligenceEngine(context, INTELLIGENCE_RULES, sessione);
    expect(dopo.some((s) => s.id === voce.id)).toBe(false);
  });

  it("rispetta priorità e max 3 su home", () => {
    const now = new Date("2026-07-28T12:00:00");
    const context = {
      scope: "home",
      now,
      giorniPreventivoInviato: 7,
      cantieri: [
        {
          id: "c1",
          stato: "In corso",
          materiali: [{ id: "m", acquistato: false }],
          checklist: [{ id: "x", completata: false }],
          foto: [],
          preventivoOriginaleTotale: 500,
          incassato: 0,
          preventivoId: 10,
          varianti: [
            { id: "v1", titolo: "Extra", stato: "proposta" },
          ],
        },
      ],
      preventivi: [
        {
          id: 10,
          stato: STATI_PREVENTIVO.CONVERTITO,
          lavorazioni: [],
        },
        {
          id: 20,
          stato: STATI_PREVENTIVO.INVIATO,
          inviatoAt: new Date("2026-07-01").getTime(),
        },
      ],
    };

    const out = runIntelligenceEngine(context, INTELLIGENCE_RULES, {});
    expect(out.length).toBeLessThanOrEqual(3);
    expect(out[0].ruleId).toBe("materiale-da-comprare");
    expect(out[1].ruleId).toBe("checklist-incompleta");
  });

  it("preventivo inviato scaduto dopo X giorni", () => {
    const out = runIntelligenceEngine(
      {
        scope: "home",
        now: new Date("2026-07-28"),
        giorniPreventivoInviato: 7,
        cantieri: [],
        preventivi: [
          {
            id: "p1",
            stato: STATI_PREVENTIVO.INVIATO,
            inviatoAt: new Date("2026-07-01").getTime(),
          },
        ],
      },
      INTELLIGENCE_RULES,
      {}
    );
    expect(out.some((s) => s.ruleId === "preventivo-inviato-scaduto")).toBe(
      true
    );
    expect(out[0].message).toMatch(/contattare il cliente/i);
  });
});
