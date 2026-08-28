import { describe, expect, it } from "vitest";

import { CATALOGO_MATERIALI_SEED } from "../catalogoMateriali/materialiCatalogoSeed";
import {
  aggiungiVoce,
  aggiornaDistinta,
  calcolaTotaleMateriali,
  collegaCantiere,
  collegaPreventivo,
  costruisciVociAccessoriSuggeriti,
  creaDistinta,
  duplicaDistinta,
  elencaSuggerimentiAccessoriPerVoce,
  modificaVoce,
  normalizzaDistinta,
  normalizzaElencoDistinte,
  normalizzaQuantita,
  normalizzaVoceDistinta,
  rimuoviVoce,
  scollegaCantiere,
  scollegaPreventivo,
  validaDistinta,
} from "./distintaMaterialiDomain";

describe("distintaMaterialiDomain — creazione e aggiornamento", () => {
  it("crea una distinta autonoma senza collegamenti", () => {
    const distinta = creaDistinta({
      titolo: "Predisposizione cliente Rossi",
      note: "Solo materiali",
    });

    expect(distinta).toEqual(
      expect.objectContaining({
        titolo: "Predisposizione cliente Rossi",
        note: "Solo materiali",
        voci: [],
        collegamenti: {},
      })
    );
    expect(distinta?.id).toMatch(/^distinta-/);
    expect(distinta?.createdAt).toBeTruthy();
    expect(distinta?.clienteId).toBeUndefined();
  });

  it("rifiuta distinta senza titolo", () => {
    expect(creaDistinta({ titolo: "  " })).toBeNull();
  });

  it("aggiorna titolo e cliente senza toccare ownership", () => {
    const base = creaDistinta({ titolo: "BOM A" });
    const aggiornata = aggiornaDistinta(base, {
      titolo: "BOM B",
      clienteNome: "Rossi",
      clienteId: "cli-1",
    });

    expect(aggiornata?.titolo).toBe("BOM B");
    expect(aggiornata?.clienteNome).toBe("Rossi");
    expect(aggiornata?.id).toBe(base.id);
    expect(aggiornata?.collegamenti).toEqual({});
  });
});

describe("distintaMaterialiDomain — voci", () => {
  it("aggiunge voce da catalogo con snapshot nome/unità", () => {
    const base = creaDistinta({ titolo: "Predisposizione" });
    const conVoce = aggiungiVoce(
      base,
      { varianteId: "tubo-corrugato-25", quantita: 80 },
      CATALOGO_MATERIALI_SEED
    );

    expect(conVoce?.voci).toHaveLength(1);
    const voce = conVoce.voci[0];
    expect(voce.famigliaId).toBe("tubo-corrugato");
    expect(voce.varianteId).toBe("tubo-corrugato-25");
    expect(voce.nome).toBe("Tubo corrugato — Ø25");
    expect(voce.unita).toBe("m");
    expect(voce.quantita).toBe(80);
  });

  it("aggiunge voce libera senza id catalogo", () => {
    const base = creaDistinta({ titolo: "Extra" });
    const conVoce = aggiungiVoce(base, {
      nome: "Materiale custom",
      unita: "cad",
      quantita: 3,
    });

    expect(conVoce?.voci[0]).toEqual(
      expect.objectContaining({
        nome: "Materiale custom",
        unita: "pz",
        quantita: 3,
      })
    );
    expect(conVoce?.voci[0].famigliaId).toBeUndefined();
    expect(conVoce?.voci[0].varianteId).toBeUndefined();
  });

  it("modifica quantità e unità mantenendo snapshot nome", () => {
    let distinta = creaDistinta({ titolo: "X" });
    distinta = aggiungiVoce(
      distinta,
      { varianteId: "cassetta-503", quantita: 12 },
      CATALOGO_MATERIALI_SEED
    );
    const voceId = distinta.voci[0].id;

    distinta = modificaVoce(distinta, voceId, { quantita: 20, unita: "confezione" });
    expect(distinta.voci[0].quantita).toBe(20);
    expect(distinta.voci[0].unita).toBe("confezione");
    expect(distinta.voci[0].nome).toBe("Cassetta — 503");
    expect(distinta.voci[0].varianteId).toBe("cassetta-503");
  });

  it("elimina una voce", () => {
    let distinta = creaDistinta({ titolo: "X" });
    distinta = aggiungiVoce(distinta, {
      nome: "A",
      unita: "pz",
      quantita: 1,
    });
    distinta = aggiungiVoce(distinta, {
      nome: "B",
      unita: "m",
      quantita: 2,
    });
    const id = distinta.voci[0].id;
    distinta = rimuoviVoce(distinta, id);
    expect(distinta.voci).toHaveLength(1);
    expect(distinta.voci[0].nome).toBe("B");
  });

  it("preserva snapshot anche se la variante catalogo cambia semanticamente", () => {
    const voce = normalizzaVoceDistinta({
      id: "v1",
      famigliaId: "tubo-corrugato",
      varianteId: "tubo-corrugato-25",
      nome: "Tubo storico Ø25",
      unita: "m",
      quantita: 10,
    });
    expect(voce.nome).toBe("Tubo storico Ø25");
    expect(voce.unita).toBe("m");
  });
});

