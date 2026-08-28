/**
 * Registro pagamenti cantiere (UX-7.5).
 * Source of truth: cantiere.pagamenti[]
 * Scalari incassato/acconto = cache retrocompatibile.
 */

import { beforeEach, describe, expect, it } from "vitest";

import { STORAGE_KEYS } from "../../../app/storageKeys";
import {
  eliminaDefinitivamente,
  ripristina,
  spostaNelCestino,
  TIPI_CESTINO,
} from "../../../domain/cestino";
import { STATI_VARIANTE } from "../../../domain/varianti";
import {
  leggiCantieri,
  leggiCantieriTutti,
  salvaCantieri,
} from "../../../repositories/cantieriRepository";
import { creaBackupCompleto, ripristinaBackupCompleto } from "../../../utils/backup";
import { leggiStorage, salvaStorage } from "../../../utils/storage";
import { saldoResiduoCantiere } from "../../agenda/agendaSelectors";
import { buildCantiereReport } from "../../report/builder/buildCantiereReport";
import {
  aggiungiGiornataProgrammata,
  leggiProgrammazione,
} from "./programmazioneCantiereService";
import {
  aggiungiGiornataLavorativa,
  leggiRegistroGiornate,
} from "./registroGiornateService";
import {
  TIPI_PAGAMENTO,
  METODI_PAGAMENTO,
  aggiungiPagamento,
  aggiornaPagamento,
  assicuraPagamentiCantiere,
  calcolaRimanenzaCantiere,
  eliminaPagamento,
  haOverpayment,
  leggiTotaleCantiereEconomico,
  leggiTotaleIncassato,
  migraPagamentiLegacy,
  normalizzaPagamento,
  riepilogoEconomicoCantiere,
} from "./pagamentiCantiereService";

