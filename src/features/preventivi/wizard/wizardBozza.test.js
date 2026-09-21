import { describe, expect, it } from "vitest";

import { CONDIZIONI_DEFAULT } from "./wizardConfig";
import { wizardHaBozzaConDati } from "./wizardBozza";

describe("wizardHaBozzaConDati", () => {
  it("bozza vuota → false", () => {
    expect(
      wizardHaBozzaConDati({
        stepId: "cliente",
        cliente: "",
        lavorazioni: [],
        condizioni: { ...CONDIZIONI_DEFAULT },
        contesto: {},
      })
    ).toBe(false);
  });

  it("cliente compilato → true", () => {
    expect(wizardHaBozzaConDati({ cliente: "Rossi" })).toBe(true);
  });

  it("lavorazioni → true", () => {
    expect(
      wizardHaBozzaConDati({
        cliente: "",
        lavorazioni: [{ id: "1", nome: "Quadro" }],
      })
    ).toBe(true);
  });

  it("note condizioni → true", () => {
    expect(
      wizardHaBozzaConDati({
        condizioni: { ...CONDIZIONI_DEFAULT, note: "Acconto 30%" },
      })
    ).toBe(true);
  });
});
