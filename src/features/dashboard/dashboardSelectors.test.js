import { describe, expect, it } from "vitest";
import {
  creaMessaggioOperativo,
  preparaCantieriOperativi,
  selezionaPreventiviInAttesa,
} from "./dashboardSelectors";

describe("dashboardSelectors", () => {
  it("prepara solo i cantieri aperti con avanzamento checklist", () => {
    const cantieri = [
      {
        id: 1,
        stato: "In corso",
        checklist: [
          { completata: true },
          { completata: false },
        ],
      },
      {
        id: 2,
        stato: "Completato",
        checklist: [{ completata: true }],
      },
    ];

    expect(preparaCantieriOperativi(cantieri)).toEqual([
      expect.objectContaining({
        id: 1,
        avanzamento: 50,
      }),
    ]);
  });

  it("seleziona i preventivi inviati come preventivi in attesa", () => {
    const preventivi = [
      { id: 1, stato: "Inviato" },
      { id: 2, stato: "Accettato" },
    ];

    expect(selezionaPreventiviInAttesa(preventivi)).toEqual([
      { id: 1, stato: "Inviato" },
    ]);
  });

  it("crea un messaggio operativo leggibile", () => {
    expect(
      creaMessaggioOperativo({
        nome: "Giuseppe",
        cantieriAperti: 2,
        preventiviInAttesa: 1,
      })
    ).toBe("Buongiorno Giuseppe. Hai 2 cantieri aperti e 1 preventivo in attesa.");
  });
});
