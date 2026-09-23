import { describe, expect, it } from "vitest";

import {
  aggiungiGiornataManodopera,
  eliminaGiornataManodopera,
  impostaPagatoGiornataManodopera,
  leggiGiornateManodopera,
  riepilogoManodoperaCantiere,
  validaGiornataManodopera,
} from "./giornateManodoperaService";
import { aggregaPerCantiere, aggregaPerOperaio, costruisciRiepilogoManodopera } from "./riepilogoManodoperaService";
import {
  etichettaIntervalloSettimana,
  fineSettimana,
  inizioSettimana,
  spostaSettimana,
} from "./settimanaUtils";

const mario = {
  id: "op-1",
  nome: "Mario",
  cognome: "Rossi",
  costoGiornata: 120,
  costoOra: 15,
  attivo: true,
};

const antonio = {
  id: "op-2",
  nome: "Antonio",
  cognome: "Esposito",
  costoGiornata: 100,
  attivo: true,
};

describe("giornateManodoperaService", () => {
  it("registra giornata con costo precompilato", () => {
    const esito = validaGiornataManodopera(
      {
        cantiereId: "c1",
        operaioId: "op-1",
        data: "21/09/2026",
        tipo: "giornata",
      },
      mario
    );
    expect(esito.ok).toBe(true);
    expect(esito.giornata.costo).toBe(120);
    expect(esito.giornata.ore).toBe(8);
    expect(esito.giornata.pagato).toBe(false);
  });

  it("registra ore con costo orario", () => {
    const esito = validaGiornataManodopera(
      {
        cantiereId: "c1",
        operaioId: "op-1",
        data: "22/09/2026",
        tipo: "ore",
        ore: 6,
      },
      mario
    );
    expect(esito.ok).toBe(true);
    expect(esito.giornata.costo).toBe(90);
  });

  it("accetta costo personalizzato senza cambiare operaio", () => {
    const esito = validaGiornataManodopera(
      {
        cantiereId: "c1",
        operaioId: "op-1",
        data: "21/09/2026",
        tipo: "giornata",
        costo: 100,
      },
      mario
    );
    expect(esito.giornata.costo).toBe(100);
    expect(mario.costoGiornata).toBe(120);
  });

  it("rifiuta dati invalidi", () => {
    expect(
      validaGiornataManodopera({ data: "", operaioId: "op-1" }, mario).ok
    ).toBe(false);
    expect(
      validaGiornataManodopera(
        { data: "21/09/2026", tipo: "ore", ore: 0 },
        mario
      ).ok
    ).toBe(false);
  });

  it("aggiunge, paga e elimina sul cantiere", () => {
    let cantiere = { id: "c1", nome: "Test", giornateManodopera: [] };
    const g1 = validaGiornataManodopera(
      {
        cantiereId: "c1",
        operaioId: "op-1",
        data: "21/09/2026",
        tipo: "giornata",
        costo: 120,
      },
      mario
    ).giornata;
    const g2 = validaGiornataManodopera(
      {
        cantiereId: "c1",
        operaioId: "op-2",
        data: "21/09/2026",
        tipo: "giornata",
        costo: 100,
      },
      antonio
    ).giornata;

    cantiere = aggiungiGiornataManodopera(cantiere, g1);
    cantiere = aggiungiGiornataManodopera(cantiere, g2);
    expect(leggiGiornateManodopera(cantiere)).toHaveLength(2);

    cantiere = impostaPagatoGiornataManodopera(cantiere, g1.id, true);
    const riep = riepilogoManodoperaCantiere(cantiere);
    expect(riep.costo).toBe(220);
    expect(riep.pagato).toBe(120);
    expect(riep.daPagare).toBe(100);

    // doppio tap idempotente
    cantiere = impostaPagatoGiornataManodopera(cantiere, g1.id, true);
    expect(riepilogoManodoperaCantiere(cantiere).pagato).toBe(120);

    cantiere = eliminaGiornataManodopera(cantiere, g2.id);
    expect(leggiGiornateManodopera(cantiere)).toHaveLength(1);
    expect(riepilogoManodoperaCantiere(cantiere).costo).toBe(120);
  });

  it("cantiere senza giornate: riepilogo zero", () => {
    expect(riepilogoManodoperaCantiere({ id: "x" })).toEqual({
      giornate: 0,
      ore: 0,
      costo: 0,
      pagato: 0,
      daPagare: 0,
    });
  });
});

