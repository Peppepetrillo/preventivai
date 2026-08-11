import { beforeEach, describe, expect, it } from "vitest";

import { STORAGE_KEYS } from "../../app/storageKeys";
import { creaCantiere } from "../../features/cantieri/cantieriDomain";
import {
  leggiCantieri,
  salvaCantieri,
} from "../../repositories/cantieriRepository";
import { leggiListaSpesa } from "../listaSpesa";
import {
  aggiornaDistintaMateriali,
  creaDistintaMateriali,
  trovaDistintaPerId,
} from "./distintaMaterialiService";
import {
  collegaESincronizzaDistintaACantiere,
  risincronizzaDistintaSeCollegata,
  scollegaDistintaDaCantiereSoft,
  sincronizzaDistintaSuCantiere,
} from "./distintaCantiereService";

function seedCantiere(overrides = {}) {
  const cantiere = {
    ...creaCantiere({
      nome: "Villa Test",
      cliente: "Rossi",
      indirizzo: "Via Roma 1",
    }),
    ...overrides,
  };
  salvaCantieri([cantiere]);
  return cantiere;
}

describe("distintaCantiereService", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("collega distinta, proietta su cantiere e lista spesa", () => {
    const cantiere = seedCantiere();
    const distinta = creaDistintaMateriali({
      titolo: "BOM",
      voci: [
        {
          nome: "Tubo corrugato Ø25",
          quantita: 50,
          unita: "m",
          famigliaId: "fam-1",
          varianteId: "var-1",
        },
        { nome: "Libero", quantita: 2, unita: "pz" },
      ],
    });

    const risultato = collegaESincronizzaDistintaACantiere(
      distinta.id,
      cantiere.id
    );
    expect(risultato.ok).toBe(true);
    expect(risultato.distinta.collegamenti.cantiereId).toBe(String(cantiere.id));
    expect(risultato.distinta.collegamenti.listaSpesaSyncAt).toBeTruthy();

    const cantieri = leggiCantieri();
    expect(cantieri[0].materiali).toHaveLength(2);
    expect(cantieri[0].materiali[0].varianteId).toBe("var-1");
    expect(cantieri[0].materiali[0].distintaVoceId).toBeTruthy();

    const lista = leggiListaSpesa();
    expect(lista).toHaveLength(2);
    expect(lista[0].distintaVoceId).toBeTruthy();
    expect(lista[0].lavoroId).toBe(String(cantiere.id));
  });

  it("sync ripetuto è idempotente (no duplicati)", () => {
    const cantiere = seedCantiere();
    const distinta = creaDistintaMateriali({
      titolo: "BOM",
      voci: [{ nome: "Cavo", quantita: 10, unita: "m", varianteId: "v-cavo" }],
    });

    collegaESincronizzaDistintaACantiere(distinta.id, cantiere.id);
    sincronizzaDistintaSuCantiere(distinta.id, cantiere.id);
    sincronizzaDistintaSuCantiere(distinta.id, cantiere.id);

    expect(leggiCantieri()[0].materiali).toHaveLength(1);
    expect(leggiListaSpesa()).toHaveLength(1);
  });

  it("aggiorna quantità su cantiere e lista spesa", () => {
    const cantiere = seedCantiere();
    const distinta = creaDistintaMateriali({
      titolo: "BOM",
      voci: [{ nome: "Cavo", quantita: 10, unita: "m", varianteId: "v1" }],
    });
    collegaESincronizzaDistintaACantiere(distinta.id, cantiere.id);

    const voceId = trovaDistintaPerId(distinta.id).voci[0].id;
    aggiornaDistintaMateriali(distinta.id, {
      voci: [{ id: voceId, nome: "Cavo", quantita: 25, unita: "m", varianteId: "v1" }],
    });
    risincronizzaDistintaSeCollegata(distinta.id);

    expect(leggiCantieri()[0].materiali[0].quantita).toBe(25);
    expect(leggiListaSpesa()[0].quantita).toBe(25);
  });

  it("scollega senza cancellare materiali del cantiere", () => {
    const cantiere = seedCantiere();
    const distinta = creaDistintaMateriali({
      titolo: "BOM",
      voci: [{ nome: "Tubo", quantita: 5, unita: "m" }],
    });
    collegaESincronizzaDistintaACantiere(distinta.id, cantiere.id);
    expect(leggiCantieri()[0].materiali).toHaveLength(1);

    const out = scollegaDistintaDaCantiereSoft(distinta.id);
    expect(out.ok).toBe(true);
    expect(out.distinta.collegamenti.cantiereId).toBeUndefined();
    expect(leggiCantieri()[0].materiali).toHaveLength(1);
    expect(localStorage.getItem(STORAGE_KEYS.listaSpesa)).toBeTruthy();
  });
});
