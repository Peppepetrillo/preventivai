import { describe, expect, it } from "vitest";

import { STATI_PREVENTIVO } from "../../domain/workflow";
import {
  FILTRI_PREVENTIVO,
  classeColoreStatoPreventivo,
  filtraPreventiviPerCliente,
  filtraPreventiviPerStato,
  filtraPreventiviRicerca,
} from "./archivioPreventiviUtils";

describe("archivioPreventiviUtils", () => {
  const elenco = [
    { id: 1, cliente: "Mario Rossi", numero: "PREV-001", totale: 100 },
    { id: 2, cliente: "Bianchi SRL", numero: "PREV-002", totale: 50 },
    {
      id: 3,
      cliente: "Verdi",
      numero: "PREV-003",
      stato: STATI_PREVENTIVO.CONVERTITO,
    },
  ];

  it("filtra per cliente senza mutare l'elenco originale", () => {
    const filtrati = filtraPreventiviPerCliente(elenco, "bianchi");
    expect(filtrati).toHaveLength(1);
    expect(filtrati[0].id).toBe(2);
    expect(elenco).toHaveLength(3);
  });

  it("filtra per numero preventivo", () => {
    expect(filtraPreventiviRicerca(elenco, "PREV-001")).toHaveLength(1);
    expect(filtraPreventiviRicerca(elenco, "001")[0].id).toBe(1);
  });

  it("filtra per importo", () => {
    expect(filtraPreventiviRicerca(elenco, "50")).toHaveLength(1);
  });

  it("con ricerca vuota restituisce tutto", () => {
    expect(filtraPreventiviPerCliente(elenco, "  ")).toEqual(elenco);
  });

  it("filtra da-inviare come solo Bozze", () => {
    const elencoStati = [
      { id: 1, stato: "Bozza" },
      { id: 2, stato: "Inviato" },
    ];
    const filtrati = filtraPreventiviPerStato(
      elencoStati,
      FILTRI_PREVENTIVO.DA_INVIARE
    );
    expect(filtrati).toHaveLength(1);
    expect(filtrati[0].id).toBe(1);
  });

  it("filtra per stato in cantiere", () => {
    const filtrati = filtraPreventiviPerStato(
      elenco,
      FILTRI_PREVENTIVO.IN_CANTIERE
    );
    expect(filtrati).toHaveLength(1);
    expect(filtrati[0].id).toBe(3);
  });

  it("mappa i colori stato noti", () => {
    expect(classeColoreStatoPreventivo("Inviato")).toBe("bg-blue-500");
    expect(classeColoreStatoPreventivo("Convertito")).toBe("bg-emerald-600");
    expect(classeColoreStatoPreventivo("Sconosciuto")).toBe("bg-yellow-500");
  });
});
