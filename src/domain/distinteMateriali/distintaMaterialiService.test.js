import { beforeEach, describe, expect, it } from "vitest";

import { APP_DATA_KEYS, STORAGE_KEYS } from "../../app/storageKeys";
import {
  aggiungiVoceDistinta,
  aggiornaDistintaMateriali,
  caricaDistinteMateriali,
  cercaDistinteMateriali,
  collegaDistintaACantiere,
  collegaDistintaAPreventivo,
  creaDistintaMateriali,
  duplicaDistintaMateriali,
  eliminaDistintaMateriali,
  inizializzaDistinteMateriali,
  modificaVoceDistinta,
  rimuoviVoceDistinta,
  resetDistinteMateriali,
  scollegaDistintaDaCantiere,
  scollegaDistintaDaPreventivo,
  totaleDistintaMateriali,
} from "./distintaMaterialiService";
import {
  distinteMaterialiRepository,
  exists,
  load,
  loadRaw,
  replace,
  reset,
  save,
} from "./distinteMaterialiRepository";

describe("distinteMaterialiRepository", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("usa storage key dedicata e non entra in APP_DATA_KEYS", () => {
    expect(STORAGE_KEYS.distinteMateriali).toBe("preventivai.distinteMateriali");
    expect(STORAGE_KEYS.distinteMateriali in APP_DATA_KEYS).toBe(false);
    expect(distinteMaterialiRepository.chiave).toBe(
      STORAGE_KEYS.distinteMateriali
    );
  });

  it("dati vuoti → load array vuoto senza seed forzato", () => {
    expect(exists()).toBe(false);
    expect(load()).toEqual([]);
    expect(loadRaw()).toEqual([]);
  });

  it("persiste load/save round-trip", () => {
    save([
      {
        id: "d1",
        titolo: "Test",
        voci: [
          {
            id: "v1",
            nome: "Tubo",
            unita: "m",
            quantita: 10,
          },
        ],
        collegamenti: {},
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    ]);

    expect(exists()).toBe(true);
    expect(load()).toHaveLength(1);
    expect(load()[0].titolo).toBe("Test");
    expect(
      JSON.parse(localStorage.getItem(STORAGE_KEYS.distinteMateriali) || "[]")
    ).toHaveLength(1);
  });

  it("replace e reset", () => {
    save([{ id: "d1", titolo: "A", voci: [], collegamenti: {} }]);
    replace([{ id: "d2", titolo: "B", voci: [], collegamenti: {} }]);
    expect(load()).toHaveLength(1);
    expect(load()[0].id).toBe("d2");

    expect(reset()).toEqual([]);
    expect(exists()).toBe(false);
  });

  it("dati corrotti → comportamento sicuro", () => {
    localStorage.setItem(STORAGE_KEYS.distinteMateriali, "{bad");
    expect(exists()).toBe(false);
    expect(load()).toEqual([]);

    localStorage.setItem(STORAGE_KEYS.distinteMateriali, "null");
    expect(load()).toEqual([]);

    localStorage.setItem(
      STORAGE_KEYS.distinteMateriali,
      JSON.stringify([{ foo: 1 }, { titolo: "" }, null])
    );
    expect(exists()).toBe(false);
    expect(load()).toEqual([]);
  });

  it("nessuna duplicazione id in save", () => {
    save([
      { id: "d1", titolo: "A", voci: [], collegamenti: {} },
      { id: "d1", titolo: "Duplicata", voci: [], collegamenti: {} },
    ]);
    expect(load()).toHaveLength(1);
    expect(load()[0].titolo).toBe("A");
  });
});