describe("pagamentiCantiereService UX-7.5", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const diretto = {
    id: "d1",
    origine: "diretto",
    totaleLavoro: 1000,
    incassato: 0,
  };

  const daPreventivo = {
    id: "p1",
    origine: "preventivo",
    preventivoOriginaleTotale: 5000,
    preventivoImporto: 5000,
  };

  it("rifiuta importo 0 e negativo", () => {
    expect(normalizzaPagamento({ data: "25/08/2026", importo: 0 })).toBeNull();
    expect(normalizzaPagamento({ data: "25/08/2026", importo: -10 })).toBeNull();
    expect(() =>
      aggiungiPagamento(diretto, { data: "25/08/2026", importo: 0 })
    ).toThrow(/non valido/i);
  });

  it("crea pagamento con tipo metodo note", () => {
    const c = aggiungiPagamento(diretto, {
      data: "25/08/2026",
      importo: 1000,
      tipo: TIPI_PAGAMENTO.acconto,
      metodo: METODI_PAGAMENTO.contanti,
      note: "Primo acconto",
    });
    expect(c.pagamenti).toHaveLength(1);
    expect(c.pagamenti[0].tipo).toBe("acconto");
    expect(c.pagamenti[0].metodo).toBe("contanti");
    expect(c.pagamenti[0].note).toBe("Primo acconto");
    expect(c.incassato).toBe(1000);
    expect(c.acconto).toBe(1000);
  });

  it("somma più acconti e calcola rimanenza", () => {
    let c = aggiungiPagamento(diretto, {
      data: "25/08/2026",
      importo: 400,
      tipo: "acconto",
      metodo: "contanti",
    });
    c = aggiungiPagamento(c, {
      data: "10/09/2026",
      importo: 300,
      tipo: "acconto",
      metodo: "bonifico",
    });
    expect(leggiTotaleIncassato(c)).toBe(700);
    expect(calcolaRimanenzaCantiere(c)).toBe(300);
  });

  it("pagamento completo e tipo saldo", () => {
    const c = aggiungiPagamento(diretto, {
      data: "01/09/2026",
      importo: 1000,
      tipo: "saldo",
      metodo: "pos",
    });
    expect(calcolaRimanenzaCantiere(c)).toBe(0);
    expect(c.pagamenti[0].tipo).toBe("saldo");
  });

  it("modifica ed elimina pagamento", () => {
    let c = aggiungiPagamento(diretto, {
      id: "pay-1",
      data: "25/08/2026",
      importo: 200,
      tipo: "acconto",
      metodo: "contanti",
    });
    c = aggiornaPagamento(c, "pay-1", { importo: 250, metodo: "bonifico" });
    expect(c.pagamenti[0].importo).toBe(250);
    expect(c.pagamenti[0].metodo).toBe("bonifico");
    expect(c.incassato).toBe(250);

    c = eliminaPagamento(c, "pay-1");
    expect(c.pagamenti).toHaveLength(0);
    expect(c.incassato).toBe(0);
  });

  it("overpayment consentito con rimanenza 0", () => {
    const c = aggiungiPagamento(diretto, {
      data: "25/08/2026",
      importo: 1200,
      tipo: "saldo",
      metodo: "contanti",
    });
    expect(haOverpayment(c)).toBe(true);
    expect(calcolaRimanenzaCantiere(c)).toBe(0);
    expect(leggiTotaleIncassato(c)).toBe(1200);
  });

  it("migrazione da incassato/acconto legacy", () => {
    const legacy = {
      id: "leg",
      origine: "diretto",
      totaleLavoro: 500,
      incassato: 150,
      acconto: 150,
      creatoIl: "20/08/2026",
    };
    const { cantiere, migrato } = migraPagamentiLegacy(legacy);
    expect(migrato).toBe(true);
    expect(cantiere.pagamenti).toHaveLength(1);
    expect(cantiere.pagamenti[0].importo).toBe(150);
    expect(cantiere.pagamenti[0].tipo).toBe("acconto");
    expect(leggiTotaleIncassato(cantiere)).toBe(150);
  });

  it("migrazione con solo acconto legacy e senza perdere importo", () => {
    const legacy = { id: "a1", origine: "diretto", totaleLavoro: 200, acconto: 80 };
    const c = assicuraPagamentiCantiere(legacy);
    expect(c.pagamenti[0].importo).toBe(80);
    expect(c.incassato).toBe(80);
  });

  it("cantiere da preventivo: rimanenza su totale preventivo", () => {
    const c = aggiungiPagamento(daPreventivo, {
      data: "25/08/2026",
      importo: 1000,
      tipo: "acconto",
      metodo: "bonifico",
    });
    const riepilogo = riepilogoEconomicoCantiere(c);
    expect(riepilogo.totale).toBe(5000);
    expect(riepilogo.incassato).toBe(1000);
    expect(riepilogo.rimanenza).toBe(4000);
  });

  it("pagamento parziale", () => {
    const c = aggiungiPagamento(diretto, {
      data: "25/08/2026",
      importo: 100,
      tipo: "acconto",
      metodo: "contanti",
    });
    expect(calcolaRimanenzaCantiere(c)).toBe(900);
  });

  it("varianti aumentano totale cantiere e rimanenza", () => {
    const base = {
      id: "cv1",
      origine: "preventivo",
      preventivoOriginaleTotale: 1000,
      preventivoImporto: 1000,
      varianti: [
        {
          id: "va1",
          cantiereId: "cv1",
          titolo: "Extra",
          stato: STATI_VARIANTE.APPROVATA,
          totale: 250,
        },
      ],
    };
    expect(leggiTotaleCantiereEconomico(base)).toBe(1250);
    const c = aggiungiPagamento(base, {
      data: "25/08/2026",
      importo: 500,
      tipo: "acconto",
      metodo: "contanti",
    });
    expect(calcolaRimanenzaCantiere(c)).toBe(750);
  });

  it("backup/restore conserva pagamenti[]", async () => {
    const cantiere = aggiungiPagamento(
      { ...diretto, id: "bak-1", nome: "Backup pay" },
      {
        data: "25/08/2026",
        importo: 300,
        tipo: "acconto",
        metodo: "pos",
        note: "POS",
      }
    );
    salvaStorage(STORAGE_KEYS.cantieri, [cantiere]);
    const backup = creaBackupCompleto();
    expect(backup.dati[STORAGE_KEYS.cantieri][0].pagamenti).toHaveLength(1);
    localStorage.clear();
    await ripristinaBackupCompleto(backup);
    const lista = leggiStorage(STORAGE_KEYS.cantieri, []);
    expect(lista[0].pagamenti[0].importo).toBe(300);
    expect(lista[0].incassato).toBe(300);
  });

  it("soft delete / restore / hard delete conserva pagamenti nel documento", () => {
    const cantiere = aggiungiPagamento(
      {
        id: "sd-pay",
        nome: "Soft",
        cliente: "Rossi",
        stato: "In corso",
        origine: "diretto",
        totaleLavoro: 400,
        checklist: [],
        materiali: [],
        foto: [],
      },
      { data: "25/08/2026", importo: 120, tipo: "acconto", metodo: "contanti" }
    );
    salvaCantieri([cantiere]);

    expect(spostaNelCestino(TIPI_CESTINO.cantiere, "sd-pay").success).toBe(true);
    const nelCestino = leggiCantieriTutti()[0];
    expect(nelCestino.pagamenti[0].importo).toBe(120);

    ripristina(TIPI_CESTINO.cantiere, "sd-pay");
    expect(leggiCantieri()[0].pagamenti[0].importo).toBe(120);

    spostaNelCestino(TIPI_CESTINO.cantiere, "sd-pay");
    expect(eliminaDefinitivamente(TIPI_CESTINO.cantiere, "sd-pay").success).toBe(
      true
    );
    expect(leggiCantieriTutti()).toHaveLength(0);
  });

  it("regressione UX-7.3 programmazione indipendente da pagamenti", () => {
    let c = aggiungiPagamento(diretto, {
      data: "25/08/2026",
      importo: 100,
      tipo: "acconto",
      metodo: "contanti",
    });
    c = aggiungiGiornataProgrammata(c, {
      data: "26/08/2026",
      operai: 2,
      orePreviste: 8,
      attivita: "Tracce",
    });
    expect(leggiProgrammazione(c)).toHaveLength(1);
    expect(leggiTotaleIncassato(c)).toBe(100);
  });

  it("regressione UX-7.4 registro giornate indipendente da pagamenti", () => {
    let c = aggiungiPagamento(diretto, {
      data: "25/08/2026",
      importo: 100,
      tipo: "acconto",
      metodo: "contanti",
    });
    c = aggiungiGiornataLavorativa(c, {
      data: "26/08/2026",
      operai: ["Marco"],
      oreLavorate: 6,
      attivita: "Quadro",
    });
    expect(leggiRegistroGiornate(c)).toHaveLength(1);
    expect(leggiTotaleIncassato(c)).toBe(100);
  });

  it("coerenza Agenda e report su rimanenza", () => {
    const c = aggiungiPagamento(
      {
        ...daPreventivo,
        id: "coer-1",
        nome: "Coerenza",
        cliente: "Rossi",
        stato: "In corso",
      },
      { data: "25/08/2026", importo: 1500, tipo: "acconto", metodo: "bonifico" }
    );
    expect(saldoResiduoCantiere(c)).toBe(3500);
    expect(calcolaRimanenzaCantiere(c)).toBe(3500);
    const report = buildCantiereReport({ cantiere: c });
    expect(report.pagamenti.incassato).toBe(1500);
    expect(report.pagamenti.rimanenza).toBe(3500);
    expect(report.pagamenti.elenco).toHaveLength(1);
  });
});
