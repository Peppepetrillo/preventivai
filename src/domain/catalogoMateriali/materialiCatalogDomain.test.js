import { describe, expect, it } from "vitest";

import {
  CATEGORIA_MATERIALE,
  CATEGORIE_MATERIALE,
  CATEGORIE_NAVIGAZIONE_MATERIALE,
  CATALOGO_MATERIALI_SEED,
  ETICHETTE_CATEGORIA_MATERIALE,
  UNITA_MATERIALE,
  UNITA_MATERIALE_CANONICHE,
  analizzaIntegritaSeed,
  calcolaQuantitaAccessorioSuggerito,
  cercaFamiglieMateriali,
  clonaSeedCatalogoMateriali,
  contaCatalogoMaterialiSeed,
  creaRiferimentoMateriale,
  elencaAccessoriSuggeritiPerVariante,
  elencaFamiglieMateriali,
  elencaFamigliePerCategoria,
  isCategoriaMateriale,
  isFamigliaMaterialeId,
  isUnitaCanonica,
  isVarianteMaterialeId,
  mergeCatalogoConSeed,
  normalizzaAccessoriSuggeriti,
  normalizzaFamigliaMateriale,
  normalizzaUnitaMateriale,
  trovaFamigliaMateriale,
  trovaVarianteMateriale,
  validaRiferimentoMateriale,
} from "./index";

