import { beforeEach, describe, expect, it } from "vitest";

import { creaCantiereDaPreventivo } from "../../features/cantieri/cantieriDomain";
import { creaPreventivoWorkflowService } from "./preventivoWorkflowService";
import {
  AZIONI_PREVENTIVO,
  EVENTI_WORKFLOW,
  STATI_PREVENTIVO,
  calcolaAzioniDisponibili,
  normalizzaStatoPreventivo,
} from "./preventivoWorkflowTypes";

function creaStoreInMemory(seed = {}) {
  let preventivi = [...(seed.preventivi || [])];
  let cantieri = [...(seed.cantieri || [])];
  let clienti = [...(seed.clienti || [])];
  let timeline = [...(seed.timeline || [])];

  return {
    leggiPreventivi: () => preventivi.map((p) => ({ ...p })),
    salvaPreventivi: (elenco) => {
      preventivi = elenco.map((p) => ({ ...p }));
    },
    aggiornaPreventivo: (id, fn) => {
      preventivi = preventivi.map((p) =>
        String(p.id) === String(id) ? fn({ ...p }) : p
      );
      return preventivi.map((p) => ({ ...p }));
    },
    leggiCantieri: () => cantieri.map((c) => ({ ...c })),
    salvaCantieri: (elenco) => {
      cantieri = elenco.map((c) => ({ ...c }));
    },
    leggiClienti: () => clienti.map((c) => ({ ...c })),
    leggiTimeline: () => timeline.map((e) => ({ ...e })),
    salvaTimeline: (elenco) => {
      timeline = elenco.map((e) => ({ ...e }));
    },
    snapshot: () => ({ preventivi, cantieri, timeline }),
  };
}

const preventivoBase = {
  id: 101,
  numero: "PREV-101",
  cliente: "Mario Rossi",
  stato: STATI_PREVENTIVO.BOZZA,
  indirizzo: "Via Roma 1, Milano",
  descrizione: "Rifacimento impianto",
  note: "Intervento urgente",
  totale: 90,
  extra: { clima: true },
  lavorazioni: [
    {
      id: "l-1",
      nome: "Installazione punto luce",
      categoria: "Impianto",
      quantita: 2,
      prezzo: 45,
      unita: "cad",
    },
  ],
};

describe("preventivoWorkflowTypes", () => {
  it("normalizza stati e alias legacy", () => {
    expect(normalizzaStatoPreventivo("ACCETTATO")).toBe(
      STATI_PREVENTIVO.ACCETTATO
    );
    expect(normalizzaStatoPreventivo("Completato")).toBe(
      STATI_PREVENTIVO.CONVERTITO
    );
  });

  it("calcola azioni per stato", () => {
    expect(
      calcolaAzioniDisponibili({ stato: STATI_PREVENTIVO.ACCETTATO })
    ).toContain(AZIONI_PREVENTIVO.CONVERTI_CANTIERE);
    expect(
      calcolaAzioniDisponibili({
        stato: STATI_PREVENTIVO.CONVERTITO,
        cantiereId: 1,
      })
    ).toEqual([AZIONI_PREVENTIVO.APRI_CANTIERE]);
  });
});

