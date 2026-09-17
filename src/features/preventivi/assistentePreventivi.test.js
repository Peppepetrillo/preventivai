import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import {
  generaBozzaPreventivoAI,
  generaBozzaPreventivoLocale,
  estraiVociNonTrovate,
} from "./assistentePreventivi";

describe("generaBozzaPreventivoLocale", () => {
  const clienti = [{ id: 1, nome: "Mario Rossi" }];
  const listino = [
    {
      id: "punto-luce",
      nome: "Punto luce",
      categoria: "Impianto",
      prezzo: 45,
      unita: "cad",
    },
    {
      id: "punto-presa",
      nome: "Punto presa",
      categoria: "Impianto",
      prezzo: 55,
      unita: "cad",
    },
    {
      id: "quadro",
      nome: "Quadro elettrico",
      categoria: "Impianto",
      prezzo: 350,
      unita: "cad",
    },
  ];

  it("riconosce cliente, lavorazioni e condizioni da testo libero", () => {
    const bozza = generaBozzaPreventivoLocale({
      testo: "preventivo per Mario Rossi con punto luce e punto presa, sconto 5%, acconto 200, bonifico",
      clienti,
      listino,
    });

    expect(bozza.cliente).toBe("Mario Rossi");
    expect(bozza.lavorazioni.length).toBeGreaterThan(0);
    expect(bozza.sconto).toBe(5);
    expect(bozza.acconto).toBe(200);
    expect(bozza.pagamento).toBe("Bonifico bancario");
    expect(bozza.riepilogo.totale).toBeGreaterThan(0);
    expect(bozza.fonte).toBe("listino_locale");
  });

  it("prende prezzi solo dal listino e marca prezzoDalListino", () => {
    const bozza = generaBozzaPreventivoLocale({
      testo: "80 punti luce e 60 prese",
      clienti,
      listino,
    });

    expect(bozza.lavorazioni.length).toBeGreaterThan(0);
    for (const lav of bozza.lavorazioni) {
      expect(lav.prezzoDalListino).toBe(true);
      const voce = listino.find((v) => v.nome === lav.nome);
      expect(voce).toBeTruthy();
      expect(lav.prezzo).toBe(voce.prezzo);
    }
  });

  it("segnala voci non trovate senza inventare prezzi", () => {
    const bozza = generaBozzaPreventivoLocale({
      testo: "4 punti luce e 12 videocitofoni magici",
      clienti,
      listino,
    });

    expect(bozza.nonTrovate.length).toBeGreaterThan(0);
    expect(bozza.nonTrovate.some((v) => /videocitofon/i.test(v.nome))).toBe(
      true
    );
    expect(bozza.avvisi.some((a) => /listino/i.test(a))).toBe(true);
  });

  it("segnala cliente e voci mancanti", () => {
    const bozza = generaBozzaPreventivoLocale({
      testo: "lavoro generico senza dettagli",
      clienti,
      listino,
    });

    expect(bozza.avvisi.length).toBeGreaterThan(0);
    expect(bozza.lavorazioni).toHaveLength(0);
  });
});

describe("estraiVociNonTrovate", () => {
  it("ignora voci già matchate nel listino", () => {
    const nonTrovate = estraiVociNonTrovate("4 punti luce e 3 bobine alien", [
      { nome: "Punto luce" },
    ]);
    expect(nonTrovate.every((v) => !/luce/i.test(v.nome))).toBe(true);
    expect(nonTrovate.some((v) => /bobine|alien/i.test(v.nome))).toBe(true);
  });
});

describe("generaBozzaPreventivoAI", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("non POST-a clienti/listino anche se endpoint è configurato", async () => {
    vi.stubEnv("VITE_AI_ASSISTANT_ENDPOINT", "https://example.test/ai");
    const clienti = [{ id: 1, nome: "Mario Rossi", telefono: "333", email: "a@b.it" }];
    const listino = [{ id: "1", nome: "Punto luce", prezzo: 45 }];
    const bozza = await generaBozzaPreventivoAI({
      testo: "preventivo per Mario Rossi punto luce",
      clienti,
      listino,
    });
    expect(fetch).not.toHaveBeenCalled();
    expect(bozza.cliente).toBe("Mario Rossi");
    expect(bozza.fonte).toBe("listino_locale");
  });
});