describe("catalogoMateriali — categorie", () => {
  it("espone le categorie UX-6.2 incluso elettrico legacy", () => {
    expect(CATEGORIE_MATERIALE).toEqual([
      "elettrico",
      "cavi",
      "tubi",
      "canalizzazioni",
      "cassette",
      "serie-civile",
      "quadri",
      "morsetti",
      "illuminazione",
      "rete-dati",
      "tv-sat",
      "videosorveglianza",
      "allarme",
      "domotica",
      "fotovoltaico",
      "generale",
      "industriale",
      "ev",
      "automazione",
    ]);
    expect(CATEGORIE_NAVIGAZIONE_MATERIALE).not.toContain("elettrico");
    expect(CATEGORIE_NAVIGAZIONE_MATERIALE).toHaveLength(18);
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
  it("contiene famiglie e varianti nel range professionale UX-6.2", () => {
    const { famiglie, varianti } = contaCatalogoMaterialiSeed();
    expect(famiglie).toBeGreaterThanOrEqual(90);
    expect(famiglie).toBeLessThanOrEqual(110);
    expect(varianti).toBeGreaterThanOrEqual(380);
    expect(varianti).toBeLessThanOrEqual(480);
  });

  it("copre le categorie di navigazione, senza seed su elettrico legacy", () => {
    const presenti = new Set(CATALOGO_MATERIALI_SEED.map((f) => f.categoria));
    for (const categoria of CATEGORIE_NAVIGAZIONE_MATERIALE) {
      expect(presenti.has(categoria)).toBe(true);
    }
    expect(presenti.has(CATEGORIA_MATERIALE.ELETTRICO)).toBe(false);
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
      "Ø63",
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
    const tubi = elencaFamigliePerCategoria(
      undefined,
      CATEGORIA_MATERIALE.TUBI
    );
    expect(tubi.length).toBeGreaterThan(2);
    expect(tubi.every((f) => f.categoria === "tubi")).toBe(true);
    expect(tubi.some((f) => f.id === "tubo-corrugato")).toBe(true);

    const tutte = elencaFamiglieMateriali();
    expect(tutte.length).toBe(CATALOGO_MATERIALI_SEED.length);
  });

  it("mantiene risolvibili i vecchi ID seed", () => {
    expect(isFamigliaMaterialeId("tubo-corrugato")).toBe(true);
    expect(isVarianteMaterialeId("tubo-corrugato-25")).toBe(true);
    expect(isVarianteMaterialeId("cassetta-503")).toBe(true);
    expect(isVarianteMaterialeId("presa-civile-bipasso")).toBe(true);
    expect(isFamigliaMaterialeId("cavo-fg16or16")).toBe(true);
    expect(isVarianteMaterialeId("cavo-fg16or16-3g2-5")).toBe(true);
  });

  it("ricerca 3G2,5 / deviatore / Ø20", () => {
    const seed = clonaSeedCatalogoMateriali();
    expect(
      cercaFamiglieMateriali(seed, "3G2,5").some((f) => f.id === "cavo-fg16or16")
    ).toBe(true);
    expect(
      cercaFamiglieMateriali(seed, "deviatore").some(
        (f) => f.id === "interruttore-comando"
      )
    ).toBe(true);
    expect(
      cercaFamiglieMateriali(seed, "Ø20").some((f) => f.id === "tubo-corrugato")
    ).toBe(true);
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

describe("catalogoMateriali — accessoriSuggeriti UX-6.1a", () => {
  it("normalizza accessori e ignora payload invalidi (retrocompat)", () => {
    expect(normalizzaAccessoriSuggeriti(undefined)).toEqual([]);
    expect(normalizzaAccessoriSuggeriti(null)).toEqual([]);
    expect(normalizzaAccessoriSuggeriti("x")).toEqual([]);
    expect(
      normalizzaAccessoriSuggeriti([
        { varianteId: "cassetta-503", quantitaPerUnita: 2 },
        { nome: "senza id" },
        { famigliaId: "pressacavo", obbligatorio: true },
        { varianteId: "cassetta-503", quantitaPerUnita: 9 },
      ])
    ).toEqual([
      {
        varianteId: "cassetta-503",
        quantitaPerUnita: 2,
        obbligatorio: false,
      },
      {
        famigliaId: "pressacavo",
        quantitaPerUnita: 1,
        obbligatorio: true,
      },
    ]);
  });

  it("preserva accessori in normalizzaFamiglia/Variante senza romperli se assenti", () => {
    const senza = normalizzaFamigliaMateriale({
      id: "custom-x",
      nome: "Custom",
      categoria: "elettrico",
      unitaDefault: "pz",
      attributoChiave: "tipo",
      varianti: [
        { id: "custom-x-a", famigliaId: "custom-x", etichetta: "A", attributi: {} },
      ],
    });
    expect(senza?.accessoriSuggeriti).toBeUndefined();

    const con = normalizzaFamigliaMateriale({
      id: "custom-y",
      nome: "Custom Y",
      categoria: "elettrico",
      unitaDefault: "pz",
      attributoChiave: "tipo",
      accessoriSuggeriti: [{ famigliaId: "cassetta", quantitaPerUnita: 1 }],
      varianti: [
        {
          id: "custom-y-a",
          famigliaId: "custom-y",
          etichetta: "A",
          attributi: {},
          accessoriSuggeriti: [{ varianteId: "cassetta-503" }],
        },
      ],
    });
    expect(con?.accessoriSuggeriti).toHaveLength(1);
    expect(con?.varianti[0].accessoriSuggeriti?.[0].varianteId).toBe(
      "cassetta-503"
    );
  });

  it("seed: presa e interruttore suggeriscono supporto, placca e cassetta 503", () => {
    const presa = trovaFamigliaMateriale("presa-civile");
    expect(presa?.accessoriSuggeriti).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ famigliaId: "supporto-civile" }),
        expect.objectContaining({ famigliaId: "placca-civile" }),
        expect.objectContaining({
          varianteId: "cassetta-503",
          quantitaPerUnita: 1,
        }),
      ])
    );

    const accessori = elencaAccessoriSuggeritiPerVariante("presa-civile-bipasso");
    expect(accessori.some((a) => a.famigliaId === "supporto-civile")).toBe(true);
    expect(accessori.some((a) => a.famigliaId === "placca-civile")).toBe(true);
    expect(accessori.some((a) => a.varianteId === "cassetta-503")).toBe(true);

    const comando = elencaAccessoriSuggeritiPerVariante(
      "interruttore-comando-deviatore"
    );
    expect(comando.some((a) => a.famigliaId === "supporto-civile")).toBe(true);
    expect(comando.some((a) => a.famigliaId === "placca-civile")).toBe(true);
    expect(comando.some((a) => a.varianteId === "cassetta-503")).toBe(true);
  });

  it("seed: tubo Ø25 suggerisce pressacavo PG16", () => {
    const accessori = elencaAccessoriSuggeritiPerVariante("tubo-corrugato-25");
    expect(accessori).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          varianteId: "pressacavo-pg16",
          famigliaId: "pressacavo",
        }),
      ])
    );
  });

  it("seed: quadro, telecamera, striscia e nvr hanno relazioni tipiche", () => {
    expect(
      elencaAccessoriSuggeritiPerVariante("quadro-elettrico-24-moduli").length
    ).toBeGreaterThanOrEqual(3);
    expect(
      elencaAccessoriSuggeritiPerVariante("quadro-elettrico-24-moduli").some(
        (a) => a.famigliaId === "guida-din"
      )
    ).toBe(true);
    expect(
      elencaAccessoriSuggeritiPerVariante("telecamera-dome-ip").some(
        (a) => a.varianteId === "kit-fissaggio-per-telecamera"
      )
    ).toBe(true);
    expect(
      elencaAccessoriSuggeritiPerVariante("striscia-led-24v-rgb").some(
        (a) => a.famigliaId === "alimentatore-led"
      )
    ).toBe(true);
    expect(
      elencaAccessoriSuggeritiPerVariante("nvr-dvr-8-canali").some(
        (a) => a.famigliaId === "hdd-videosorveglianza"
      )
    ).toBe(true);
  });

  it("calcolaQuantitaAccessorioSuggerito rispetta il moltiplicatore", () => {
    expect(
      calcolaQuantitaAccessorioSuggerito(12, { quantitaPerUnita: 1 })
    ).toBe(12);
    expect(
      calcolaQuantitaAccessorioSuggerito(3, { quantitaPerUnita: 4 })
    ).toBe(12);
    expect(calcolaQuantitaAccessorioSuggerito(0, { quantitaPerUnita: 1 })).toBe(
      0
    );
  });

  it("integrità seed resta ok con accessori", () => {
    const report = analizzaIntegritaSeed();
    expect(report.ok).toBe(true);
    expect(report.errori).toEqual([]);
  });
});

