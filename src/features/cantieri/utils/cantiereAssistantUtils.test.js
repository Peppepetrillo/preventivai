import { describe, expect, it } from "vitest";
import {
  etichettaAzioneCantiere,
  firmaCantierePerAssistant,
  MAX_SUGGERIMENTI_CANTIERE,
  selezionaCardCantiere,
} from "./cantiereAssistantUtils";

describe("cantiereAssistantUtils", () => {
  it("limita a 4 card", () => {
    const cards = Array.from({ length: 6 }, (_, i) => ({ id: String(i) }));
    expect(selezionaCardCantiere({ cards })).toHaveLength(
      MAX_SUGGERIMENTI_CANTIERE
    );
  });

  it("cambia firma quando cambiano foto/note/stato", () => {
    const base = {
      id: 1,
      stato: "Da iniziare",
      foto: [],
      note: "",
      materiali: [],
      checklist: [],
    };

    const a = firmaCantierePerAssistant(base);
    const b = firmaCantierePerAssistant({
      ...base,
      foto: [{ id: 1 }],
      stato: "In corso",
    });

    expect(a).not.toBe(b);
  });

  it("mappa le etichette azione", () => {
    expect(etichettaAzioneCantiere({ tipo: "documentazione" })).toBe(
      "Aggiungi foto"
    );
    expect(etichettaAzioneCantiere({ tipo: "nota" })).toBe("Aggiungi nota");
    expect(etichettaAzioneCantiere({ tipo: "economico" })).toBe("Segna saldo");
    expect(etichettaAzioneCantiere({ tipo: "durata" })).toBe("Apri dettagli");
  });
});
