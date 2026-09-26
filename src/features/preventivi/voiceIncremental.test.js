import { describe, expect, it } from "vitest";

import {
  AZIONE_INCREMENTALE,
  interpretaComandoIncrementale,
  rilevaComandoIncrementale,
} from "./voiceIncremental";

const listino = [
  {
    id: "punto-presa",
    nome: "Punto presa",
    categoria: "Impianto",
    prezzo: 55,
    unita: "cad",
  },
  {
    id: "punto-luce",
    nome: "Punto luce",
    categoria: "Impianto",
    prezzo: 45,
    unita: "cad",
  },
];

describe("rilevaComandoIncrementale", () => {
  it("riconosce aggiungi / togli / porta a", () => {
    expect(rilevaComandoIncrementale("Aggiungi 10 prese")).toMatchObject({
      azione: AZIONE_INCREMENTALE.AGGIUNGI,
      quantita: 10,
    });
    expect(rilevaComandoIncrementale("Togli 2 punti luce")).toMatchObject({
      azione: AZIONE_INCREMENTALE.RIMUOVI,
      quantita: 2,
    });
    expect(rilevaComandoIncrementale("Porta le prese a 25")).toMatchObject({
      azione: AZIONE_INCREMENTALE.IMPOSTA,
      quantita: 25,
    });
    expect(rilevaComandoIncrementale("Metti 15 LED")).toMatchObject({
      azione: AZIONE_INCREMENTALE.IMPOSTA,
      quantita: 15,
    });
  });

  it("riconosce «Porta a N …» e «aggiungi altri N»", () => {
    expect(rilevaComandoIncrementale("Porta a 60 i punti luce")).toMatchObject({
      azione: AZIONE_INCREMENTALE.IMPOSTA,
      quantita: 60,
      targetFrase: expect.stringMatching(/punt/i),
    });
    expect(
      rilevaComandoIncrementale("aggiungi altri 20 metri di corrugato da 25")
    ).toMatchObject({
      azione: AZIONE_INCREMENTALE.AGGIUNGI,
      quantita: 20,
    });
  });

  it("ignora frasi non incremental", () => {
    expect(
      rilevaComandoIncrementale("80 punti luce e 60 prese quadro nuovo")
    ).toBeNull();
  });
});

describe("interpretaComandoIncrementale", () => {
  it("aggiunge quantità su voce già in carrello senza inventare prezzo", () => {
    const preview = interpretaComandoIncrementale({
      testo: "Aggiungi 10 prese",
      lavorazioni: [
        {
          id: "1",
          nome: "Punto presa",
          prezzo: 55,
          quantita: 5,
          prezzoDalListino: true,
        },
      ],
      listino,
    });

    expect(preview.modalita).toBe("incrementale");
    expect(preview.lavorazioni[0].quantita).toBe(15);
    expect(preview.lavorazioni[0].prezzo).toBe(55);
    expect(preview.diff[0]).toMatchObject({ da: 5, a: 15 });
  });

  it("aggiunge dal listino se assente nel carrello", () => {
    const preview = interpretaComandoIncrementale({
      testo: "Aggiungi 3 punti luce",
      lavorazioni: [],
      listino,
    });
    expect(preview.lavorazioni).toHaveLength(1);
    expect(preview.lavorazioni[0].nome).toBe("Punto luce");
    expect(preview.lavorazioni[0].prezzo).toBe(45);
    expect(preview.lavorazioni[0].prezzoDalListino).toBe(true);
  });

  it("rimuove quantità e segnala non trovate senza inventare", () => {
    const preview = interpretaComandoIncrementale({
      testo: "Togli 2 punti luce",
      lavorazioni: [
        { id: "1", nome: "Punto luce", prezzo: 45, quantita: 5 },
      ],
      listino,
    });
    expect(preview.lavorazioni[0].quantita).toBe(3);

    const miss = interpretaComandoIncrementale({
      testo: "Aggiungi 5 bobine magiche",
      lavorazioni: [],
      listino,
    });
    expect(miss.nonTrovate.length).toBeGreaterThan(0);
    expect(miss.lavorazioni).toHaveLength(0);
    expect(miss.nonTrovate[0].messaggio).toMatch(/listino/i);
  });

  it("imposta quantità assoluta", () => {
    const preview = interpretaComandoIncrementale({
      testo: "Porta le prese a 25",
      lavorazioni: [
        { id: "1", nome: "Punto presa", prezzo: 55, quantita: 10 },
      ],
      listino,
    });
    expect(preview.lavorazioni[0].quantita).toBe(25);
  });
});