function famigliaFixture({
  id,
  nome,
  categoria,
  personalizzata = false,
  attiva = true,
  varianti = [],
  accessoriSuggeriti,
  unitaDefault = "pz",
  attributoChiave = "tipo",
}) {
  return {
    id,
    nome,
    categoria,
    unitaDefault,
    attributoChiave,
    personalizzata,
    attiva,
    varianti,
    ...(accessoriSuggeriti ? { accessoriSuggeriti } : {}),
  };
}

describe("catalogoMateriali — merge seed UX-6.2", () => {
  it("preserva modifiche, personalizzate, disattivazioni e aggiunge voci nuove", () => {
    const catalogoA = [
      famigliaFixture({
        id: "tubo-corrugato",
        nome: "Tubo corrugato XL",
        categoria: "elettrico",
        unitaDefault: "m",
        attributoChiave: "diametro",
        varianti: [
          {
            id: "tubo-corrugato-25",
            famigliaId: "tubo-corrugato",
            etichetta: "Ø25 rinforzato",
            attributi: { diametro: "25" },
            attiva: false,
          },
          {
            id: "tubo-corrugato-20",
            famigliaId: "tubo-corrugato",
            etichetta: "Ø20",
            attributi: { diametro: "20" },
            attiva: true,
          },
        ],
      }),
      famigliaFixture({
        id: "cassetta",
        nome: "Cassetta",
        categoria: "elettrico",
        attiva: false,
        varianti: [
          {
            id: "cassetta-503",
            famigliaId: "cassetta",
            etichetta: "503",
            attributi: { tipo: "503" },
            attiva: true,
          },
        ],
      }),
      famigliaFixture({
        id: "custom-utente-xyz",
        nome: "Mio materiale cantiere",
        categoria: "elettrico",
        personalizzata: true,
        varianti: [
          {
            id: "custom-utente-xyz-a",
            famigliaId: "custom-utente-xyz",
            etichetta: "A",
            attributi: { tipo: "A" },
            attiva: true,
          },
        ],
      }),
    ];

    const primo = mergeCatalogoConSeed(catalogoA, CATALOGO_MATERIALI_SEED);
    expect(primo.changed).toBe(true);

    const tubo = primo.catalogo.find((f) => f.id === "tubo-corrugato");
    expect(tubo?.nome).toBe("Tubo corrugato XL");
    expect(tubo?.categoria).toBe("tubi");
    expect(
      tubo?.varianti.find((v) => v.id === "tubo-corrugato-25")?.etichetta
    ).toBe("Ø25 rinforzato");
    expect(
      tubo?.varianti.find((v) => v.id === "tubo-corrugato-25")?.attiva
    ).toBe(false);
    expect(tubo?.varianti.some((v) => v.id === "tubo-corrugato-16")).toBe(true);

    const cassetta = primo.catalogo.find((f) => f.id === "cassetta");
    expect(cassetta?.attiva).toBe(false);
    expect(cassetta?.categoria).toBe("cassette");
    expect(cassetta?.varianti.some((v) => v.id === "cassetta-506")).toBe(true);

    const custom = primo.catalogo.find((f) => f.id === "custom-utente-xyz");
    expect(custom?.nome).toBe("Mio materiale cantiere");
    expect(custom?.personalizzata).toBe(true);
    expect(custom?.categoria).toBe("elettrico");

    expect(primo.catalogo.some((f) => f.id === "cavo-fg16or16")).toBe(true);
    expect(primo.catalogo.some((f) => f.id === "wallbox")).toBe(true);

    const ids = primo.catalogo.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);

    const secondo = mergeCatalogoConSeed(primo.catalogo, CATALOGO_MATERIALI_SEED);
    expect(secondo.changed).toBe(false);
    expect(secondo.catalogo).toHaveLength(primo.catalogo.length);
    expect(
      secondo.catalogo.find((f) => f.id === "tubo-corrugato")?.nome
    ).toBe("Tubo corrugato XL");
    expect(secondo.catalogo.find((f) => f.id === "cassetta")?.attiva).toBe(
      false
    );
  });

  it("non sposta una famiglia seed se l'utente ha già cambiato categoria", () => {
    const catalogo = [
      famigliaFixture({
        id: "tubo-corrugato",
        nome: "Tubo corrugato",
        categoria: "generale",
        unitaDefault: "m",
        attributoChiave: "diametro",
        varianti: [
          {
            id: "tubo-corrugato-20",
            famigliaId: "tubo-corrugato",
            etichetta: "Ø20",
            attributi: { diametro: "20" },
            attiva: true,
          },
        ],
      }),
    ];
    const { catalogo: fuso } = mergeCatalogoConSeed(
      catalogo,
      CATALOGO_MATERIALI_SEED
    );
    expect(fuso.find((f) => f.id === "tubo-corrugato")?.categoria).toBe(
      "generale"
    );
  });

  it("lookup preferisce il catalogo persistito e usa il seed come fallback", () => {
    const persistito = [
      famigliaFixture({
        id: "tubo-corrugato",
        nome: "Corrugato utente",
        categoria: "tubi",
        unitaDefault: "m",
        attributoChiave: "diametro",
        varianti: [
          {
            id: "tubo-corrugato-25",
            famigliaId: "tubo-corrugato",
            etichetta: "Ø25 custom",
            attributi: { diametro: "25" },
            attiva: true,
          },
        ],
      }),
    ];

    expect(trovaFamigliaMateriale("tubo-corrugato", persistito)?.nome).toBe(
      "Corrugato utente"
    );
    expect(trovaVarianteMateriale("tubo-corrugato-25", persistito)?.etichetta).toBe(
      "Ø25 custom"
    );
    expect(trovaFamigliaMateriale("tubo-corrugato")?.nome).toBe("Tubo corrugato");
    expect(trovaFamigliaMateriale("cavo-fg16or16", persistito)?.nome).toBe(
      "Cavo FG16OR16"
    );
  });
});

