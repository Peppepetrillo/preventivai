import { describe, expect, it } from "vitest";

import {
  classeColoreStatoPreventivo,
  filtraPreventiviPerCliente,
} from "./archivioPreventiviUtils";

describe("archivioPreventiviUtils", () => {
  const elenco = [
    { id: 1, cliente: "Mario Rossi" },
    { id: 2, cliente: "Bianchi SRL" },
  ];

  it("filtra per cliente senza mutare l'elenco originale", () => {
    const filtrati = filtraPreventiviPerCliente(elenco, "bianchi");
    expect(filtrati).toHaveLength(1);
    expect(filtrati[0].id).toBe(2);
    expect(elenco).toHaveLength(2);
  });

  it("con ricerca vuota restituisce tutto", () => {
    expect(filtraPreventiviPerCliente(elenco, "  ")).toEqual(elenco);
  });

  it("mappa i colori stato noti", () => {
    expect(classeColoreStatoPreventivo("Inviato")).toBe("bg-blue-500");
    expect(classeColoreStatoPreventivo("Sconosciuto")).toBe("bg-slate-500");
  });
});
