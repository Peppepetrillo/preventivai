import { describe, expect, it } from "vitest";

import {
  CATEGORIA_MATERIALE,
  CATEGORIE_MATERIALE,
  CATALOGO_MATERIALI_SEED,
  ETICHETTE_CATEGORIA_MATERIALE,
  UNITA_MATERIALE,
  UNITA_MATERIALE_CANONICHE,
  analizzaIntegritaSeed,
  contaCatalogoMaterialiSeed,
  creaRiferimentoMateriale,
  elencaFamiglieMateriali,
  elencaFamigliePerCategoria,
  isCategoriaMateriale,
  isFamigliaMaterialeId,
  isUnitaCanonica,
  isVarianteMaterialeId,
  normalizzaUnitaMateriale,
  trovaFamigliaMateriale,
  trovaVarianteMateriale,
  validaRiferimentoMateriale,
} from "./index";

describe("catalogoMateriali — categorie", () => {
  it("espone le 8 categorie dello sprint", () => {
    expect(CATEGORIE_MATERIALE).toEqual([
      "elettrico",
      "allarme",
      "videosorveglianza",
      "rete-dati",
      "illuminazione",
      "domotica",
      "fotovoltaico",
      "generale",
    ]);
  });

  it("valida solo categorie note", () => {
    expect(isCategoriaMateriale(CATEGORIA_MATERIALE.ELETTRICO)).toBe(true);
    expect(isCategoriaMateriale("rete-dati")).toBe(true);
    expect(isCategoriaMateriale("Materiali")).toBe(false);
    expect(isCategoriaMateriale("")).toBe(false);
  });

  it("ha etichette UI per ogni categoria", () => {
    for (const id of CATEGORIE_MATERIALE) {
      expect(ETICHETTE_CATEGORIA_MATERIALE[id]).toBeTruthy();
    }
  });
});

describe("catalogoMateriali — unità", () => {
  it("espone le unità canoniche", () => {
    expect(UNITA_MATERIALE_CANONICHE).toEqual([
      "pz",
      "m",
      "h",
      "kg",
      "m²",
      "m³",
      "confezione",
      "rotolo",
      "kit",
      "altro",
    ]);
  });

  it("valida solo unità canoniche", () => {
    expect(isUnitaCanonica(UNITA_MATERIALE.PZ)).toBe(true);
    expect(isUnitaCanonica("m²")).toBe(true);
    expect(isUnitaCanonica("cad")).toBe(false);
    expect(isUnitaCanonica("mq")).toBe(false);
  });

  it("applica alias legacy cad → pz e mq → m²", () => {
    expect(normalizzaUnitaMateriale("cad")).toBe("pz");
    expect(normalizzaUnitaMateriale("CAD")).toBe("pz");
    expect(normalizzaUnitaMateriale("mq")).toBe("m²");
    expect(normalizzaUnitaMateriale("MQ")).toBe("m²");
    expect(normalizzaUnitaMateriale("m2")).toBe("m²");
    expect(normalizzaUnitaMateriale("m3")).toBe("m³");
  });

  it("lascia invariate le unità già canoniche", () => {
    expect(normalizzaUnitaMateriale("m")).toBe("m");
    expect(normalizzaUnitaMateriale("kit")).toBe("kit");
    expect(normalizzaUnitaMateriale("confezione")).toBe("confezione");
  });

  it("default a pz se vuota", () => {
    expect(normalizzaUnitaMateriale("")).toBe("pz");
  });
});

describe("catalogoMateriali — seed", () => {
  it("contiene famiglie e varianti sufficienti per distinte reali", () => {
    const { famiglie, varianti } = contaCatalogoMaterialiSeed();
    expect(famiglie).toBeGreaterThanOrEqual(40);
    expect(varianti).toBeGreaterThanOrEqual(150);
  });

  it("copre tutte le categorie", () => {
    const presenti = new Set(CATALOGO_MATERIALI_SEED.map((f) => f.categoria));
    for (const categoria of CATEGORIE_MATERIALE) {
      expect(presenti.has(categoria)).toBe(true);
    }
  });

  it("non obbliga il prezzo sulle varianti", () => {
    const conPrezzo = CATALOGO_MATERIALI_SEED.flatMap((f) =>
      f.varianti.filter((v) => v.prezzoIndicativo != null)
    );
    expect(conPrezzo).toHaveLength(0);
  });

  it("non marca le voci seed come personalizzate", () => {
    expect(
      CATALOGO_MATERIALI_SEED.every((f) => f.personalizzata === false)
    ).toBe(true);
  });

  it("passa il controllo di integrità (no duplicati)", () => {
    const report = analizzaIntegritaSeed();
    expect(report.ok).toBe(true);
    expect(report.errori).toEqual([]);
  });

  it("rileva famiglie duplicate", () => {
    const seedFake = [
      ...CATALOGO_MATERIALI_SEED.slice(0, 1),
      { ...CATALOGO_MATERIALI_SEED[0] },
    ];
    const report = analizzaIntegritaSeed(seedFake);
    expect(report.ok).toBe(false);
    expect(report.errori.some((e) => e.includes("famiglia duplicata"))).toBe(
      true
    );
  });
});

