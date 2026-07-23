import { describe, expect, it } from "vitest";

import { listinoBase } from "./listinoBase";
import {
  elencaCategorieCatalogo,
  filtraCatalogoPerRicerca,
  normalizzaCatalogo,
} from "../features/listino/listinoCatalogDomain";

const CATEGORIE_ATTESE = [
  "Antenna",
  "Citofonia",
  "Clima",
  "Comandi",
  "Domotica",
  "Illuminazione",
  "LED",
  "Prese",
  "Quadri",
  "Sicurezza",
  "TV / Dati",
];

describe("listinoBase Sprint 12B", () => {
  it("contiene 20 lavorazioni normalizzate senza duplicati", () => {
    expect(listinoBase).toHaveLength(20);

    const ids = listinoBase.map((v) => v.id);
    expect(new Set(ids).size).toBe(ids.length);

    const nomi = listinoBase.map((v) => v.nome.toLowerCase());
    expect(new Set(nomi).size).toBe(nomi.length);
  });

  it("rispetta il modello catalogo e i flag di default", () => {
    const catalogo = normalizzaCatalogo(listinoBase);

    catalogo.forEach((voce) => {
      expect(voce.id).toBeTruthy();
      expect(voce.categoria).toBeTruthy();
      expect(voce.nome).toBeTruthy();
      expect(voce.descrizione).toBe("");
      expect(Number.isFinite(voce.prezzo)).toBe(true);
      expect(voce.prezzo).toBeGreaterThanOrEqual(0);
      expect(voce.unita).toBeTruthy();
      expect(voce.attiva).toBe(true);
      expect(voce.preferita).toBe(false);
      expect(Number.isFinite(voce.ordinamento)).toBe(true);
    });
  });

  it("organizza le categorie professionali attese", () => {
    expect(elencaCategorieCatalogo(listinoBase)).toEqual(CATEGORIE_ATTESE);
  });

  it("mantiene unità coerenti (cad / m)", () => {
    const unita = [...new Set(listinoBase.map((v) => v.unita))];
    expect(unita.sort()).toEqual(["cad", "m"]);
    expect(listinoBase.find((v) => v.id === "strip-led").unita).toBe("m");
  });

  it("scompone i punti civili allo stesso prezzo base", () => {
    const punti = [
      "punto-luce",
      "punto-presa",
      "punto-interruttore",
      "punto-deviatore",
      "punto-invertitore",
      "punto-pulsante",
    ].map((id) => listinoBase.find((v) => v.id === id));

    punti.forEach((voce) => {
      expect(voce.prezzo).toBe(40);
      expect(voce.unita).toBe("cad");
    });
  });

  it("supporta la ricerca catalogo su nomi professionali", () => {
    expect(filtraCatalogoPerRicerca(listinoBase, "ethernet")[0].id).toBe(
      "punto-ethernet"
    );
    expect(filtraCatalogoPerRicerca(listinoBase, "gateway")[0].nome).toBe(
      "Gateway Living Now"
    );
  });

  it("segnala Gateway senza prezzo inventato (anomalia PDF aggregata)", () => {
    expect(
      listinoBase.find((v) => v.id === "gateway-living-now").prezzo
    ).toBe(0);
  });
});