describe("distintaMaterialiService", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("inizializzazione idempotente", () => {
    const a = inizializzaDistinteMateriali();
    const b = inizializzaDistinteMateriali();
    expect(a).toEqual([]);
    expect(b).toEqual([]);
    expect(localStorage.getItem(STORAGE_KEYS.distinteMateriali)).toBe("[]");
  });

  it("CRUD distinta + ricerca", () => {
    const creata = creaDistintaMateriali({
      titolo: "Predisposizione Rossi",
      clienteNome: "Rossi",
    });
    expect(creata?.id).toBeTruthy();
    expect(caricaDistinteMateriali()).toHaveLength(1);

    const aggiornata = aggiornaDistintaMateriali(creata.id, {
      titolo: "Predisposizione Rossi v2",
    });
    expect(aggiornata?.titolo).toBe("Predisposizione Rossi v2");

    expect(cercaDistinteMateriali("rossi")).toHaveLength(1);
    expect(eliminaDistintaMateriali(creata.id)).toBe(true);
    expect(caricaDistinteMateriali()).toHaveLength(0);
  });

  it("aggiunge voce catalogo e voce libera, modifica e rimuove", () => {
    const distinta = creaDistintaMateriali({ titolo: "BOM" });

    let aggiornata = aggiungiVoceDistinta(distinta.id, {
      varianteId: "cavo-multipolare-3x2-5",
      quantita: 120,
    });
    expect(aggiornata.voci[0].nome).toBe("Cavo multipolare — 3×2,5");
    expect(aggiornata.voci[0].unita).toBe("m");
    expect(aggiornata.voci[0].varianteId).toBe("cavo-multipolare-3x2-5");

    aggiornata = aggiungiVoceDistinta(distinta.id, {
      nome: "Accessorio libero",
      unita: "pz",
      quantita: 4,
    });
    expect(aggiornata.voci).toHaveLength(2);

    const voceId = aggiornata.voci[0].id;
    aggiornata = modificaVoceDistinta(distinta.id, voceId, { quantita: 150 });
    expect(aggiornata.voci.find((v) => v.id === voceId)?.quantita).toBe(150);

    aggiornata = rimuoviVoceDistinta(distinta.id, voceId);
    expect(aggiornata.voci).toHaveLength(1);
    expect(aggiornata.voci[0].nome).toBe("Accessorio libero");
  });

  it("duplica distinta e calcola totali", () => {
    const distinta = creaDistintaMateriali({ titolo: "Originale" });
    aggiungiVoceDistinta(distinta.id, {
      nome: "Canalina",
      unita: "m",
      quantita: 15,
      prezzoUnitario: 2,
    });

    const copia = duplicaDistintaMateriali(distinta.id);
    expect(copia?.titolo).toBe("Originale (copia)");
    expect(copia?.collegamenti).toEqual({});
    expect(caricaDistinteMateriali()).toHaveLength(2);

    expect(totaleDistintaMateriali(distinta.id)).toEqual({
      voci: 1,
      quantitaTotale: 15,
      importoTotale: 30,
      haPrezzi: true,
    });
  });

  it("collega/scollega preventivo e cantiere", () => {
    const distinta = creaDistintaMateriali({ titolo: "Linkabile" });

    let d = collegaDistintaAPreventivo(distinta.id, "prev-1");
    expect(d.collegamenti.preventivoId).toBe("prev-1");
    expect(cercaDistinteMateriali("", { preventivoId: "prev-1" })).toHaveLength(
      1
    );

    d = scollegaDistintaDaPreventivo(distinta.id);
    expect(d.collegamenti.preventivoId).toBeUndefined();

    d = collegaDistintaACantiere(distinta.id, "cant-9");
    expect(d.collegamenti.cantiereId).toBe("cant-9");
    d = scollegaDistintaDaCantiere(distinta.id);
    expect(d.collegamenti.cantiereId).toBeUndefined();
  });

  it("reset service svuota senza effetti collaterali su altre keys", () => {
    creaDistintaMateriali({ titolo: "Temp" });
    localStorage.setItem(STORAGE_KEYS.listaSpesa, JSON.stringify([{ id: "x" }]));
    resetDistinteMateriali();
    expect(caricaDistinteMateriali()).toEqual([]);
    expect(localStorage.getItem(STORAGE_KEYS.listaSpesa)).toContain("x");
  });
});
