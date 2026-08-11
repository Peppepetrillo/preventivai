import { beforeEach, describe, expect, it } from "vitest";

import { APP_DATA_KEYS, STORAGE_KEYS } from "../../app/storageKeys";
import { CATALOGO_MATERIALI_SEED } from "./materialiCatalogoSeed";
import {
  catalogoMaterialiRepository,
  exists,
  load,
  loadRaw,
  replace,
  reset,
  save,
} from "./catalogoMaterialiRepository";
import {
  aggiornaFamigliaCatalogo,
  aggiornaVarianteCatalogo,
  assicuraSeedCatalogoMateriali,
  caricaCatalogoMateriali,
  cercaCatalogoMateriali,
  creaFamigliaCatalogo,
  creaVarianteCatalogo,
  eliminaFamigliaCatalogo,
  eliminaVarianteCatalogo,
  filtraCatalogoPerCategoria,
  impostaAttivaFamigliaCatalogo,
  impostaAttivaVarianteCatalogo,
  inizializzaCatalogoMateriali,
  resetCatalogoMateriali,
} from "./materialiCatalogService";
import { contaCatalogoMaterialiSeed } from "./materialiCatalogDomain";

describe("catalogoMaterialiRepository", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("usa la storage key dedicata e non entra in APP_DATA_KEYS", () => {
    expect(STORAGE_KEYS.catalogoMateriali).toBe("preventivai.catalogoMateriali");
    expect(STORAGE_KEYS.catalogoMateriali in APP_DATA_KEYS).toBe(false);
    expect(catalogoMaterialiRepository.chiave).toBe(
      STORAGE_KEYS.catalogoMateriali
    );
  });

  it("repository vuoto → seed automatico al load", () => {
    expect(exists()).toBe(false);
    const catalogo = load();
    expect(exists()).toBe(true);
    expect(catalogo.length).toBe(CATALOGO_MATERIALI_SEED.length);
    expect(
      JSON.parse(localStorage.getItem(STORAGE_KEYS.catalogoMateriali) || "[]")
    ).toHaveLength(CATALOGO_MATERIALI_SEED.length);
  });

  it("repository già popolato → nessun reset", () => {
    const iniziale = load();
    const personalizzata = {
      ...iniziale[0],
      id: "custom-utente",
      nome: "Materiale utente",
      personalizzata: true,
      varianti: [
        {
          id: "custom-utente-a",
          famigliaId: "custom-utente",
          etichetta: "A",
          attributi: { tipo: "A" },
          attiva: true,
        },
      ],
    };
    save([...iniziale, personalizzata]);

    const ricaricato = load();
    expect(ricaricato.some((f) => f.id === "custom-utente")).toBe(true);
    expect(ricaricato).toHaveLength(iniziale.length + 1);
  });

  it("persiste load/save round-trip", () => {
    const catalogo = load();
    catalogo[0] = { ...catalogo[0], descrizione: "modificata" };
    save(catalogo);

    const grezzo = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.catalogoMateriali) || "[]"
    );
    expect(grezzo[0].descrizione).toBe("modificata");
    expect(loadRaw()[0].descrizione).toBe("modificata");
  });

  it("replace e reset ripristinano contenuti attesi", () => {
    load();
    replace([
      {
        id: "solo-test",
        nome: "Solo test",
        categoria: "generale",
        unitaDefault: "pz",
        attributoChiave: "tipo",
        personalizzata: true,
        attiva: true,
        varianti: [
          {
            id: "solo-test-1",
            famigliaId: "solo-test",
            etichetta: "1",
            attributi: { tipo: "1" },
            attiva: true,
          },
        ],
      },
    ]);
    expect(loadRaw()).toHaveLength(1);

    const ripristinato = reset();
    expect(ripristinato).toHaveLength(CATALOGO_MATERIALI_SEED.length);
  });

  it("dati corrotti/mancanti → comportamento sicuro e re-seed", () => {
    localStorage.setItem(STORAGE_KEYS.catalogoMateriali, "{not-json");
    expect(exists()).toBe(false);
    expect(load().length).toBe(CATALOGO_MATERIALI_SEED.length);

    localStorage.setItem(STORAGE_KEYS.catalogoMateriali, "null");
    expect(exists()).toBe(false);

    localStorage.setItem(STORAGE_KEYS.catalogoMateriali, "[]");
    expect(exists()).toBe(false);
    expect(load().length).toBeGreaterThan(0);

    // oggetti senza id/nome → normalizzazione vuota → re-seed
    localStorage.setItem(
      STORAGE_KEYS.catalogoMateriali,
      JSON.stringify([{ foo: 1 }, null, "x"])
    );
    expect(exists()).toBe(false);
    expect(load().length).toBe(CATALOGO_MATERIALI_SEED.length);
  });
});

