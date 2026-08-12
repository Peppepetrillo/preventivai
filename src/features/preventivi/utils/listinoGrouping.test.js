import { describe, expect, it } from "vitest";

import {
  calcolaNumeroVociCarrello,
  creaMappaQuantitaCarrello,
  creaStatoCategorieAperteDaRicerca,
  filtraListino,
  haRicercaListinoAttiva,
  quantitaDaMappa,
  quantitaVoceNelCarrello,
  raggruppaListinoPerCategoria,
  risolviStatoCategorieAperte,
} from "./listinoGrouping";

describe("listinoGrouping", () => {
  const listino = [
    { id: "1", nome: "Punto luce", categoria: "Illuminazione", prezzo: 45 },
    { id: "2", nome: "Punto presa", categoria: "Impianto", prezzo: 55 },
    { id: "3", nome: "Plafoniera", categoria: "Illuminazione", prezzo: 40 },
  ];

  it("raggruppa le voci per categoria", () => {
    const gruppi = raggruppaListinoPerCategoria(listino);

    expect(gruppi).toHaveLength(2);
    expect(gruppi.find((g) => g.nome === "Illuminazione")?.voci).toHaveLength(2);
  });

  it("filtra il listino per testo di ricerca", () => {
    const risultati = filtraListino(listino, "presa");

    expect(risultati).toHaveLength(1);
    expect(risultati[0].nome).toBe("Punto presa");
  });

  it("calcola la quantità nel carrello per nome voce", () => {
    const lavorazioni = [
      { nome: "Punto luce", quantita: 3 },
      { nome: "Punto presa", quantita: 1 },
    ];

    expect(
      quantitaVoceNelCarrello(lavorazioni, { nome: "Punto luce" })
    ).toBe(3);
  });

  it("usa la mappa quantità per lookup O(1)", () => {
    const mappa = creaMappaQuantitaCarrello([
      { nome: "Punto luce", quantita: 2 },
    ]);

    expect(quantitaDaMappa(mappa, { nome: "Punto luce" })).toBe(2);
    expect(calcolaNumeroVociCarrello([{ nome: "A", quantita: 2 }])).toBe(2);
  });

  it("haRicercaListinoAttiva distingue ricerca vuota da attiva", () => {
    expect(haRicercaListinoAttiva("")).toBe(false);
    expect(haRicercaListinoAttiva("   ")).toBe(false);
    expect(haRicercaListinoAttiva("presa")).toBe(true);
  });

  it("creaStatoCategorieAperteDaRicerca apre solo con ricerca attiva", () => {
    const categorie = raggruppaListinoPerCategoria(
      filtraListino(listino, "presa")
    );

    expect(creaStatoCategorieAperteDaRicerca(categorie, "")).toBeNull();
    expect(creaStatoCategorieAperteDaRicerca(categorie, "presa")).toEqual({
      Impianto: true,
    });
  });

  it("risolviStatoCategorieAperte apre categorie con risultati in ricerca", () => {
    const filtrato = filtraListino(listino, "presa");
    const categorie = raggruppaListinoPerCategoria(filtrato);

    expect(
      risolviStatoCategorieAperte({
        categorie,
        categorieAperteDefault: ["Illuminazione"],
        ricerca: "presa",
        overrideAperte: {},
      })
    ).toEqual({ Impianto: true });
  });

  it("risolviStatoCategorieAperte ripristina default senza ricerca", () => {
    const categorie = raggruppaListinoPerCategoria(listino);

    expect(
      risolviStatoCategorieAperte({
        categorie,
        categorieAperteDefault: ["Illuminazione"],
        ricerca: "",
        overrideAperte: {},
      })
    ).toEqual({
      Illuminazione: true,
      Impianto: false,
    });
  });
});