describe("distintaMaterialiDomain — duplicazione e totali", () => {
  it("duplica senza copiare i soft link", () => {
    let distinta = creaDistinta({ titolo: "Originale" });
    distinta = aggiungiVoce(distinta, {
      nome: "Cavo",
      unita: "m",
      quantita: 100,
      prezzoUnitario: 1.2,
    });
    distinta = collegaPreventivo(distinta, "prev-1");
    distinta = collegaCantiere(distinta, "cant-1");

    const copia = duplicaDistinta(distinta);
    expect(copia?.id).not.toBe(distinta.id);
    expect(copia?.titolo).toBe("Originale (copia)");
    expect(copia?.voci).toHaveLength(1);
    expect(copia?.voci[0].id).not.toBe(distinta.voci[0].id);
    expect(copia?.voci[0].nome).toBe("Cavo");
    expect(copia?.collegamenti).toEqual({});
  });

  it("calcola totali quantità e importo", () => {
    let distinta = creaDistinta({ titolo: "T" });
    distinta = aggiungiVoce(distinta, {
      nome: "A",
      unita: "pz",
      quantita: 2,
      prezzoUnitario: 5,
    });
    distinta = aggiungiVoce(distinta, {
      nome: "B",
      unita: "m",
      quantita: 10,
      prezzoUnitario: 1.5,
    });

    expect(calcolaTotaleMateriali(distinta)).toEqual({
      voci: 2,
      quantitaTotale: 12,
      importoTotale: 25,
      haPrezzi: true,
    });
  });
});

describe("distintaMaterialiDomain — validazione e normalizzazione", () => {
  it("normalizza quantità non valide", () => {
    expect(normalizzaQuantita(-1)).toBe(1);
    expect(normalizzaQuantita("abc")).toBe(1);
    expect(normalizzaQuantita(0, 3)).toBe(3);
    expect(normalizzaQuantita(7.5)).toBe(7.5);
  });

  it("valida distinta corretta e segnala errori", () => {
    const ok = creaDistinta({ titolo: "OK" });
    expect(validaDistinta(ok).ok).toBe(true);

    expect(validaDistinta(null).ok).toBe(false);
    expect(
      validaDistinta({
        id: "d1",
        titolo: "",
        voci: [{ id: "v1", nome: "", unita: "m", quantita: 0 }],
        collegamenti: {},
        createdAt: "",
        updatedAt: "",
      }).errori
    ).toEqual(
      expect.arrayContaining([
        "titolo obbligatorio",
        "nome snapshot mancante su v1",
        "quantita non valida su v1",
      ])
    );
  });

  it("normalizza elenco scartando corrotti e duplicati", () => {
    const elenco = normalizzaElencoDistinte([
      null,
      { titolo: "" },
      { id: "d1", titolo: "A", voci: [] },
      { id: "d1", titolo: "Duplicata", voci: [] },
      { id: "d2", titolo: "B", voci: [{ nome: "X", unita: "cad", quantita: 1 }] },
    ]);

    expect(elenco).toHaveLength(2);
    expect(elenco[0].titolo).toBe("A");
    expect(elenco[1].voci[0].unita).toBe("pz");
  });

  it("normalizzaDistinta richiede titolo", () => {
    expect(normalizzaDistinta({ titolo: "" })).toBeNull();
  });
});

