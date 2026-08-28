import { describe, expect, it } from "vitest";

import { calcolaOrePreviste, creaLavoroDaGiornataProgrammata } from "./lavoriDomain";

describe("lavoriDomain UX-7.3 programmazione", () => {
  it("crea lavoro da giornata con ore e operai", () => {
    const lavoro = creaLavoroDaGiornataProgrammata(
      { id: "c1", nome: "Villa", cliente: "Rossi", stato: "In corso" },
      {
        id: "g1",
        data: "10/09/2026",
        operai: 2,
        orePreviste: 8,
        attivita: "Tracce",
        stato: "programmata",
      }
    );

    expect(lavoro.id).toBe("c1:g1");
    expect(lavoro.kind).toBe("lavoro-giornata");
    expect(lavoro.operai).toBe(2);
    expect(lavoro.orePreviste).toBe(8);
    expect(lavoro.oreUomo).toBe(16);
    expect(lavoro.durataStimata).toBe(480);
    expect(lavoro.sottotitoloProgrammazione).toContain("Tracce");
    expect(lavoro.sottotitoloProgrammazione).toContain("2 operai");
    expect(lavoro.tipoLavoroLabel).toBe("Previsto");
    expect(lavoro.statoLabel).toMatch(/Programmata/i);
  });

  it("giornata completata senza consuntivo espone consuntivoMancante", () => {
    const lavoro = creaLavoroDaGiornataProgrammata(
      {
        id: "c1",
        nome: "Villa",
        cliente: "Rossi",
        stato: "In corso",
        registroGiornate: [],
      },
      {
        id: "g1",
        data: "10/09/2026",
        operai: 1,
        orePreviste: 8,
        attivita: "Tracce",
        stato: "completata",
      }
    );

    expect(lavoro.consuntivoMancante).toBe(true);
    expect(lavoro.statoLabel).toBe("Consuntivo da registrare");
  });

  it("giornata completata con consuntivo non è consuntivoMancante", () => {
    const lavoro = creaLavoroDaGiornataProgrammata(
      {
        id: "c1",
        nome: "Villa",
        cliente: "Rossi",
        stato: "In corso",
        registroGiornate: [{ id: "r1", data: "10/09/2026", oreLavorate: 8 }],
      },
      {
        id: "g1",
        data: "10/09/2026",
        operai: 1,
        orePreviste: 8,
        stato: "completata",
      }
    );

    expect(lavoro.consuntivoMancante).toBe(false);
    expect(lavoro.statoLabel).toBe("Fatta");
  });

  it("calcolaOrePreviste usa orePreviste delle giornate", () => {
    const riepilogo = calcolaOrePreviste([
      { orePreviste: 8, durataStimata: 0 },
      { orePreviste: 4, durataStimata: 0 },
      { durataStimata: 60 },
    ]);
    expect(riepilogo.minuti).toBe(8 * 60 + 4 * 60 + 60);
  });
});
