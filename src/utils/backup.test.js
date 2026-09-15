import { beforeEach, describe, expect, it, vi } from "vitest";

import { STORAGE_KEYS, APP_DATA_KEYS } from "../app/storageKeys";
import { creaBackupCompleto, ripristinaBackupCompleto } from "../utils/backup";
import { leggiStorage, salvaStorage } from "../utils/storage";

vi.mock("../services/cloudSyncService", () => ({
  salvaDatoCloudImmediato: vi.fn().mockResolvedValue(undefined),
}));

describe("backup esperienze RC-2A", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("include le esperienze in APP_DATA_KEYS e nel backup", () => {
    expect(STORAGE_KEYS.esperienze in APP_DATA_KEYS).toBe(true);

    const esperienze = [
      { id: "e1", cantiereId: 1, tipoLavoro: "impianto" },
    ];
    salvaStorage(STORAGE_KEYS.esperienze, esperienze);

    const backup = creaBackupCompleto();
    expect(backup.dati[STORAGE_KEYS.esperienze]).toEqual(esperienze);
  });

  it("ripristina le esperienze dal backup", async () => {
    const { salvaDatoCloudImmediato } = await import("../services/cloudSyncService");

    await ripristinaBackupCompleto({
      app: "PreventivAI",
      versione: 1,
      creatoIl: "2026-07-22T00:00:00.000Z",
      dati: {
        [STORAGE_KEYS.esperienze]: [{ id: "e-restored", cliente: "Rossi" }],
        [STORAGE_KEYS.clienti]: [],
        [STORAGE_KEYS.cantieri]: [],
        [STORAGE_KEYS.preventivi]: [],
        [STORAGE_KEYS.datiAzienda]: {},
        [STORAGE_KEYS.listino]: [],
      },
    });

    expect(leggiStorage(STORAGE_KEYS.esperienze, [])).toEqual([
      { id: "e-restored", cliente: "Rossi" },
    ]);
    expect(salvaDatoCloudImmediato).toHaveBeenCalledWith(
      STORAGE_KEYS.esperienze,
      [{ id: "e-restored", cliente: "Rossi" }]
    );
  });
});

describe("backup UX-6.6 struttura e UX-6.5 round-trip", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("crea backup JSON valido con app, versione e dati", () => {
    const backup = creaBackupCompleto();
    expect(backup.app).toBe("PreventivAI");
    expect(backup.versione).toBe(1);
    expect(backup.creatoIl).toBeTruthy();
    expect(backup.dati).toBeTypeOf("object");
    expect(STORAGE_KEYS.cantieri in backup.dati).toBe(true);
    expect(STORAGE_KEYS.catalogoMateriali in backup.dati).toBe(false);
  });

  it("round-trip cantiere lavoro diretto UX-6.5 senza perdita campi", async () => {
    const cantiereDiretto = {
      id: "c-dir-1",
      nome: "Riparazione quadro",
      cliente: "Rossi",
      origine: "diretto",
      tipoIntervento: "Riparazione",
      descrizioneIntervento: "Sostituito magnetotermico.",
      totaleLavoro: 180,
      incassato: 50,
      acconto: 50,
      pagamenti: [
        {
          id: "pay-legacy",
          data: "01/08/2026",
          importo: 50,
          tipo: "acconto",
          metodo: "contanti",
        },
      ],
      checklist: [],
      materiali: [],
      foto: [],
    };
    salvaStorage(STORAGE_KEYS.cantieri, [cantiereDiretto]);

    const backup = creaBackupCompleto();
    const esportato = backup.dati[STORAGE_KEYS.cantieri][0];
    expect(esportato.origine).toBe("diretto");
    expect(esportato.tipoIntervento).toBe("Riparazione");
    expect(esportato.descrizioneIntervento).toContain("magnetotermico");
    expect(esportato.totaleLavoro).toBe(180);
    expect(esportato.incassato).toBe(50);
    expect(esportato.pagamenti).toHaveLength(1);

    localStorage.clear();
    await ripristinaBackupCompleto(backup);

    const ripristinato = leggiStorage(STORAGE_KEYS.cantieri, [])[0];
    expect(ripristinato.origine).toBe("diretto");
    expect(ripristinato.tipoIntervento).toBe("Riparazione");
    expect(ripristinato.descrizioneIntervento).toBe(
      "Sostituito magnetotermico."
    );
    expect(ripristinato.totaleLavoro).toBe(180);
    expect(ripristinato.incassato).toBe(50);
    expect(ripristinato.acconto).toBe(50);
    expect(ripristinato.pagamenti[0].importo).toBe(50);
  });
});

describe("backup — confini offline safety (nessuna migrazione chiavi)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("backup include solo APP_DATA_KEYS e lascia fuori chiavi solo-device note", () => {
    const chiaviBackup = Object.keys(APP_DATA_KEYS);
    expect(chiaviBackup).toEqual(
      expect.arrayContaining([
        STORAGE_KEYS.preventivi,
        STORAGE_KEYS.cantieri,
        STORAGE_KEYS.clienti,
        STORAGE_KEYS.datiAzienda,
        STORAGE_KEYS.listino,
        STORAGE_KEYS.esperienze,
      ])
    );

    // Chiavi operative note come device-local oggi — non devono entrare nel backup
    // senza decisione umana esplicita (no APP_DATA_KEYS expansion in questo test).
    expect(STORAGE_KEYS.catalogoMateriali in APP_DATA_KEYS).toBe(false);
    expect(STORAGE_KEYS.attivita in APP_DATA_KEYS).toBe(false);
    expect(STORAGE_KEYS.brainObservations in APP_DATA_KEYS).toBe(false);
    expect(STORAGE_KEYS.pinAccesso in APP_DATA_KEYS).toBe(false);

    salvaStorage(STORAGE_KEYS.catalogoMateriali, [{ id: "mat-1", nome: "Cavo" }]);
    salvaStorage(STORAGE_KEYS.attivita, [{ id: "a1", titolo: "Sopralluogo" }]);

    const backup = creaBackupCompleto();
    expect(STORAGE_KEYS.catalogoMateriali in backup.dati).toBe(false);
    expect(STORAGE_KEYS.attivita in backup.dati).toBe(false);
    expect(STORAGE_KEYS.pinAccesso in backup.dati).toBe(false);
  });

  it("ripristino non cancella chiavi solo-device non presenti nel backup", async () => {
    salvaStorage(STORAGE_KEYS.catalogoMateriali, [{ id: "mat-keep", nome: "Canalina" }]);
    salvaStorage(STORAGE_KEYS.clienti, [{ id: "c1", nome: "Bianchi" }]);

    const backup = creaBackupCompleto();
    expect(backup.dati[STORAGE_KEYS.clienti]).toEqual([{ id: "c1", nome: "Bianchi" }]);

    // Simula restore su device che ha ancora catalogo locale
    await ripristinaBackupCompleto({
      ...backup,
      dati: {
        ...backup.dati,
        [STORAGE_KEYS.clienti]: [{ id: "c2", nome: "Verdi" }],
      },
    });

    expect(leggiStorage(STORAGE_KEYS.clienti, [])).toEqual([
      { id: "c2", nome: "Verdi" },
    ]);
    expect(leggiStorage(STORAGE_KEYS.catalogoMateriali, [])).toEqual([
      { id: "mat-keep", nome: "Canalina" },
    ]);
  });
});
