import { beforeEach, describe, expect, it } from "vitest";

import {
  creaVarianteCantiere,
  importoSegnatoVariante,
  riepilogoEconomicoCantiere,
  risolviPreventivoOriginaleTotale,
} from "./cantiereVariantiDomain";
import { resetVarianti } from "../../domain/varianti";

describe("cantiereVariantiDomain", () => {
  beforeEach(() => {
    localStorage.clear();
    resetVarianti();
  });
  it("crea aggiunta e rimozione con totale corretto", () => {
    const aggiunta = creaVarianteCantiere({
      tipo: "aggiunta",
      descrizione: "Linea climatizzatore",
      quantita: 1,
      prezzoUnitario: 180,
    });
    expect(aggiunta.totale).toBe(180);
    expect(importoSegnatoVariante(aggiunta)).toBe(180);

    const rimozione = creaVarianteCantiere({
      tipo: "rimozione",
      descrizione: "Punto luce",
      quantita: 1,
      prezzoUnitario: 40,
    });
    expect(importoSegnatoVariante(rimozione)).toBe(-40);
  });

  it("calcola totali aggiornati senza alterare il preventivo originale", () => {
    const cantiere = {
      preventivoOriginaleTotale: 2500,
      varianti: [
        creaVarianteCantiere({
          descrizione: "Clima",
          quantita: 1,
          prezzoUnitario: 180,
        }),
        creaVarianteCantiere({
          descrizione: "Prese",
          quantita: 3,
          prezzoUnitario: 30,
        }),
        creaVarianteCantiere({
          tipo: "rimozione",
          descrizione: "Lampada",
          quantita: 1,
          prezzoUnitario: 40,
        }),
      ],
    };

    const riepilogo = riepilogoEconomicoCantiere(cantiere);
    expect(riepilogo.preventivoOriginale).toBe(2500);
    expect(riepilogo.deltaVarianti).toBe(230);
    expect(riepilogo.totaleAggiornato).toBe(2730);
    expect(riepilogo.numeroVarianti).toBe(3);
  });

  it("risolve il totale originale da lavorazioni se manca lo snapshot", () => {
    expect(
      risolviPreventivoOriginaleTotale({
        lavorazioniOrigine: [{ prezzo: 45, quantita: 2 }],
      })
    ).toBe(90);
  });

  it("richiede descrizione", () => {
    expect(() =>
      creaVarianteCantiere({ descrizione: "  ", quantita: 1, prezzoUnitario: 10 })
    ).toThrow(/descrizione/i);
  });
});
