import { describe, expect, it } from "vitest";

import {
  LISTINI_CATALOGHI,
  VOCE_LISTINO_CAMPI_FUTURI,
  aggiornaVoceCatalogo,
  catalogoNecessitaMigrazione,
  creaVoceCatalogo,
  elencaCategorieCatalogo,
  eliminaVoceCatalogo,
  filtraCatalogoPerRicerca,
  normalizzaCatalogo,
  normalizzaVoceCatalogo,
  ordinaCatalogo,
  selezionaVociAttive,
} from "./listinoCatalogDomain";

describe("listinoCatalogDomain", () => {
  it("normalizza voci legacy senza campi Sprint 12A", () => {
    const voce = normalizzaVoceCatalogo(
      { id: "punto-luce", nome: "Punto luce", prezzo: 45, categoria: "Impianto" },
      0
    );

    expect(voce).toMatchObject({
      id: "punto-luce",
      nome: "Punto luce",
      categoria: "Impianto",
      descrizione: "",
      unita: "cad",
      prezzo: 45,
      attiva: true,
      preferita: false,
      ordinamento: 0,
    });
  });

  it("rileva migrazione quando mancano campi catalogo", () => {
    expect(
      catalogoNecessitaMigrazione([{ id: "1", nome: "A", prezzo: 1 }])
    ).toBe(true);
    expect(
      catalogoNecessitaMigrazione([
        {
          id: "1",
          nome: "A",
          prezzo: 1,
          descrizione: "",
          attiva: true,
          preferita: false,
          ordinamento: 0,
        },
      ])
    ).toBe(false);
  });

  it("crea, aggiorna ed elimina voci", () => {
    const creata = creaVoceCatalogo({
      nome: "Canalina",
      prezzo: 12,
      categoria: "Materiali",
      unita: "m",
    });
    expect(creata.nome).toBe("Canalina");
    expect(creata.attiva).toBe(true);

    const elenco = normalizzaCatalogo([creata]);
    const aggiornato = aggiornaVoceCatalogo(elenco, creata.id, {
      preferita: true,
      prezzo: 15,
    });
    expect(aggiornato[0].preferita).toBe(true);
    expect(aggiornato[0].prezzo).toBe(15);

    expect(eliminaVoceCatalogo(aggiornato, creata.id)).toEqual([]);
  });

  it("filtra, ordina preferiti e seleziona solo attive", () => {
    const elenco = normalizzaCatalogo([
      {
        id: "a",
        nome: "Punto luce",
        categoria: "Impianto",
        prezzo: 45,
        preferita: false,
        attiva: true,
        ordinamento: 20,
      },
      {
        id: "b",
        nome: "Manodopera",
        categoria: "Assistenza",
        prezzo: 38,
        preferita: true,
        attiva: true,
        ordinamento: 10,
      },
      {
        id: "c",
        nome: "Vecchia voce",
        categoria: "Impianto",
        prezzo: 1,
        preferita: false,
        attiva: false,
        ordinamento: 5,
      },
    ]);

    expect(filtraCatalogoPerRicerca(elenco, "mano")[0].id).toBe("b");
    expect(ordinaCatalogo(elenco)[0].id).toBe("b");
    expect(selezionaVociAttive(elenco).map((v) => v.id)).toEqual(["b", "a"]);
    expect(elencaCategorieCatalogo(elenco)).toEqual([
      "Assistenza",
      "Impianto",
    ]);
  });

  it("predispone registry multi-listino e campi futuri senza implementarli", () => {
    expect(LISTINI_CATALOGHI.bticino.stato).toBe("riservato");
    expect(LISTINI_CATALOGHI.vimar.stato).toBe("riservato");
    expect(LISTINI_CATALOGHI.gewiss.stato).toBe("riservato");
    expect(LISTINI_CATALOGHI.personale.stato).toBe("riservato");
    expect(VOCE_LISTINO_CAMPI_FUTURI).toEqual(
      expect.arrayContaining([
        "serieCompatibili",
        "marca",
        "iva",
        "codiceArticolo",
        "tempoMedioInstallazione",
      ])
    );
  });

  it("rifiuta creazione senza nome", () => {
    expect(() => creaVoceCatalogo({ nome: "  " })).toThrow(/nome/i);
  });
});
