import { describe, expect, it } from "vitest";

import {
  applicaModificaManualeMateriale,
  proiettaVociDistintaSuMaterialiCantiere,
} from "./distintaProiezione";

const distintaBase = {
  id: "dist-1",
  titolo: "BOM Villa",
  voci: [
    {
      id: "voce-1",
      famigliaId: "fam-tubo",
      varianteId: "var-25",
      nome: "Tubo corrugato Ø25",
      quantita: 50,
      unita: "m",
      note: "parete",
    },
    {
      id: "voce-2",
      nome: "Materiale libero XYZ",
      quantita: 3,
      unita: "pz",
    },
  ],
};

describe("distintaProiezione → cantiere", () => {
  it("proietta voci mantenendo id catalogo e materiale libero", () => {
    const materiali = proiettaVociDistintaSuMaterialiCantiere([], distintaBase);
    expect(materiali).toHaveLength(2);

    const catalogo = materiali.find((m) => m.distintaVoceId === "voce-1");
    expect(catalogo.famigliaId).toBe("fam-tubo");
    expect(catalogo.varianteId).toBe("var-25");
    expect(catalogo.nome).toBe("Tubo corrugato Ø25");
    expect(catalogo.quantita).toBe(50);
    expect(catalogo.unita).toBe("m");
    expect(catalogo.origine).toBe("distinta");
    expect(catalogo.distintaId).toBe("dist-1");

    const libero = materiali.find((m) => m.distintaVoceId === "voce-2");
    expect(libero.famigliaId).toBeUndefined();
    expect(libero.varianteId).toBeUndefined();
    expect(libero.nome).toBe("Materiale libero XYZ");
  });

  it("è idempotente: seconda proiezione non duplica", () => {
    const prima = proiettaVociDistintaSuMaterialiCantiere([], distintaBase);
    const seconda = proiettaVociDistintaSuMaterialiCantiere(prima, distintaBase);
    expect(seconda).toHaveLength(2);
    expect(seconda.map((m) => m.distintaVoceId).sort()).toEqual([
      "voce-1",
      "voce-2",
    ]);
  });

  it("aggiorna quantità se non modificato manualmente", () => {
    const base = proiettaVociDistintaSuMaterialiCantiere([], distintaBase);
    const aggiornata = {
      ...distintaBase,
      voci: [
        { ...distintaBase.voci[0], quantita: 80 },
        distintaBase.voci[1],
      ],
    };
    const materiali = proiettaVociDistintaSuMaterialiCantiere(base, aggiornata);
    expect(materiali.find((m) => m.distintaVoceId === "voce-1").quantita).toBe(
      80
    );
  });

  it("non sovrascrive modifiche manuali sul cantiere", () => {
    let materiali = proiettaVociDistintaSuMaterialiCantiere([], distintaBase);
    materiali = materiali.map((m) =>
      m.distintaVoceId === "voce-1"
        ? applicaModificaManualeMateriale(m, { quantita: 12, nome: "Custom" })
        : m
    );
    const aggiornata = {
      ...distintaBase,
      voci: [{ ...distintaBase.voci[0], quantita: 99 }, distintaBase.voci[1]],
    };
    const next = proiettaVociDistintaSuMaterialiCantiere(materiali, aggiornata);
    const voce = next.find((m) => m.distintaVoceId === "voce-1");
    expect(voce.quantita).toBe(12);
    expect(voce.nome).toBe("Custom");
    expect(voce.modificatoManualmente).toBe(true);
  });

  it("elimina voce dalla distinta senza cancellare lo storico cantiere", () => {
    const base = proiettaVociDistintaSuMaterialiCantiere([], distintaBase);
    const senzaPrima = {
      ...distintaBase,
      voci: [distintaBase.voci[1]],
    };
    const next = proiettaVociDistintaSuMaterialiCantiere(base, senzaPrima);
    expect(next).toHaveLength(2);
    const orfana = next.find((m) => m.distintaVoceId === "voce-1");
    expect(orfana.distintaOrfana).toBe(true);
    expect(orfana.nome).toBe("Tubo corrugato Ø25");
  });

  it("preserva materiali legacy non provenienti dalla distinta", () => {
    const legacy = [
      { id: "legacy-1", nome: "Nastro isolante", quantita: 2, unita: "cad" },
    ];
    const next = proiettaVociDistintaSuMaterialiCantiere(legacy, distintaBase);
    expect(next).toHaveLength(3);
    expect(next.find((m) => m.id === "legacy-1").nome).toBe("Nastro isolante");
  });
});
