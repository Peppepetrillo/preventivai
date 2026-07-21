import { describe, expect, it } from "vitest";

import { chiaveUsoDaLavorazione } from "./lavorazioniUsage";

describe("chiaveUsoDaLavorazione", () => {
  it("estrae la chiave listino da id con timestamp", () => {
    expect(
      chiaveUsoDaLavorazione({
        id: "punto-luce-1710000000000",
        nome: "Punto luce",
      })
    ).toBe("punto-luce");
  });

  it("estrae la chiave da id kit", () => {
    expect(
      chiaveUsoDaLavorazione({
        id: "kit-punto-presa",
        nome: "Punto presa",
      })
    ).toBe("punto-presa");
  });

  it("usa il nome se l'id non è riconosciuto", () => {
    expect(
      chiaveUsoDaLavorazione({
        id: "custom",
        nome: "Lavoro extra",
      })
    ).toBe("Lavoro extra");
  });
});
