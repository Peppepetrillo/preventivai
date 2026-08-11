import { beforeEach, describe, expect, it } from "vitest";

import { STORAGE_KEYS } from "../../app/storageKeys";
import {
  aggiungiVoceListaSpesa,
  leggiDaComprare,
  sincronizzaListaSpesaDaCantiere,
  toggleAcquistatoListaSpesa,
} from "./index";

describe("listaSpesa domain", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("aggiunge voci alla lista spesa", () => {
    aggiungiVoceListaSpesa({ nome: "Magnetotermico", quantita: 1 });
    aggiungiVoceListaSpesa({ nome: "Differenziale", quantita: 2 });
    expect(leggiDaComprare()).toHaveLength(2);
  });

  it("sincronizza materiali da un cantiere", () => {
    sincronizzaListaSpesaDaCantiere({
      id: "c1",
      cliente: "Rossi",
      dataIntervento: "29/07/2026",
      materiali: [
        { id: "m1", nome: "Tubo 25", quantita: 10, unita: "m", acquistato: false },
        { id: "m2", nome: "Cavo", quantita: 20, unita: "m", acquistato: true },
      ],
    });

    const daComprare = leggiDaComprare();
    expect(daComprare).toHaveLength(1);
    expect(daComprare[0].nome).toBe("Tubo 25");
    expect(daComprare[0].lavoroId).toBe("c1");
  });

  it("sync ripetuto non crea duplicati e aggiorna quantità", () => {
    const cantiere = {
      id: "c2",
      cliente: "Bianchi",
      materiali: [
        {
          id: "m1",
          nome: "Tubo",
          quantita: 10,
          unita: "m",
          varianteId: "var-t",
          distintaVoceId: "dv-1",
          acquistato: false,
        },
      ],
    };
    sincronizzaListaSpesaDaCantiere(cantiere);
    sincronizzaListaSpesaDaCantiere({
      ...cantiere,
      materiali: [{ ...cantiere.materiali[0], quantita: 40 }],
    });

    const daComprare = leggiDaComprare().filter((v) => v.lavoroId === "c2");
    expect(daComprare).toHaveLength(1);
    expect(daComprare[0].quantita).toBe(40);
    expect(daComprare[0].varianteId).toBe("var-t");
    expect(daComprare[0].distintaVoceId).toBe("dv-1");
  });

  it("dedup preferisce varianteId e distintaVoceId", () => {
    sincronizzaListaSpesaDaCantiere({
      id: "c3",
      materiali: [
        {
          id: "a",
          nome: "Nome A",
          quantita: 1,
          unita: "pz",
          varianteId: "same-var",
          distintaVoceId: "dv-a",
        },
      ],
    });
    sincronizzaListaSpesaDaCantiere({
      id: "c3",
      materiali: [
        {
          id: "b",
          nome: "Nome B diverso",
          quantita: 5,
          unita: "pz",
          varianteId: "same-var",
          distintaVoceId: "dv-b",
        },
      ],
    });
    const voci = leggiDaComprare().filter((v) => v.lavoroId === "c3");
    expect(voci).toHaveLength(1);
    expect(voci[0].quantita).toBe(5);
  });

  it("segna una voce come acquistata", () => {
    const voce = aggiungiVoceListaSpesa({ nome: "Cassetta 503" });
    toggleAcquistatoListaSpesa(voce.id);
    expect(leggiDaComprare()).toHaveLength(0);
    expect(localStorage.getItem(STORAGE_KEYS.listaSpesa)).toBeTruthy();
  });
});
