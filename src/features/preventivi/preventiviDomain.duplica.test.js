import { describe, expect, it } from "vitest";

import { STATI_PREVENTIVO } from "../../domain/workflow";
import { duplicaPreventivo } from "./preventiviDomain";

describe("duplicaPreventivo — niente link cantiere ereditato", () => {
  it("rimuove cantiereId e timestamp workflow dalla copia", () => {
    const copia = duplicaPreventivo({
      archivio: [{ id: 1, numero: "2026-001" }],
      cliente: "Rossi",
      datiPreventivo: {
        id: 99,
        numero: "2026-099",
        cliente: "Rossi",
        stato: STATI_PREVENTIVO.CONVERTITO,
        cantiereId: "c-originale",
        inviatoAt: "2026-01-01T00:00:00.000Z",
        accettatoAt: "2026-01-02T00:00:00.000Z",
        convertitoAt: "2026-01-03T00:00:00.000Z",
        convertitoBy: "user",
        dataAccettazione: "03/01/2026",
        lavorazioni: [{ id: "1", nome: "Quadro", prezzo: 100, quantita: 1 }],
        totale: 122,
        note: "Nota utile",
      },
    });

    expect(copia.id).not.toBe(99);
    expect(copia.numero).not.toBe("2026-099");
    expect(copia.stato).toBe(STATI_PREVENTIVO.BOZZA);
    expect(copia.cliente).toBe("Rossi - copia");
    expect(copia.cantiereId).toBeNull();
    expect(copia.inviatoAt).toBeUndefined();
    expect(copia.accettatoAt).toBeUndefined();
    expect(copia.convertitoAt).toBeUndefined();
    expect(copia.convertitoBy).toBeUndefined();
    expect(copia.dataAccettazione).toBeUndefined();
    expect(copia.lavorazioni).toHaveLength(1);
    expect(copia.note).toBe("Nota utile");
  });
});
