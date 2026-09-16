import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import {
  generaBozzaPreventivoAI,
  generaBozzaPreventivoLocale,
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
  });
});