describe("preventivoWorkflowService", () => {
  let store;
  let wf;
  let now;

  beforeEach(() => {
    now = 1_700_000_000_000;
    store = creaStoreInMemory({
      preventivi: [preventivoBase],
      clienti: [{ id: 55, nome: "Mario Rossi", indirizzo: "Via Roma 1" }],
    });
    wf = creaPreventivoWorkflowService({
      ...store,
      creaCantiereDaPreventivo,
      now: () => now,
    });
  });

  it("accettaPreventivo aggiorna stato e timeline", () => {
    const risultato = wf.accettaPreventivo(101, { by: "utente" });
    expect(risultato.success).toBe(true);
    expect(risultato.preventivo.stato).toBe(STATI_PREVENTIVO.ACCETTATO);
    expect(risultato.preventivo.accettatoBy).toBe("utente");
    expect(wf.ottieniTimeline(101).some((e) => e.tipo === EVENTI_WORKFLOW.PREVENTIVO_ACCETTATO)).toBe(
      true
    );
  });

  it("convertiInCantiere richiede ACCETTATO", () => {
    const rifiuto = wf.convertiInCantiere(101);
    expect(rifiuto.success).toBe(false);
    expect(rifiuto.error).toBe("solo_accettato_convertibile");
  });

  it("convertiInCantiere crea cantiere, copia dati e marca CONVERTITO", () => {
    wf.accettaPreventivo(101);
    const risultato = wf.convertiInCantiere(101, { by: "utente" });

    expect(risultato.success).toBe(true);
    expect(risultato.creato).toBe(true);
    expect(risultato.preventivo.stato).toBe(STATI_PREVENTIVO.CONVERTITO);
    expect(risultato.preventivo.cantiereId).toBe(risultato.cantiere.id);
    expect(risultato.preventivo.convertitoAt).toBe(now);
    expect(risultato.preventivo.convertitoBy).toBe("utente");

    expect(risultato.cantiere).toMatchObject({
      cliente: "Mario Rossi",
      indirizzo: "Via Roma 1, Milano",
      descrizione: "Rifacimento impianto",
      note: "Intervento urgente",
      preventivoId: 101,
      preventivoNumero: "PREV-101",
      preventivoImporto: 90,
      origine: "preventivo",
      extra: { clima: true },
    });
    expect(risultato.cantiere.lavorazioniOrigine).toHaveLength(1);
    expect(risultato.cantiere.dataCreazione).toBeTruthy();

    const tipi = wf.ottieniTimeline(101).map((e) => e.tipo);
    expect(tipi).toContain(EVENTI_WORKFLOW.CANTIERE_CREATO);
    expect(tipi).toContain(EVENTI_WORKFLOW.PREVENTIVO_CONVERTITO);
    expect(wf.contaPreventiviConvertiti()).toBe(1);
  });

  it("non crea duplicati e restituisce cantiere esistente", () => {
    wf.accettaPreventivo(101);
    const primo = wf.convertiInCantiere(101);
    const secondo = wf.convertiInCantiere(101);

    expect(secondo.success).toBe(true);
    expect(secondo.creato).toBe(false);
    expect(secondo.cantiere.id).toBe(primo.cantiere.id);
    expect(store.snapshot().cantieri).toHaveLength(1);
  });

  it("annullaPreventivo e blocca conversione", () => {
    const annullo = wf.annullaPreventivo(101);
    expect(annullo.success).toBe(true);
    expect(annullo.preventivo.stato).toBe(STATI_PREVENTIVO.ANNULLATO);
    expect(wf.convertiInCantiere(101).success).toBe(false);
  });

  it("ottieniAzioniDisponibili espone converti solo se accettato", () => {
    expect(wf.ottieniAzioniDisponibili(preventivoBase)).toContain(
      AZIONI_PREVENTIVO.ACCETTA
    );
    wf.accettaPreventivo(101);
    const azioni = wf.ottieniAzioniDisponibili(wf.trovaPreventivo(101));
    expect(azioni).toContain(AZIONI_PREVENTIVO.CONVERTI_CANTIERE);
  });

  it("rollback ripristina preventivi e cantieri se creazione fallisce", () => {
    wf.accettaPreventivo(101);
    const prima = store.snapshot();

    const wfRotto = creaPreventivoWorkflowService({
      ...store,
      creaCantiereDaPreventivo: () => {
        throw new Error("boom");
      },
      now: () => now,
    });

    const risultato = wfRotto.convertiInCantiere(101);
    expect(risultato.success).toBe(false);
    expect(risultato.error).toBe("boom");
    expect(store.snapshot().cantieri).toEqual(prima.cantieri);
    expect(store.snapshot().preventivi[0].stato).toBe(STATI_PREVENTIVO.ACCETTATO);
  });

  it("persiste timeline tra letture", () => {
    wf.inviaPreventivo(101);
    wf.accettaPreventivo(101);
    const eventi = wf.ottieniTimeline(101);
    expect(eventi.length).toBeGreaterThanOrEqual(2);
    expect(store.leggiTimeline().length).toBe(eventi.length);
  });
});
