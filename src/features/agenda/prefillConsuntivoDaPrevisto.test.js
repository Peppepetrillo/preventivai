import { describe, expect, it } from "vitest";

import {
  prefillConsuntivoDaGiornataProgrammata,
  prefillConsuntivoDaPrevisto,
} from "./prefillConsuntivoDaPrevisto";

describe("prefillConsuntivoDaPrevisto UX-9.0", () => {
  it("precompila da giornata prevista", () => {
    const prefill = prefillConsuntivoDaPrevisto({
      id: "c1:g1",
      kind: "lavoro-giornata",
      cantiereId: "c1",
      scheduledDate: "29/07/2026",
      orePreviste: 6,
      attivitaGiornata: "Tracce",
    });

    expect(prefill).toEqual({
      cantiereId: "c1",
      data: "29/07/2026",
      operaiTesto: "Io",
      oreLavorate: "6",
      attivita: "Tracce",
      note: "",
    });
  });

  it("ignora lavori non previsti", () => {
    expect(
      prefillConsuntivoDaPrevisto({ id: "c1", kind: "lavoro" })
    ).toBeNull();
  });
});

describe("prefillConsuntivoDaGiornataProgrammata UX-9.3", () => {
  it("precompila da riga programmazione cantiere", () => {
    expect(
      prefillConsuntivoDaGiornataProgrammata(
        { id: "c1" },
        {
          data: "29/07/2026",
          orePreviste: 4,
          attivita: "Tracce",
        }
      )
    ).toEqual({
      cantiereId: "c1",
      data: "29/07/2026",
      operaiTesto: "Io",
      oreLavorate: "4",
      attivita: "Tracce",
      note: "",
    });
  });
});