describe("catalogoMateriali — famiglie e varianti", () => {
  it("trova famiglie tipiche del mestiere", () => {
    expect(trovaFamigliaMateriale("tubo-corrugato")?.nome).toBe(
      "Tubo corrugato"
    );
    expect(trovaFamigliaMateriale("cavo-multipolare")?.unitaDefault).toBe("m");
    expect(trovaFamigliaMateriale("cassetta")?.attributoChiave).toBe("tipo");
  });

  it("espone le varianti attese su tubo / cavo / canalina / cassetta", () => {
    const tubo = trovaFamigliaMateriale("tubo-corrugato");
    expect(tubo?.varianti.map((v) => v.etichetta)).toEqual([
      "Ø16",
      "Ø20",
      "Ø25",
      "Ø32",
      "Ø40",
      "Ø50",
    ]);

    const cavo = trovaFamigliaMateriale("cavo-unipolare");
    expect(cavo?.varianti.some((v) => v.attributi.sezione === "2.5")).toBe(
      true
    );

    const canalina = trovaFamigliaMateriale("canalina");
    expect(canalina?.varianti.some((v) => v.etichetta === "40×20")).toBe(true);

    const cassetta = trovaFamigliaMateriale("cassetta");
    expect(cassetta?.varianti.map((v) => v.attributi.tipo)).toEqual(
      expect.arrayContaining(["503", "derivazione", "esterna", "stagna"])
    );
  });

  it("collega ogni variante alla famiglia corretta", () => {
    const variante = trovaVarianteMateriale("tubo-corrugato-25");
    expect(variante?.famigliaId).toBe("tubo-corrugato");
    expect(variante?.etichetta).toBe("Ø25");
    expect(isFamigliaMaterialeId("tubo-corrugato")).toBe(true);
    expect(isVarianteMaterialeId("tubo-corrugato-25")).toBe(true);
    expect(isVarianteMaterialeId("inesistente")).toBe(false);
  });

  it("filtra per categoria", () => {
    const elettrico = elencaFamigliePerCategoria(
      undefined,
      CATEGORIA_MATERIALE.ELETTRICO
    );
    expect(elettrico.length).toBeGreaterThan(5);
    expect(elettrico.every((f) => f.categoria === "elettrico")).toBe(true);

    const tutte = elencaFamiglieMateriali();
    expect(tutte.length).toBe(CATALOGO_MATERIALI_SEED.length);
  });
});

describe("catalogoMateriali — riferimenti", () => {
  it("crea riferimento da variante con nome e unità risolti", () => {
    const rif = creaRiferimentoMateriale({
      varianteId: "cavo-multipolare-3x2-5",
      quantita: 120,
    });

    expect(rif).toEqual(
      expect.objectContaining({
        famigliaId: "cavo-multipolare",
        varianteId: "cavo-multipolare-3x2-5",
        nome: "Cavo multipolare — 3×2,5",
        unita: "m",
        quantita: 120,
      })
    );
    expect(rif?.prezzoUnitario).toBeUndefined();
  });

  it("accetta testo libero senza id catalogo", () => {
    const rif = creaRiferimentoMateriale({
      nome: "Materiale custom cantiere",
      quantita: 3,
      unita: "cad",
    });

    expect(rif).toEqual({
      nome: "Materiale custom cantiere",
      unita: "pz",
      quantita: 3,
    });
  });

  it("normalizza unità legacy sul riferimento", () => {
    const rif = creaRiferimentoMateriale({
      nome: "Pannello",
      unita: "mq",
      quantita: 2,
    });
    expect(rif?.unita).toBe("m²");
  });

  it("rifiuta variante sconosciuta o incoerente con famiglia", () => {
    expect(creaRiferimentoMateriale({ varianteId: "nope" })).toBeNull();
    expect(
      creaRiferimentoMateriale({
        famigliaId: "tubo-corrugato",
        varianteId: "cassetta-503",
      })
    ).toBeNull();
  });

  it("valida riferimenti corretti e segnala errori", () => {
    const ok = creaRiferimentoMateriale({
      varianteId: "canalina-40x20",
      quantita: 15,
    });
    expect(validaRiferimentoMateriale(ok).ok).toBe(true);

    expect(validaRiferimentoMateriale(null).ok).toBe(false);
    expect(
      validaRiferimentoMateriale({
        nome: "",
        unita: "m",
        quantita: 0,
      }).errori
    ).toEqual(
      expect.arrayContaining(["nome obbligatorio", "quantita non valida"])
    );
  });

  it("permette prezzo unitario opzionale modificabile", () => {
    const rif = creaRiferimentoMateriale({
      varianteId: "cassetta-503",
      quantita: 12,
      prezzoUnitario: 1.5,
      note: "bianche",
    });
    expect(rif?.prezzoUnitario).toBe(1.5);
    expect(rif?.note).toBe("bianche");
    expect(validaRiferimentoMateriale(rif).ok).toBe(true);
  });
});
