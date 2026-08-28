import { describe, expect, it } from "vitest";

import {
  STATI_GIORNATA,
  aggiungiGiornataProgrammata,
  aggiornaGiornataProgrammata,
  calcolaOreUomo,
  eliminaGiornataProgrammata,
  giornatePerGiorno,
  haProgrammazioneMultiGiorno,
  leggiProgrammazione,
  normalizzaGiornataProgrammata,
  parseDataProgrammazione,
} from "./programmazioneCantiereService";

describe("programmazioneCantiereService UX-7.3", () => {
  const cantiereBase = { id: "c1", nome: "Villa Rossi", programmazione: [] };

  it("normalizza giornata con operai >= 1 e stato default", () => {
    const g = normalizzaGiornataProgrammata({
      data: "10/09/2026",
      operai: 2,
      orePreviste: 8,
      attivita: "Tracce e tubazioni",
    });
    expect(g.data).toBe("10/09/2026");
    expect(g.operai).toBe(2);
    expect(g.orePreviste).toBe(8);
    expect(g.attivita).toBe("Tracce e tubazioni");
    expect(g.stato).toBe(STATI_GIORNATA.programmata);
    expect(g.id).toBeTruthy();
    expect(g.note).toBeUndefined();
  });

  it("rifiuta giornata senza data", () => {
    expect(normalizzaGiornataProgrammata({ operai: 1 })).toBeNull();
  });

  it("calcola ore uomo = orePreviste × operai", () => {
    expect(calcolaOreUomo({ orePreviste: 8, operai: 2 })).toBe(16);
    expect(calcolaOreUomo({ orePreviste: 4, operai: 0 })).toBe(4);
  });

  it("aggiunge giornate ordinate per data", () => {
    let c = aggiungiGiornataProgrammata(cantiereBase, {
      data: "12/09/2026",
      operai: 1,
      orePreviste: 4,
      attivita: "Finiture",
    });
    c = aggiungiGiornataProgrammata(c, {
      data: "10/09/2026",
      operai: 2,
      orePreviste: 8,
      attivita: "Tracce",
    });
    c = aggiungiGiornataProgrammata(c, {
      data: "11/09/2026",
      operai: 2,
      orePreviste: 8,
      attivita: "Cablaggio",
    });

    const prog = leggiProgrammazione(c);
    expect(prog.map((g) => g.data)).toEqual([
      "10/09/2026",
      "11/09/2026",
      "12/09/2026",
    ]);
    expect(haProgrammazioneMultiGiorno(c)).toBe(true);
  });

  it("aggiorna e elimina giornata senza lasciare orfani", () => {
    let c = aggiungiGiornataProgrammata(cantiereBase, {
      id: "prog-1",
      data: "10/09/2026",
      operai: 2,
      orePreviste: 8,
      attivita: "Tracce",
    });
    c = aggiornaGiornataProgrammata(c, "prog-1", {
      attivita: "Tracce e tubazioni",
      stato: STATI_GIORNATA.completata,
    });
    expect(leggiProgrammazione(c)[0].attivita).toBe("Tracce e tubazioni");
    expect(leggiProgrammazione(c)[0].stato).toBe(STATI_GIORNATA.completata);

    c = eliminaGiornataProgrammata(c, "prog-1");
    expect(leggiProgrammazione(c)).toEqual([]);
  });

  it("giornatePerGiorno esclude annullate e filtra per data", () => {
    let c = aggiungiGiornataProgrammata(cantiereBase, {
      data: "10/09/2026",
      operai: 2,
      attivita: "A",
      stato: STATI_GIORNATA.programmata,
    });
    c = aggiungiGiornataProgrammata(c, {
      data: "10/09/2026",
      operai: 1,
      attivita: "B",
      stato: STATI_GIORNATA.annullata,
    });
    c = aggiungiGiornataProgrammata(c, {
      data: "11/09/2026",
      operai: 1,
      attivita: "C",
    });

    const giorno = parseDataProgrammazione("10/09/2026");
    const lista = giornatePerGiorno(c, giorno);
    expect(lista).toHaveLength(1);
    expect(lista[0].attivita).toBe("A");
  });
});
