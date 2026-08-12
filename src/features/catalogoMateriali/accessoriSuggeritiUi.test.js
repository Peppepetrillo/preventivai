import { describe, expect, it } from "vitest";

import { CATALOGO_MATERIALI_SEED } from "../../domain/catalogoMateriali/materialiCatalogoSeed";
import { normalizzaCatalogoMateriali } from "../../domain/catalogoMateriali/materialiCatalogDomain";
import {
  chiaveAccessorioSuggerito,
  risolviAccessoriSuggeritiValidi,
} from "./accessoriSuggeritiUi";

describe("accessoriSuggeritiUi", () => {
  const catalogo = normalizzaCatalogoMateriali(CATALOGO_MATERIALI_SEED);

  it("risolve solo accessori con ref valide nel catalogo", () => {
    const risolti = risolviAccessoriSuggeritiValidi(
      [
        {
          famigliaId: "pressacavo",
          quantitaPerUnita: 4,
          nota: "Pressacavi tipici",
        },
        {
          varianteId: "morsetti-a-leva-3-poli",
          famigliaId: "morsetti",
          quantitaPerUnita: 1,
        },
        {
          famigliaId: "fantasma-inesistente",
          quantitaPerUnita: 1,
        },
        {
          varianteId: "variante-fantasma",
          famigliaId: "pressacavo",
          quantitaPerUnita: 1,
        },
      ],
      catalogo
    );

    expect(risolti).toHaveLength(2);
    expect(risolti[0].titolo).toBe("Pressacavo");
    expect(risolti[1].titolo).toMatch(/Morsetti/i);
  });

  it("ignora famiglie o varianti disattivate", () => {
    const conInattiva = catalogo.map((f) =>
      f.id === "pressacavo" ? { ...f, attiva: false } : f
    );
    const risolti = risolviAccessoriSuggeritiValidi(
      [{ famigliaId: "pressacavo", quantitaPerUnita: 1 }],
      conInattiva
    );
    expect(risolti).toHaveLength(0);
  });

  it("chiaveAccessorioSuggerito è stabile", () => {
    expect(
      chiaveAccessorioSuggerito({
        varianteId: "a",
        famigliaId: "b",
      })
    ).toBe("a|b");
    expect(chiaveAccessorioSuggerito({ famigliaId: "b" })).toBe("|b");
  });
});
