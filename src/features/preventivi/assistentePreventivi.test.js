import { describe, expect, it } from "vitest";

import { generaBozzaPreventivoLocale } from "./assistentePreventivi";

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
