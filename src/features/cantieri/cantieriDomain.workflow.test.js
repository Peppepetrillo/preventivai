import { describe, expect, it } from "vitest";

import {
  creaCantiereDaPreventivo,
  valutaPrerequisitiChiusuraCantiere,
} from "./cantieriDomain";

describe("cantieriDomain workflow Sprint 3", () => {
  it("creaCantiereDaPreventivo copia cliente, lavorazioni, importo e allegati", () => {
    const cantiere = creaCantiereDaPreventivo(
      {
        id: 7,
        numero: "PREV-7",
        cliente: "Verdi",
        indirizzo: "Via X 1",
        note: "Portare scala",
        totale: 200,
        lavorazioni: [
          { id: "l1", nome: "Punto luce", quantita: 2, prezzo: 40, unita: "cad" },
        ],
        allegati: [{ id: "a1", nome: "schema.pdf", src: "data:image/png;base64,xx" }],
      },
      { indirizzo: "Via X 1" }
    );

    expect(cantiere.cliente).toBe("Verdi");
    expect(cantiere.indirizzo).toBe("Via X 1");
    expect(cantiere.preventivoId).toBe(7);
    expect(cantiere.preventivoNumero).toBe("PREV-7");
    expect(cantiere.preventivoOriginaleTotale).toBe(200);
    expect(cantiere.lavorazioniOrigine).toHaveLength(1);
    expect(cantiere.note).toBe("Portare scala");
    expect(cantiere.foto).toHaveLength(1);
    expect(cantiere.foto[0].daPreventivo).toBe(true);
  });

  it("valutaPrerequisitiChiusuraCantiere elenca mancanze senza bloccare", () => {
    const esito = valutaPrerequisitiChiusuraCantiere(
      {
        checklist: [{ id: 1, completata: false }],
        preventivoOriginaleTotale: 100,
        incassato: 0,
        foto: [],
      },
      {
        varianti: [{ id: "v1", stato: "proposta" }],
        haFirma: false,
      }
    );

    expect(esito.ok).toBe(false);
    expect(esito.mancanze.map((m) => m.id)).toEqual(
      expect.arrayContaining([
        "checklist",
        "pagamenti",
        "varianti",
        "foto",
        "firma",
      ])
    );
  });
});