describe("settimanaUtils + riepilogo", () => {
  it("naviga settimana precedente e successiva", () => {
    const lun = inizioSettimana(new Date(2026, 8, 23)); // mer 23 set 2026
    expect(lun.getDay()).toBe(1);
    expect(lun.getDate()).toBe(21);
    const dom = fineSettimana(lun);
    expect(dom.getDate()).toBe(27);
    const prev = spostaSettimana(lun, -1);
    expect(prev.getDate()).toBe(14);
    const next = spostaSettimana(lun, 1);
    expect(next.getDate()).toBe(28);
    expect(etichettaIntervalloSettimana(lun, dom)).toMatch(/settembre/i);
  });

  it("aggrega settimana per operaio e cantiere", () => {
    const cantieri = [
      {
        id: "c1",
        nome: "Appartamento",
        cliente: "Rossi",
        giornateManodopera: [
          {
            id: "g1",
            operaioId: "op-1",
            data: "21/09/2026",
            tipo: "giornata",
            ore: 8,
            costo: 120,
            pagato: true,
          },
          {
            id: "g2",
            operaioId: "op-2",
            data: "22/09/2026",
            tipo: "giornata",
            ore: 8,
            costo: 100,
            pagato: false,
          },
        ],
      },
      {
        id: "c2",
        nome: "Negozio",
        cliente: "Bianchi",
        giornateManodopera: [
          {
            id: "g3",
            operaioId: "op-1",
            data: "23/09/2026",
            tipo: "ore",
            ore: 6,
            costo: 90,
            pagato: true,
          },
        ],
      },
      {
        id: "c3",
        nome: "Fuori settimana",
        giornateManodopera: [
          {
            id: "g4",
            operaioId: "op-1",
            data: "01/09/2026",
            tipo: "giornata",
            ore: 8,
            costo: 120,
            pagato: false,
          },
        ],
      },
    ];

    const da = inizioSettimana(new Date(2026, 8, 23));
    const riep = costruisciRiepilogoManodopera(cantieri, [mario, antonio], { da });
    expect(riep.totali.giornate).toBe(3);
    expect(riep.totali.costo).toBe(310);
    expect(riep.totali.pagato).toBe(210);
    expect(riep.totali.daPagare).toBe(100);
    expect(riep.totali.operai).toBe(2);
    expect(riep.totali.cantieri).toBe(2);

    const perOp = aggregaPerOperaio(riep.giornate, [mario, antonio]);
    expect(perOp.find((r) => r.operaioId === "op-1").giornate).toBe(2);
    expect(perOp.find((r) => r.operaioId === "op-2").daPagare).toBe(100);

    const perCant = aggregaPerCantiere(riep.giornate);
    expect(perCant).toHaveLength(2);
    expect(perCant.some((c) => c.nome.includes("Rossi"))).toBe(true);
  });

  it("filtro operaio e cantiere", () => {
    const cantieri = [
      {
        id: "c1",
        nome: "A",
        giornateManodopera: [
          {
            id: "g1",
            operaioId: "op-1",
            data: "22/09/2026",
            tipo: "giornata",
            ore: 8,
            costo: 120,
            pagato: false,
          },
          {
            id: "g2",
            operaioId: "op-2",
            data: "22/09/2026",
            tipo: "giornata",
            ore: 8,
            costo: 100,
            pagato: false,
          },
        ],
      },
    ];
    const da = inizioSettimana(new Date(2026, 8, 22));
    const soloMario = costruisciRiepilogoManodopera(cantieri, [mario, antonio], {
      da,
      operaioId: "op-1",
    });
    expect(soloMario.totali.giornate).toBe(1);
    expect(soloMario.totali.costo).toBe(120);
  });

  it("operaio senza giornate non compare nel riepilogo periodo", () => {
    const riep = costruisciRiepilogoManodopera(
      [{ id: "c1", giornateManodopera: [] }],
      [mario],
      { da: inizioSettimana(new Date(2026, 8, 21)) }
    );
    expect(riep.perOperaio).toHaveLength(0);
    expect(riep.totali.giornate).toBe(0);
  });
});
