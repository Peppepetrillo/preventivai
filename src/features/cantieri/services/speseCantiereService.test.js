/**
 * Registro spese cantiere (UX-Spese v1).
 */

import { beforeEach, describe, expect, it } from "vitest";

import { STORAGE_KEYS } from "../../../app/storageKeys";
import {
  aggiungiVoceListaSpesa,
  leggiListaSpesa,
} from "../../../domain/listaSpesa";
import {
  eliminaDefinitivamente,
  ripristina,
  spostaNelCestino,
  TIPI_CESTINO,
} from "../../../domain/cestino";
import {
  leggiCantieri,
  leggiCantieriTutti,
  salvaCantieri,
} from "../../../repositories/cantieriRepository";
import { creaBackupCompleto, ripristinaBackupCompleto } from "../../../utils/backup";
import {
  aggiungiPagamento,
  riepilogoEconomicoCantiere,
} from "./pagamentiCantiereService";
import { aggiungiGiornataProgrammata } from "./programmazioneCantiereService";
import {
  CATEGORIE_SPESA,
  aggiungiSpesa,
  calcolaMargineLordo,
  calcolaTotaleSpeseCantiere,
  calcolaTotaleSpesePerCategoria,
  creaSpesaCantiere,
  filtraSpeseCantiere,
  leggiSpese,
  modificaSpesa,
  normalizzaSpesaCantiere,
  rimuoviSpesaCantiere,
  riepilogoEconomicoCompleto,
  validaSpesaCantiere,
} from "./speseCantiereService";