describe("distintaMaterialiDomain — collegamenti soft", () => {
  it("collega e scollega preventivo senza ownership", () => {
    let distinta = creaDistinta({ titolo: "Link" });
    distinta = collegaPreventivo(distinta, "prev-99");
    expect(distinta.collegamenti.preventivoId).toBe("prev-99");

    distinta = scollegaPreventivo(distinta);
    expect(distinta.collegamenti.preventivoId).toBeUndefined();
    expect(distinta.titolo).toBe("Link");
  });

  it("collega e scollega cantiere", () => {
    let distinta = creaDistinta({ titolo: "Link" });
    distinta = collegaCantiere(distinta, "cant-42");
    expect(distinta.collegamenti.cantiereId).toBe("cant-42");

    distinta = scollegaCantiere(distinta);
    expect(distinta.collegamenti.cantiereId).toBeUndefined();
  });

  it("rifiuta collegamenti vuoti", () => {
    const distinta = creaDistinta({ titolo: "Link" });
    expect(collegaPreventivo(distinta, "  ")).toBeNull();
    expect(collegaCantiere(distinta, "")).toBeNull();
  });
});

describe("distintaMaterialiDomain — suggerimenti accessori", () => {
  it("elenca suggerimenti validi con qty = padre × quantitaPerUnita", () => {
    const suggerimenti = elencaSuggerimentiAccessoriPerVoce(
      {
        id: "voce-tubo",
        varianteId: "tubo-corrugato-25",
        famigliaId: "tubo-corrugato",
        quantita: 10,
      },
      CATALOGO_MATERIALI_SEED
    );

    expect(suggerimenti.length).toBeGreaterThan(0);
    expect(suggerimenti[0].varianteId).toBe("pressacavo-pg16");
    expect(suggerimenti[0].quantita).toBe(10);
  });

  it("elenca accessori famiglia (es. quadro → pressacavo)", () => {
    const suggerimenti = elencaSuggerimentiAccessoriPerVoce(
      {
        id: "voce-quadro",
        varianteId: "quadro-elettrico-24-moduli",
        famigliaId: "quadro-elettrico",
        quantita: 2,
      },
      CATALOGO_MATERIALI_SEED
    );

    expect(suggerimenti.some((s) => s.famigliaId === "pressacavo")).toBe(true);
    const pressacavo = suggerimenti.find((s) => s.famigliaId === "pressacavo");
    expect(pressacavo.quantita).toBe(8);
  });

  it("esclude accessori già presenti in distinta", () => {
    const suggerimenti = elencaSuggerimentiAccessoriPerVoce(
      {
        id: "voce-tubo",
        varianteId: "tubo-corrugato-25",
        famigliaId: "tubo-corrugato",
        quantita: 5,
      },
      CATALOGO_MATERIALI_SEED,
      {
        vociEsistenti: [
          {
            id: "gia",
            varianteId: "pressacavo-pg16",
            famigliaId: "pressacavo",
          },
        ],
      }
    );
    expect(suggerimenti).toHaveLength(0);
  });

  it("espande accessori in voci flat con parentVoceId", () => {
    const parent = {
      id: "voce-padre",
      varianteId: "presa-civile-bipasso",
      famigliaId: "presa-civile",
      nome: "Presa civile — Bipasso",
      unita: "pz",
      quantita: 12,
    };
    const suggerimenti = elencaSuggerimentiAccessoriPerVoce(
      parent,
      CATALOGO_MATERIALI_SEED
    );
    const voci = costruisciVociAccessoriSuggeriti(
      parent,
      suggerimenti,
      CATALOGO_MATERIALI_SEED
    );

    expect(voci.length).toBeGreaterThanOrEqual(3);
    expect(voci.every((v) => v.parentVoceId === "voce-padre")).toBe(true);
    expect(voci.every((v) => v.origineAccessorio === "suggerito")).toBe(true);
    expect(voci.some((v) => v.varianteId === "cassetta-503")).toBe(true);
    expect(voci.some((v) => v.famigliaId === "supporto-civile")).toBe(true);
    expect(voci.some((v) => v.famigliaId === "placca-civile")).toBe(true);
    expect(
      voci.find((v) => v.varianteId === "cassetta-503")?.quantita
    ).toBe(12);
  });

  it("persiste parentVoceId in normalizzaVoceDistinta", () => {
    const voce = normalizzaVoceDistinta({
      nome: "Pressacavo",
      unita: "pz",
      quantita: 4,
      parentVoceId: "voce-padre",
      origineAccessorio: "suggerito",
    });
    expect(voce?.parentVoceId).toBe("voce-padre");
    expect(voce?.origineAccessorio).toBe("suggerito");
  });
});