describe("materialiCatalogService", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("seed idempotente: init ripetuta non duplica", () => {
    const a = assicuraSeedCatalogoMateriali();
    expect(a.seeded).toBe(true);
    const b = assicuraSeedCatalogoMateriali();
    expect(b.seeded).toBe(false);
    expect(b.catalogo).toHaveLength(a.catalogo.length);

    inizializzaCatalogoMateriali();
    inizializzaCatalogoMateriali();
    expect(caricaCatalogoMateriali()).toHaveLength(
      CATALOGO_MATERIALI_SEED.length
    );
    expect(contaCatalogoMaterialiSeed().famiglie).toBe(
      CATALOGO_MATERIALI_SEED.length
    );
  });

  it("CRUD famiglia personalizzata", () => {
    const creata = creaFamigliaCatalogo({
      nome: "Canalina custom",
      categoria: "elettrico",
      unitaDefault: "m",
      attributoChiave: "dimensione",
      descrizione: "Creata dall'utente",
    });

    expect(creata?.personalizzata).toBe(true);
    expect(creata?.id).toMatch(/^custom-/);
    expect(trovaInCatalogo(creata.id)?.nome).toBe("Canalina custom");

    const aggiornata = aggiornaFamigliaCatalogo(creata.id, {
      nome: "Canalina custom XL",
    });
    expect(aggiornata?.nome).toBe("Canalina custom XL");
    expect(aggiornata?.personalizzata).toBe(true);

    eliminaFamigliaCatalogo(creata.id, { hard: true });
    expect(trovaInCatalogo(creata.id)).toBeNull();
  });

  it("CRUD variante personalizzata su famiglia esistente", () => {
    caricaCatalogoMateriali();
    const variante = creaVarianteCatalogo("tubo-corrugato", {
      etichetta: "Ø63",
      attributi: { diametro: "63" },
    });

    expect(variante?.id).toBeTruthy();
    expect(variante?.famigliaId).toBe("tubo-corrugato");
    expect(
      trovaInCatalogo("tubo-corrugato")?.varianti.some((v) => v.etichetta === "Ø63")
    ).toBe(true);

    const aggiornata = aggiornaVarianteCatalogo(
      "tubo-corrugato",
      variante.id,
      { etichetta: "Ø63 rinforzato" }
    );
    expect(aggiornata?.etichetta).toBe("Ø63 rinforzato");

    eliminaVarianteCatalogo("tubo-corrugato", variante.id, { hard: true });
    expect(
      trovaInCatalogo("tubo-corrugato")?.varianti.some((v) => v.id === variante.id)
    ).toBe(false);
  });

  it("non modifica il seed originale in memoria", () => {
    const snapshot = CATALOGO_MATERIALI_SEED.length;
    creaFamigliaCatalogo({ nome: "Extra", categoria: "generale" });
    expect(CATALOGO_MATERIALI_SEED).toHaveLength(snapshot);
    expect(
      CATALOGO_MATERIALI_SEED.every((f) => f.personalizzata === false)
    ).toBe(true);
  });

  it("ricerca e filtro categoria", () => {
    caricaCatalogoMateriali();
    const tubi = cercaCatalogoMateriali("tubo corrugato");
    expect(tubi.some((f) => f.id === "tubo-corrugato")).toBe(true);

    const elettrico = filtraCatalogoPerCategoria("elettrico");
    expect(elettrico.length).toBeGreaterThan(5);
    expect(elettrico.every((f) => f.categoria === "elettrico")).toBe(true);

    const allarme = cercaCatalogoMateriali("", { categoria: "allarme" });
    expect(allarme.every((f) => f.categoria === "allarme")).toBe(true);
  });

  it("attiva/disattiva famiglia e variante", () => {
    caricaCatalogoMateriali();
    impostaAttivaFamigliaCatalogo("cassetta", false);
    expect(trovaInCatalogo("cassetta")?.attiva).toBe(false);

    const soloAttive = cercaCatalogoMateriali("", { soloAttive: true });
    expect(soloAttive.some((f) => f.id === "cassetta")).toBe(false);

    impostaAttivaFamigliaCatalogo("cassetta", true);
    impostaAttivaVarianteCatalogo("cassetta", "cassetta-503", false);
    const cassetta = trovaInCatalogo("cassetta");
    expect(cassetta?.varianti.find((v) => v.id === "cassetta-503")?.attiva).toBe(
      false
    );
  });

  it("reset service ripristina seed senza duplicazioni", () => {
    creaFamigliaCatalogo({ nome: "Temporanea", categoria: "generale" });
    expect(caricaCatalogoMateriali().length).toBeGreaterThan(
      CATALOGO_MATERIALI_SEED.length
    );

    const ripristinato = resetCatalogoMateriali();
    expect(ripristinato).toHaveLength(CATALOGO_MATERIALI_SEED.length);
    expect(ripristinato.every((f) => f.personalizzata === false)).toBe(true);
  });
});

function trovaInCatalogo(id) {
  return caricaCatalogoMateriali().find((f) => f.id === id) || null;
}
