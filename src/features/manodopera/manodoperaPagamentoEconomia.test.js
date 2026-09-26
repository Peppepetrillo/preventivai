import { describe, expect, it } from "vitest";

import {
  calcolaTotaleSpeseCantiere,
  leggiSpese,
  riepilogoEconomicoCompleto,
} from "../cantieri/services/speseCantiereService";
import { aggregaEconomiaAttivita } from "../economia/economiaService";
import {
  aggiungiGiornataManodopera,
  validaGiornataManodopera,
  leggiGiornateManodopera,
} from "./giornateManodoperaService";
import {
  ORIGINE_SPESA_MANODOPERA,
  allineaEconomiaDopoGiornataManodopera,
  eliminaGiornataManodoperaConEconomia,
  registraPagamentoGiornataManodopera,
  trovaSpesaManodoperaPerGiornata,
} from "./manodoperaPagamentoEconomia";

function cantiereBase() {
  return {
    id: "c1",
    nome: "Impianto Rossi",
    cliente: "Rossi",
    spese: [
      {
        id: "s1",
        data: "01/09/2026",
        importo: 50,
        categoria: "materiali",
        descrizione: "cavo",
      },
    ],
    giornateManodopera: [],
    pagamenti: [],
  };
}

function creaGiornata(overrides = {}) {
  return validaGiornataManodopera(
    {
      cantiereId: "c1",
      operaioId: "op-mario",
      data: "20/09/2026",
      tipo: "giornata",
      costo: 120,
      ...overrides,
    },
    { id: "op-mario", nome: "Mario", cognome: "Rossi", costoGiornata: 120 }
  ).giornata;
}

