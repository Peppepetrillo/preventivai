import { beforeEach, describe, expect, it } from "vitest";

import {
  TIPI_VARIANTE,
  STATI_VARIANTE,
  EVENTI_VARIANTE,
  creaVariantiService,
  preparaDocumentoVariantiPdf,
  importoSegnatoVariante,
} from "./index";
import { resetVarianti } from "./variantiRepository";

function creaStore() {
  let varianti = [];
  let timeline = [];
  const cantieri = {
    10: {
      id: 10,
      nome: "Cantiere PREV-1",
      cliente: "Mario",
      preventivoOriginaleTotale: 1000,
      preventivoImporto: 1000,
      lavorazioniOrigine: [],
      varianti: [],
    },
  };

  return {
    deps: {
      leggiTutteVarianti: () => varianti.map((v) => ({ ...v })),
      scriviTutteVarianti: (elenco) => {
        varianti = elenco.map((v) => ({ ...v }));
      },
      trovaVariante: (id) =>
        varianti.find((v) => String(v.id) === String(id)) || null,
      inserisciVariante: (v) => {
        varianti = [v, ...varianti];
        return v;
      },
      aggiornaVariante: (id, patch) => {
        const i = varianti.findIndex((v) => String(v.id) === String(id));
        if (i < 0) return null;
        varianti[i] = { ...varianti[i], ...patch, id: varianti[i].id };
        return varianti[i];
      },
      leggiTimelineVarianti: () => timeline.map((e) => ({ ...e })),
      scriviTimelineVarianti: (elenco) => {
        timeline = elenco.map((e) => ({ ...e }));
      },
      trovaCantiere: (id) => cantieri[id] || null,
      now: () => 1_700_000_000_000,
    },
    get varianti() {
      return varianti;
    },
    get timeline() {
      return timeline;
    },
    cantieri,
  };
}

describe("variantiService", () => {
  let store;
  let svc;

  beforeEach(() => {
    localStorage.clear();
    resetVarianti();
    store = creaStore();
    svc = creaVariantiService(store.deps);
  });

  it("creaVariante in stato proposta senza toccare il preventivo", () => {
    const r = svc.creaVariante({
      cantiereId: 10,
      titolo: "Punto luce extra",
      tipo: TIPI_VARIANTE.AGGIUNTA,
      quantita: 2,
      prezzoUnitario: 50,
    });

    expect(r.success).toBe(true);
    expect(r.variante.stato).toBe(STATI_VARIANTE.PROPOSTA);
    expect(r.variante.importo).toBe(100);
    expect(store.cantieri[10].preventivoOriginaleTotale).toBe(1000);
    expect(svc.calcolaTotaleVarianti(10, store.cantieri[10])).toBe(0);
  });

  it("calcola totale solo con approvate/eseguite", () => {
    const creata = svc.creaVariante({
      cantiereId: 10,
      titolo: "Aggiunta",
      tipo: TIPI_VARIANTE.AGGIUNTA,
      importo: 200,
    });
    svc.approvaVariante(creata.variante.id);

    const rimozione = svc.creaVariante({
      cantiereId: 10,
      titolo: "Rimozione",
      tipo: TIPI_VARIANTE.RIMOZIONE,
      importo: 50,
    });
    svc.approvaVariante(rimozione.variante.id);
    svc.eseguiVariante(rimozione.variante.id);

    const proposta = svc.creaVariante({
      cantiereId: 10,
      titolo: "Solo proposta",
      importo: 999,
    });
    expect(proposta.variante.stato).toBe(STATI_VARIANTE.PROPOSTA);

    const annullata = svc.creaVariante({
      cantiereId: 10,
      titolo: "Da annullare",
      importo: 80,
    });
    svc.approvaVariante(annullata.variante.id);
    svc.annullaVariante(annullata.variante.id);

    const totale = svc.calcolaTotaleCantiere(store.cantieri[10]);
    expect(totale.preventivoOriginale).toBe(1000);
    expect(totale.deltaVarianti).toBe(150); // +200 -50
    expect(totale.totaleAggiornato).toBe(1150);
  });

  it("timeline registra eventi", () => {
    const r = svc.creaVariante({
      cantiereId: 10,
      titolo: "Extra",
      importo: 10,
    });
    svc.approvaVariante(r.variante.id);
    svc.eseguiVariante(r.variante.id);

    const tipi = svc.ottieniTimeline(10).map((e) => e.tipo);
    expect(tipi).toContain(EVENTI_VARIANTE.CREATA);
    expect(tipi).toContain(EVENTI_VARIANTE.APPROVATA);
    expect(tipi).toContain(EVENTI_VARIANTE.ESEGUITA);
  });

  it("non crea duplicati di proposta identica", () => {
    const a = svc.creaVariante({
      cantiereId: 10,
      titolo: "Stesso",
      tipo: TIPI_VARIANTE.AGGIUNTA,
      importo: 40,
    });
    const b = svc.creaVariante({
      cantiereId: 10,
      titolo: "Stesso",
      tipo: TIPI_VARIANTE.AGGIUNTA,
      importo: 40,
    });
    expect(b.duplicato).toBe(true);
    expect(b.variante.id).toBe(a.variante.id);
    expect(store.varianti).toHaveLength(1);
  });

  it("rollback ripristina store se inserimento fallisce", () => {
    const rotto = creaVariantiService({
      ...store.deps,
      inserisciVariante: () => {
        throw new Error("boom");
      },
    });
    const r = rotto.creaVariante({
      cantiereId: 10,
      titolo: "X",
      importo: 1,
    });
    expect(r.success).toBe(false);
    expect(store.varianti).toHaveLength(0);
  });

  it("esegui richiede approvazione", () => {
    const r = svc.creaVariante({
      cantiereId: 10,
      titolo: "Y",
      importo: 10,
    });
    const esito = svc.eseguiVariante(r.variante.id);
    expect(esito.success).toBe(false);
    expect(esito.error).toBe("richiede_approvazione");
  });

  it("persistenza su repository reale", () => {
    const r = creaVariantiService().creaVariante({
      cantiereId: 99,
      titolo: "Persistita",
      importo: 25,
    });
    expect(r.success).toBe(true);
    const elenco = JSON.parse(localStorage.getItem("preventivai.varianti"));
    expect(elenco[0].titolo).toBe("Persistita");
  });

  it("prepara documento PDF senza export", () => {
    const r = svc.creaVariante({
      cantiereId: 10,
      titolo: "PDF row",
      importo: 30,
    });
    svc.approvaVariante(r.variante.id);
    const doc = preparaDocumentoVariantiPdf(store.cantieri[10], {
      riepilogo: svc.calcolaTotaleCantiere(store.cantieri[10]),
    });
    expect(doc.ready).toBe(true);
    expect(doc.exportEnabled).toBe(false);
    expect(doc.riepilogo.totaleAggiornato).toBe(1030);
    expect(doc.righe.length).toBeGreaterThan(0);
  });

  it("importoSegnatoVariante rispetta i tipi", () => {
    expect(
      importoSegnatoVariante({ tipo: TIPI_VARIANTE.AGGIUNTA, importo: 10 })
    ).toBe(10);
    expect(
      importoSegnatoVariante({ tipo: TIPI_VARIANTE.RIMOZIONE, importo: 10 })
    ).toBe(-10);
  });
});
