import { describe, expect, it } from "vitest";

import {
  aggiungiGiornataLavorativa,
  aggiornaGiornataLavorativa,
  eliminaGiornataLavorativa,
  formattaNomiOperai,
  leggiRegistroGiornate,
  normalizzaGiornataLavorativa,
  normalizzaNomiOperai,
  registroPerGiorno,
  riepilogoRegistroCantiere,
} from "./registroGiornateService";

describe("registroGiornateService UX-7.4", () => {
  const cantiereBase = { id: "napoli", nome: "Cantiere Napoli" };

  it("normalizza giornata con operai nominativi e ore lavorate", () => {
    const g = normalizzaGiornataLavorativa(
      {
        data: "25/08/2026",
        operai: ["Marco"],
        oreLavorate: 8,
        attivita: "Tracce",
        note: "Fatte le tracce del piano terra",
      },
      "napoli"
    );
    expect(g.cantiereId).toBe("napoli");
    expect(g.operai).toEqual(["Marco"]);
    expect(g.oreLavorate).toBe(8);
    expect(g.attivita).toBe("Tracce");
    expect(g.note).toContain("tracce");
  });

  it("parse operai da stringa libera", () => {
    expect(normalizzaNomiOperai("Marco + Luca")).toEqual(["Marco", "Luca"]);
    expect(formattaNomiOperai(["Marco", "Luca"])).toBe("Marco + Luca");
  });

  it("rifiuta senza data", () => {
    expect(normalizzaGiornataLavorativa({ operai: ["Marco"] })).toBeNull();
  });

  it("CRUD e ordine per data", () => {
    let c = aggiungiGiornataLavorativa(cantiereBase, {
      id: "r2",
      data: "26/08/2026",
      operai: ["Marco", "Luca"],
      oreLavorate: 7,
      attivita: "Tubazioni",
    });
    c = aggiungiGiornataLavorativa(c, {
      id: "r1",
      data: "25/08/2026",
      operai: ["Marco"],
      oreLavorate: 8,
      attivita: "Tracce",
    });

    expect(leggiRegistroGiornate(c).map((g) => g.id)).toEqual(["r1", "r2"]);

    c = aggiornaGiornataLavorativa(c, "r1", { note: "Aggiornato" });
    expect(leggiRegistroGiornate(c)[0].note).toBe("Aggiornato");

    c = eliminaGiornataLavorativa(c, "r1");
    expect(leggiRegistroGiornate(c)).toHaveLength(1);
  });

  it("filtra per giorno e calcola totali", () => {
    let c = aggiungiGiornataLavorativa(cantiereBase, {
      data: "25/08/2026",
      operai: ["Marco"],
      oreLavorate: 8,
      attivita: "Tracce",
    });
    c = aggiungiGiornataLavorativa(c, {
      data: "26/08/2026",
      operai: ["Marco"],
      oreLavorate: 7,
      attivita: "Tubazioni",
    });

    expect(registroPerGiorno(c, "25/08/2026")).toHaveLength(1);
    const riepilogo = riepilogoRegistroCantiere(c);
    expect(riepilogo.giornateLavorate).toBe(2);
    expect(riepilogo.totaleOreLavorate).toBe(15);
  });
});
