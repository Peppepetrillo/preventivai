import { describe, expect, it } from "vitest";

import {
  giornataProgrammataConsuntivoMancante,
  haConsuntivoPerData,
} from "./giornataConsuntivoUi";

describe("giornataConsuntivoUi", () => {
  const cantiere = {
    id: "c1",
    programmazione: [
      {
        id: "g1",
        data: "29/07/2026",
        stato: "completata",
      },
    ],
    registroGiornate: [],
  };

  it("rileva assenza consuntivo per data", () => {
    expect(haConsuntivoPerData(cantiere, "29/07/2026")).toBe(false);
    expect(
      haConsuntivoPerData(
        {
          ...cantiere,
          registroGiornate: [{ id: "r1", data: "29/07/2026", oreLavorate: 4 }],
        },
        "29/07/2026"
      )
    ).toBe(true);
  });

  it("giornata completata senza consuntivo è consuntivo mancante", () => {
    expect(
      giornataProgrammataConsuntivoMancante(cantiere, cantiere.programmazione[0])
    ).toBe(true);
  });

  it("giornata programmata non è consuntivo mancante", () => {
    expect(
      giornataProgrammataConsuntivoMancante(cantiere, {
        id: "g2",
        data: "30/07/2026",
        stato: "programmata",
      })
    ).toBe(false);
  });
});
