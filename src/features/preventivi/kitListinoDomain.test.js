import { describe, expect, it } from "vitest";
import { listinoBase } from "../../data/listinoBase";
import {
  aggiungiKitALavorazioni,
  creaLavorazioniDaKit,
  trovaKitListino,
} from "./kitListinoDomain";

describe("kitListinoDomain", () => {
  it("crea lavorazioni da un kit usando il listino esistente", () => {
    const kit = trovaKitListino("camera-standard");

    expect(creaLavorazioniDaKit(kit, listinoBase)).toEqual([
      expect.objectContaining({
        nome: "Punto luce",
        quantita: 2,
      }),
      expect.objectContaining({
        nome: "Punto presa",
        quantita: 4,
      }),
      expect.objectContaining({
        nome: "Montaggio plafoniera",
        quantita: 1,
      }),
    ]);
  });

  it("aggiunge un kit incrementando le quantità delle lavorazioni già presenti", () => {
    const lavorazioni = [
      {
        id: "manuale-presa",
        nome: "Punto presa",
        categoria: "Impianto",
        prezzo: 55,
        quantita: 1,
        unita: "cad",
      },
    ];

    const risultato = aggiungiKitALavorazioni(
      lavorazioni,
      listinoBase,
      "camera-standard"
    );

    expect(risultato.find((voce) => voce.nome === "Punto presa").quantita).toBe(5);
    expect(risultato.filter((voce) => voce.nome === "Punto presa")).toHaveLength(1);
  });

  it("ignora kit inesistenti lasciando invariate le lavorazioni", () => {
    const lavorazioni = [{ nome: "Voce esistente" }];

    expect(aggiungiKitALavorazioni(lavorazioni, listinoBase, "inesistente")).toBe(
      lavorazioni
    );
  });
});
