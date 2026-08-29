import { describe, expect, it } from "vitest";

import {
  cantieriPerCliente,
  preventiviPerCliente,
} from "./clientePreventiviUtils";

describe("preventiviPerCliente", () => {
  const preventivi = [
    { id: "a", cliente: "Mario Rossi", clienteId: 1 },
    { id: "b", cliente: "Mario Rossi", clienteId: 2 },
    { id: "c", cliente: "Mario Rossi" },
    { id: "d", cliente: "Luigi Verdi", clienteId: 3 },
  ];

  it("match per ID quando il preventivo ha clienteId", () => {
    const risultato = preventiviPerCliente(
      { clienteId: 2, nome: "Mario Rossi" },
      preventivi
    );

    expect(risultato.map((p) => p.id).sort()).toEqual(["b", "c"]);
  });

  it("esclude preventivi con clienteId di un altro cliente anche se omonimo", () => {
    const risultato = preventiviPerCliente(
      { clienteId: 2, nome: "Mario Rossi" },
      preventivi
    );

    expect(risultato.some((p) => p.id === "a")).toBe(false);
  });

  it("include fallback legacy per nome quando manca clienteId sul preventivo", () => {
    const risultato = preventiviPerCliente(
      { clienteId: 2, nome: "Mario Rossi" },
      preventivi
    );

    expect(risultato.some((p) => p.id === "c")).toBe(true);
  });

  it("fallback legacy solo per preventivi senza clienteId", () => {
    const risultato = preventiviPerCliente({ nome: "Mario Rossi" }, preventivi);

    expect(risultato.map((p) => p.id)).toEqual(["c"]);
  });

  it("non include preventivi di altri clienti", () => {
    const risultato = preventiviPerCliente(
      { clienteId: 3, nome: "Luigi Verdi" },
      preventivi
    );

    expect(risultato.map((p) => p.id)).toEqual(["d"]);
  });
});

describe("cantieriPerCliente", () => {
  const cantieri = [
    { id: "c1", cliente: "Mario Rossi", clienteId: 1 },
    { id: "c2", cliente: "Mario Rossi", clienteId: 2 },
    { id: "c3", cliente: "Mario Rossi" },
  ];

  it("match per ID e fallback legacy", () => {
    const risultato = cantieriPerCliente(
      { clienteId: 2, nome: "Mario Rossi" },
      cantieri
    );

    expect(risultato.map((c) => c.id).sort()).toEqual(["c2", "c3"]);
  });
});
