import { beforeEach, describe, expect, it, vi } from "vitest";

import { STORAGE_KEYS } from "../../app/storageKeys";
import { CATEGORIE_SPESA } from "../cantieri/services/speseCantiereService";
import {
  aggregaEconomiaAttivita,
  PERIODO_ECONOMIA,
} from "./economiaService";
import { registraMovimentoEconomia } from "./economiaRegistrazioneService";
import { leggiMovimentiEconomiaGenerali } from "./economiaMovimentiRepository";
import { leggiCantieriTutti } from "../../repositories/cantieriRepository";

vi.mock("../../services/cloudSyncService", () => ({
  salvaDatoCloud: vi.fn(),
}));

describe("economia registrazione + aggregazione", () => {
  const riferimento = new Date(2026, 8, 15);

  beforeEach(() => {
    localStorage.clear();
  });

  it("uscita generale senza cantiere non duplica e non inventa cantiere", () => {
    const esito = registraMovimentoEconomia({
      tipo: "uscita",
      importo: 300,
      data: "09/09/2026",
      categoria: CATEGORIE_SPESA.manodopera,
      descrizione: "Commercialista",
    });
    expect(esito.success).toBe(true);
    expect(esito.origine).toBe("generale");
    expect(leggiMovimentiEconomiaGenerali()).toHaveLength(1);
    expect(leggiCantieriTutti()).toHaveLength(0);

    const agg = aggregaEconomiaAttivita([], {
      periodo: PERIODO_ECONOMIA.questo_mese,
      riferimento,
    });
    expect(agg.uscite).toBe(300);
    expect(agg.uscitePerCategoria.manodopera).toBe(300);
    expect(agg.entrate).toBe(0);
  });

  it("uscita con cantiere scrive su spese cantiere e non nei generali", () => {
    localStorage.setItem(
      STORAGE_KEYS.cantieri,
      JSON.stringify([
        {
          id: "c-rossi",
          nome: "Rossi",
          cliente: "Rossi",
          totaleLavoro: 5000,
          origine: "diretto",
          pagamenti: [],
          spese: [],
        },
      ])
    );

    const esito = registraMovimentoEconomia({
      tipo: "uscita",
      importo: 500,
      data: "09/09/2026",
      categoria: CATEGORIE_SPESA.manodopera,
      descrizione: "Acconto squadra",
      cantiereId: "c-rossi",
    });
    expect(esito.success).toBe(true);
    expect(esito.origine).toBe("cantiere");
    expect(leggiMovimentiEconomiaGenerali()).toHaveLength(0);

    const cantiere = leggiCantieriTutti()[0];
    expect(cantiere.spese).toHaveLength(1);
    expect(cantiere.spese[0].importo).toBe(500);

    const agg = aggregaEconomiaAttivita([cantiere], {
      periodo: PERIODO_ECONOMIA.questo_mese,
      riferimento,
    });
    expect(agg.uscite).toBe(500);
    expect(agg.uscitePerCategoria.manodopera).toBe(500);
  });

  it("entrata generale + spesa cantiere: nessun doppio conteggio", () => {
    localStorage.setItem(
      STORAGE_KEYS.cantieri,
      JSON.stringify([
        {
          id: "c1",
          nome: "A",
          cliente: "A",
          totaleLavoro: 2000,
          origine: "diretto",
          pagamenti: [
            { id: "p1", data: "10/09/2026", importo: 1000, tipo: "acconto" },
          ],
          spese: [],
        },
      ])
    );

    registraMovimentoEconomia({
      tipo: "entrata",
      importo: 200,
      data: "11/09/2026",
      categoria: "altra_entrata",
      descrizione: "Rimborso",
    });

    const cantieri = leggiCantieriTutti();
    const agg = aggregaEconomiaAttivita(cantieri, {
      periodo: PERIODO_ECONOMIA.questo_mese,
      riferimento,
    });
    expect(agg.entrate).toBe(1200);
    expect(agg.movimentiTotaliNelPeriodo).toBe(2);
  });

  it("materiali in lista cantiere non diventano uscite automatiche", () => {
    const cantiere = {
      id: "c1",
      totaleLavoro: 1000,
      origine: "diretto",
      pagamenti: [],
      spese: [],
      materiali: [{ id: "m1", nome: "Cavo", quantita: 10, prezzo: 5 }],
    };
    const agg = aggregaEconomiaAttivita([cantiere], {
      periodo: PERIODO_ECONOMIA.questo_mese,
      riferimento,
    });
    expect(agg.uscite).toBe(0);
    expect(agg.uscitePerCategoria.materiali).toBe(0);
  });
});
