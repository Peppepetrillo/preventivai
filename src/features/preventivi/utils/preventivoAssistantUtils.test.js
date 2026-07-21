import { describe, expect, it } from "vitest";
import {
  adattaCardAlContestoPreventivo,
  MAX_SUGGERIMENTI_PREVENTIVO,
  risolviVoceListinoDaNome,
  selezionaCardPreventivo,
} from "./preventivoAssistantUtils";

describe("preventivoAssistantUtils", () => {
  it("seleziona al massimo 3 card ad alta priorità", () => {
    const payload = {
      cards: [
        { id: "1", titolo: "A", priorita: "alta", tipo: "checklist" },
        { id: "2", titolo: "B", priorita: "alta", tipo: "materiale" },
        { id: "3", titolo: "C", priorita: "alta", tipo: "checklist" },
        { id: "4", titolo: "D", priorita: "alta", tipo: "materiale" },
        { id: "5", titolo: "E", priorita: "media", tipo: "checklist" },
      ],
    };

    const selezionate = selezionaCardPreventivo(payload, []);
    expect(selezionate).toHaveLength(MAX_SUGGERIMENTI_PREVENTIVO);
    expect(selezionate.every((c) => c.priorita === "alta")).toBe(true);
  });

  it("esclude suggerimenti già presenti nel carrello", () => {
    const payload = {
      cards: [
        { id: "1", titolo: "Punto luce", priorita: "alta", tipo: "checklist" },
        {
          id: "2",
          titolo: "Eseguire Quadro elettrico base",
          priorita: "alta",
          tipo: "checklist",
        },
        {
          id: "3",
          titolo: "Durata stimata: 5 giorni",
          priorita: "alta",
          tipo: "durata",
        },
      ],
    };

    const selezionate = selezionaCardPreventivo(payload, [
      { nome: "Punto luce" },
    ]);

    expect(selezionate.map((c) => c.id)).toEqual(["2", "3"]);
  });

  it("adatta la descrizione al contesto", () => {
    const card = adattaCardAlContestoPreventivo(
      {
        id: "1",
        titolo: "Cavo",
        descrizione: "Materiale frequente",
        tipo: "materiale",
      },
      [{ nome: "Punto luce" }]
    );

    expect(card.descrizione).toContain('Hai aggiunto "Punto luce"');
    expect(card.descrizione).toContain("Materiale frequente");
  });

  it("risolve voci listino per nome esatto o contenuto", () => {
    const listino = [
      { id: "1", nome: "Punto luce", prezzo: 45 },
      { id: "2", nome: "Quadro elettrico base", prezzo: 320 },
    ];

    expect(risolviVoceListinoDaNome("Punto luce", listino)?.id).toBe("1");
    expect(
      risolviVoceListinoDaNome("Eseguire Quadro elettrico base", listino)?.id
    ).toBe("2");
    expect(risolviVoceListinoDaNome("Inesistente", listino)).toBeNull();
  });
});
