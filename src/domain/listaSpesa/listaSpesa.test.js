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

  it("segna una voce come acquistata", () => {
    const voce = aggiungiVoceListaSpesa({ nome: "Cassetta 503" });
    toggleAcquistatoListaSpesa(voce.id);
    expect(leggiDaComprare()).toHaveLength(0);
    expect(localStorage.getItem(STORAGE_KEYS.listaSpesa)).toBeTruthy();
  });
});