describe("manodopera pagamento → economia", () => {
  it("1. giornata non pagata → nessuna uscita economica extra", () => {
    const g = creaGiornata({ pagato: false });
    const dopo = aggiungiGiornataManodopera(cantiereBase(), g);
    expect(calcolaTotaleSpeseCantiere(dopo)).toBe(50);
    expect(leggiSpese(dopo)).toHaveLength(1);
    expect(dopo.giornateManodopera[0].pagato).toBe(false);
  });

  it("2. pagamento giornata → pagato=true + una uscita", () => {
    let c = aggiungiGiornataManodopera(cantiereBase(), creaGiornata());
    const id = c.giornateManodopera[0].id;
    c = registraPagamentoGiornataManodopera(c, id, true, {
      operaioNome: "Mario Rossi",
      now: new Date(2026, 8, 22),
    });
    const g = leggiGiornateManodopera(c)[0];
    expect(g.pagato).toBe(true);
    expect(g.pagatoIl).toBe("22/09/2026");
    expect(calcolaTotaleSpeseCantiere(c)).toBe(170);
    const speseMano = leggiSpese(c).filter(
      (s) => s.origine === ORIGINE_SPESA_MANODOPERA
    );
    expect(speseMano).toHaveLength(1);
    expect(speseMano[0].importo).toBe(120);
    expect(speseMano[0].giornataManodoperaId).toBe(id);
    expect(speseMano[0].descrizione).toContain("Mario Rossi");
    expect(speseMano[0].categoria).toBe("manodopera");
  });

  it("3. doppio click / ri-applica → una sola uscita", () => {
    let c = aggiungiGiornataManodopera(cantiereBase(), creaGiornata());
    const id = c.giornateManodopera[0].id;
    const ctx = { operaioNome: "Mario Rossi", now: new Date(2026, 8, 22) };
    c = registraPagamentoGiornataManodopera(c, id, true, ctx);
    c = registraPagamentoGiornataManodopera(c, id, true, ctx);
    c = registraPagamentoGiornataManodopera(c, id, true, ctx);
    expect(
      leggiSpese(c).filter((s) => s.origine === ORIGINE_SPESA_MANODOPERA)
    ).toHaveLength(1);
    expect(calcolaTotaleSpeseCantiere(c)).toBe(170);
  });

  it("4. stato pagato conservato su struttura cantiere (riapertura)", () => {
    let c = aggiungiGiornataManodopera(cantiereBase(), creaGiornata());
    const id = c.giornateManodopera[0].id;
    c = registraPagamentoGiornataManodopera(c, id, true, {
      operaioNome: "Mario Rossi",
      now: new Date(2026, 8, 22),
    });
    // Simula reload: ridireziona da JSON storage
    const reload = JSON.parse(JSON.stringify(c));
    const g = leggiGiornateManodopera(reload)[0];
    expect(g.pagato).toBe(true);
    expect(trovaSpesaManodoperaPerGiornata(reload, id)?.importo).toBe(120);
  });

  it("5. manodopera riepilogo coerente con pagato", () => {
    let c = aggiungiGiornataManodopera(cantiereBase(), creaGiornata());
    const id = c.giornateManodopera[0].id;
    c = registraPagamentoGiornataManodopera(c, id, true, {
      operaioNome: "Mario Rossi",
    });
    expect(leggiGiornateManodopera(c)[0].pagato).toBe(true);
  });

  it("6–7. Economia: uscita presente e totale +120 una sola volta", () => {
    let c = aggiungiGiornataManodopera(cantiereBase(), creaGiornata());
    const id = c.giornateManodopera[0].id;
    c = registraPagamentoGiornataManodopera(c, id, true, {
      operaioNome: "Mario Rossi",
      now: new Date(2026, 8, 20),
    });
    const eco = aggregaEconomiaAttivita([c], {
      periodo: "questo_mese",
      riferimento: new Date(2026, 8, 25),
    });
    // Periodo settembre 2026: materiali 50 + manodopera 120
    expect(eco.uscite).toBe(170);
    const usciteMano = eco.dettaglioUscite.filter(
      (m) =>
        m.categoria === "manodopera" ||
        String(m.etichetta || "").includes("Manodopera")
    );
    expect(usciteMano.length).toBeGreaterThanOrEqual(1);
    expect(usciteMano.reduce((a, m) => a + m.importo, 0)).toBe(120);
    const movimentiMano = eco.movimenti.filter((m) =>
      String(m.descrizione || "").includes("Manodopera")
    );
    expect(movimentiMano).toHaveLength(1);
  });

  it("8. controllo economico cantiere considera la spesa una sola volta", () => {
    let c = aggiungiGiornataManodopera(cantiereBase(), creaGiornata());
    const id = c.giornateManodopera[0].id;
    c = registraPagamentoGiornataManodopera(c, id, true, {
      operaioNome: "Mario Rossi",
    });
    const riep = riepilogoEconomicoCompleto(c);
    expect(riep.totaleSpese).toBe(170);
    expect(riep.spesePerCategoria.manodopera).toBe(120);
    // Costo giornata NON sommato di nuovo oltre la spesa
    expect(riep.totaleSpese).not.toBe(170 + 120);
  });

  it("9. più operai stesso cantiere → movimenti separati", () => {
    let c = cantiereBase();
    const g1 = creaGiornata({ operaioId: "op-1", costo: 100 });
    const g2 = creaGiornata({
      operaioId: "op-2",
      costo: 80,
      id: "gm-altro",
    });
    c = aggiungiGiornataManodopera(c, g1);
    c = aggiungiGiornataManodopera(c, g2);
    c = registraPagamentoGiornataManodopera(c, g1.id, true, {
      operaioNome: "Mario",
    });
    c = registraPagamentoGiornataManodopera(c, g2.id, true, {
      operaioNome: "Luigi",
    });
    const mano = leggiSpese(c).filter(
      (s) => s.origine === ORIGINE_SPESA_MANODOPERA
    );
    expect(mano).toHaveLength(2);
    expect(calcolaTotaleSpeseCantiere(c)).toBe(50 + 100 + 80);
  });

  it("10. stesso operaio su più cantieri → attribuzione corretta", () => {
    const gA = creaGiornata({ cantiereId: "cA", costo: 120 });
    const gB = creaGiornata({ cantiereId: "cB", costo: 90, id: "gm-b" });
    let a = { id: "cA", cliente: "Rossi", spese: [], giornateManodopera: [] };
    let b = { id: "cB", cliente: "Bianchi", spese: [], giornateManodopera: [] };
    a = aggiungiGiornataManodopera(a, gA);
    b = aggiungiGiornataManodopera(b, gB);
    a = registraPagamentoGiornataManodopera(a, gA.id, true, {
      operaioNome: "Mario Rossi",
    });
    b = registraPagamentoGiornataManodopera(b, gB.id, true, {
      operaioNome: "Mario Rossi",
    });
    expect(calcolaTotaleSpeseCantiere(a)).toBe(120);
    expect(calcolaTotaleSpeseCantiere(b)).toBe(90);
    expect(trovaSpesaManodoperaPerGiornata(a, gA.id).giornataManodoperaId).toBe(
      gA.id
    );
    expect(trovaSpesaManodoperaPerGiornata(b, gB.id).giornataManodoperaId).toBe(
      gB.id
    );
  });

  it("11. vecchio backup senza giornataManodoperaId → nessuna regressione", () => {
    const legacy = {
      id: "c-legacy",
      spese: [
        {
          id: "old",
          data: "10/08/2026",
          importo: 40,
          categoria: "manodopera",
          descrizione: "Manodopera manuale",
        },
      ],
      giornateManodopera: [
        {
          id: "gm-old",
          operaioId: "op-1",
          data: "10/08/2026",
          tipo: "giornata",
          ore: 8,
          costo: 100,
          pagato: false,
        },
      ],
    };
    expect(calcolaTotaleSpeseCantiere(legacy)).toBe(40);
    expect(leggiGiornateManodopera(legacy)).toHaveLength(1);
    // Segna pagato → aggiunge NUOVA spesa linkata, non tocca quella manuale
    const dopo = registraPagamentoGiornataManodopera(legacy, "gm-old", true, {
      operaioNome: "Mario",
    });
    expect(leggiSpese(dopo)).toHaveLength(2);
    expect(calcolaTotaleSpeseCantiere(dopo)).toBe(140);
  });

  it("annulla pagamento (toggle off) rimuove l'uscita collegata", () => {
    let c = aggiungiGiornataManodopera(cantiereBase(), creaGiornata());
    const id = c.giornateManodopera[0].id;
    c = registraPagamentoGiornataManodopera(c, id, true, {
      operaioNome: "Mario",
    });
    expect(calcolaTotaleSpeseCantiere(c)).toBe(170);
    c = registraPagamentoGiornataManodopera(c, id, false, {
      operaioNome: "Mario",
    });
    expect(leggiGiornateManodopera(c)[0].pagato).toBe(false);
    expect(trovaSpesaManodoperaPerGiornata(c, id)).toBeNull();
    expect(calcolaTotaleSpeseCantiere(c)).toBe(50);
  });

  it("elimina giornata pagata rimuove anche l'uscita", () => {
    let c = aggiungiGiornataManodopera(cantiereBase(), creaGiornata());
    const id = c.giornateManodopera[0].id;
    c = registraPagamentoGiornataManodopera(c, id, true, {
      operaioNome: "Mario",
    });
    c = eliminaGiornataManodoperaConEconomia(c, id);
    expect(leggiGiornateManodopera(c)).toHaveLength(0);
    expect(trovaSpesaManodoperaPerGiornata(c, id)).toBeNull();
    expect(calcolaTotaleSpeseCantiere(c)).toBe(50);
  });

  it("allinea dopo create con pagato=true crea una spesa", () => {
    const g = creaGiornata({ pagato: true, pagatoIl: "21/09/2026" });
    let c = aggiungiGiornataManodopera(cantiereBase(), g);
    c = allineaEconomiaDopoGiornataManodopera(c, g.id, {
      operaioNome: "Mario Rossi",
    });
    expect(trovaSpesaManodoperaPerGiornata(c, g.id)?.importo).toBe(120);
    c = allineaEconomiaDopoGiornataManodopera(c, g.id, {
      operaioNome: "Mario Rossi",
    });
    expect(
      leggiSpese(c).filter((s) => s.origine === ORIGINE_SPESA_MANODOPERA)
    ).toHaveLength(1);
  });
});