describe("speseCantiereService UX-Spese v1", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const cantiereBase = {
    id: "c1",
    origine: "diretto",
    totaleLavoro: 5000,
    incassato: 0,
    pagamenti: [],
  };

  function spesaValida(override = {}) {
    return {
      data: "02/09/2026",
      importo: 50,
      descrizione: "Carburante",
      categoria: CATEGORIE_SPESA.carburante,
      ...override,
    };
  }

  it("creazione spesa", () => {
    const spesa = creaSpesaCantiere(spesaValida());
    expect(spesa.id).toBeTruthy();
    expect(spesa.descrizione).toBe("Carburante");
    expect(spesa.importo).toBe(50);
    expect(spesa.categoria).toBe(CATEGORIE_SPESA.carburante);
  });

  it("validazione importo — zero e negativo rifiutati", () => {
    expect(validaSpesaCantiere(spesaValida({ importo: 0 })).valida).toBe(false);
    expect(validaSpesaCantiere(spesaValida({ importo: -10 })).valida).toBe(
      false
    );
    expect(() => aggiungiSpesa(cantiereBase, spesaValida({ importo: 0 }))).toThrow(
      /non valida/i
    );
  });

  it("descrizione obbligatoria", () => {
    expect(validaSpesaCantiere(spesaValida({ descrizione: "  " })).valida).toBe(
      false
    );
  });

  it("categoria normalizzata", () => {
    const spesa = normalizzaSpesaCantiere(
      spesaValida({ categoria: "MANODOPERA" }),
      cantiereBase
    );
    expect(spesa?.categoria).toBe(CATEGORIE_SPESA.manodopera);
  });

  it("modifica mantiene ID e createdAt", () => {
    const c = aggiungiSpesa(cantiereBase, spesaValida({ id: "sp-fixed" }));
    const id = c.spese[0].id;
    const createdAt = c.spese[0].createdAt;
    const aggiornato = modificaSpesa(c, id, {
      descrizione: "Carburante aggiornato",
      importo: 75,
    });
    expect(aggiornato.spese[0].id).toBe(id);
    expect(aggiornato.spese[0].createdAt).toBe(createdAt);
    expect(aggiornato.spese[0].importo).toBe(75);
  });

  it("eliminazione spesa", () => {
    const c = aggiungiSpesa(cantiereBase, spesaValida());
    const id = c.spese[0].id;
    const dopo = rimuoviSpesaCantiere(c, id);
    expect(dopo.spese).toHaveLength(0);
  });

  it("totale spese", () => {
    let c = aggiungiSpesa(cantiereBase, spesaValida({ importo: 100 }));
    c = aggiungiSpesa(c, spesaValida({ importo: 250, descrizione: "Materiali" }));
    expect(calcolaTotaleSpeseCantiere(c)).toBe(350);
  });

  it("totale per categoria", () => {
    let c = aggiungiSpesa(
      cantiereBase,
      spesaValida({ importo: 800, categoria: CATEGORIE_SPESA.materiali })
    );
    c = aggiungiSpesa(
      c,
      spesaValida({
        importo: 200,
        categoria: CATEGORIE_SPESA.manodopera,
        descrizione: "Extra",
      })
    );
    expect(calcolaTotaleSpesePerCategoria(c)).toEqual({
      materiali: 800,
      manodopera: 200,
    });
  });

  it("margine = incassato - spese", () => {
    let c = aggiungiPagamento(cantiereBase, {
      data: "01/09/2026",
      importo: 2000,
      tipo: "acconto",
    });
    c = aggiungiSpesa(c, spesaValida({ importo: 500 }));
    expect(calcolaMargineLordo(c)).toBe(1500);
    expect(riepilogoEconomicoCompleto(c).margineLordo).toBe(1500);
  });

  it("cantiere legacy senza spese → array vuoto", () => {
    expect(leggiSpese(cantiereBase)).toEqual([]);
    expect(calcolaTotaleSpeseCantiere(cantiereBase)).toBe(0);
    expect(calcolaMargineLordo(cantiereBase)).toBe(0);
  });

  it("più spese sullo stesso cantiere", () => {
    let c = cantiereBase;
    for (let i = 0; i < 3; i += 1) {
      c = aggiungiSpesa(
        c,
        spesaValida({ descrizione: `Spesa ${i}`, importo: 10 * (i + 1) })
      );
    }
    expect(leggiSpese(c)).toHaveLength(3);
  });

  it("giornata associata se valida", () => {
    let c = aggiungiGiornataProgrammata(cantiereBase, {
      data: "02/09/2026",
      operai: 2,
      orePreviste: 8,
    });
    const giornataId = c.programmazione[0].id;
    c = aggiungiSpesa(
      c,
      spesaValida({ giornataId, descrizione: "Trasferta giornata" })
    );
    expect(c.spese[0].giornataId).toBe(giornataId);
  });

  it("giornataId invalida ignorata", () => {
    const c = aggiungiSpesa(
      cantiereBase,
      spesaValida({ giornataId: "g-inexistente" })
    );
    expect(c.spese[0].giornataId).toBeUndefined();
  });

  it("modifica giornata non rompe la spesa", () => {
    let c = aggiungiGiornataProgrammata(cantiereBase, {
      data: "02/09/2026",
      operai: 2,
      orePreviste: 8,
    });
    const g1 = c.programmazione[0].id;
    c = aggiungiSpesa(c, spesaValida({ giornataId: g1 }));
    c = aggiungiGiornataProgrammata(c, {
      data: "05/09/2026",
      operai: 2,
      orePreviste: 8,
    });
    const g2 = c.programmazione[1].id;
    c = modificaSpesa(c, c.spese[0].id, { giornataId: g2 });
    expect(c.spese[0].giornataId).toBe(g2);
  });

  it("soft delete cantiere conserva spese", () => {
    salvaCantieri([
      aggiungiSpesa(cantiereBase, spesaValida({ importo: 120 })),
    ]);
    spostaNelCestino(TIPI_CESTINO.cantiere, "c1");
    const nelCestino = leggiCantieriTutti()[0];
    expect(nelCestino.spese).toHaveLength(1);
    expect(nelCestino.spese[0].importo).toBe(120);
  });

  it("restore cantiere ripristina spese", () => {
    salvaCantieri([
      aggiungiSpesa(cantiereBase, spesaValida({ importo: 90 })),
    ]);
    spostaNelCestino(TIPI_CESTINO.cantiere, "c1");
    ripristina(TIPI_CESTINO.cantiere, "c1");
    expect(leggiCantieri()[0].spese).toHaveLength(1);
  });

  it("hard delete elimina spese con il cantiere", () => {
    salvaCantieri([
      aggiungiSpesa(cantiereBase, spesaValida({ importo: 60 })),
    ]);
    spostaNelCestino(TIPI_CESTINO.cantiere, "c1");
    eliminaDefinitivamente(TIPI_CESTINO.cantiere, "c1");
    expect(leggiCantieriTutti()).toHaveLength(0);
  });

  it("filtro ricerca e categoria", () => {
    let c = aggiungiSpesa(
      cantiereBase,
      spesaValida({ descrizione: "Viti Bricoman", fornitore: "Bricoman" })
    );
    c = aggiungiSpesa(
      c,
      spesaValida({
        descrizione: "Manodopera extra",
        categoria: CATEGORIE_SPESA.manodopera,
      })
    );
    const spese = leggiSpese(c);
    expect(
      filtraSpeseCantiere(spese, { ricerca: "bricoman" })
    ).toHaveLength(1);
    expect(
      filtraSpeseCantiere(spese, { categoria: CATEGORIE_SPESA.manodopera })
    ).toHaveLength(1);
  });

  it("nessuna interferenza con listaSpesa", () => {
    aggiungiVoceListaSpesa({ nome: "Cavo", lavoroId: "c1", cantiereId: "c1" });
    aggiungiSpesa(cantiereBase, spesaValida());
    expect(leggiListaSpesa()).toHaveLength(1);
    expect(leggiListaSpesa()[0].nome).toBe("Cavo");
    expect(leggiListaSpesa()[0].id.startsWith("spesa-")).toBe(true);
  });

  it("nessuna interferenza con pagamenti", () => {
    let c = aggiungiPagamento(cantiereBase, {
      data: "01/09/2026",
      importo: 1000,
    });
    c = aggiungiSpesa(c, spesaValida({ importo: 200 }));
    const riepilogoPag = riepilogoEconomicoCantiere(c);
    expect(riepilogoPag.incassato).toBe(1000);
    expect(riepilogoPag.pagamenti).toHaveLength(1);
    expect(calcolaTotaleSpeseCantiere(c)).toBe(200);
  });

  it("backup/restore conserva spese[] nel cantiere", async () => {
    salvaCantieri([
      aggiungiSpesa(cantiereBase, spesaValida({ importo: 333 })),
    ]);
    const backup = creaBackupCompleto();
    expect(backup.dati[STORAGE_KEYS.cantieri][0].spese).toHaveLength(1);
    localStorage.clear();
    await ripristinaBackupCompleto(backup);
    expect(leggiCantieri()[0].spese[0].importo).toBe(333);
  });
});
