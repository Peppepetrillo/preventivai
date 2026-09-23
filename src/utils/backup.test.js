import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  STORAGE_KEYS,
  APP_DATA_KEYS,
  BACKUP_DATA_KEYS,
} from "../app/storageKeys";
import { creaBackupCompleto, ripristinaBackupCompleto } from "../utils/backup";
import { leggiStorage, salvaStorage } from "../utils/storage";
import {
  leggiOperaiTutti,
  salvaOperai,
} from "../repositories/operaiRepository";

vi.mock("../services/cloudSyncService", () => ({
  salvaDatoCloudImmediato: vi.fn().mockResolvedValue(undefined),
  salvaDatoCloud: vi.fn(),
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
    const { salvaDatoCloudImmediato } = await import(
      "../services/cloudSyncService"
    );

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
    expect(STORAGE_KEYS.operai in backup.dati).toBe(true);
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

describe("backup Operai P1 — export/import/idempotenza", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("operai sono in BACKUP_DATA_KEYS ma fuori APP_DATA_KEYS (no cloud sync)", () => {
    expect(STORAGE_KEYS.operai in APP_DATA_KEYS).toBe(false);
    expect(STORAGE_KEYS.operai in BACKUP_DATA_KEYS).toBe(true);
  });

  it("round-trip: 2 operai (attivo + disattivo), ID e costi preservati, no duplicati", async () => {
    const operai = [
      {
        id: "op-a",
        nome: "Mario",
        cognome: "Rossi",
        ruolo: "Elettricista",
        costoGiornata: 120,
        costoOra: 15,
        attivo: true,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
      {
        id: "op-b",
        nome: "Luca",
        cognome: "Bianchi",
        ruolo: "Aiuto",
        costoGiornata: 90,
        costoOra: null,
        attivo: false,
        createdAt: "2026-01-02T00:00:00.000Z",
        updatedAt: "2026-01-03T00:00:00.000Z",
      },
    ];
    salvaOperai(operai);

    const backup = creaBackupCompleto();
    expect(backup.dati[STORAGE_KEYS.operai]).toEqual(operai);

    localStorage.clear();
    expect(leggiOperaiTutti()).toEqual([]);

    await ripristinaBackupCompleto(backup);
    const dopo = leggiOperaiTutti();
    expect(dopo).toHaveLength(2);
    expect(dopo.find((o) => o.id === "op-a")).toMatchObject({
      nome: "Mario",
      cognome: "Rossi",
      costoGiornata: 120,
      costoOra: 15,
      attivo: true,
    });
    expect(dopo.find((o) => o.id === "op-b")).toMatchObject({
      nome: "Luca",
      cognome: "Bianchi",
      costoGiornata: 90,
      attivo: false,
    });

    await ripristinaBackupCompleto(backup);
    expect(leggiOperaiTutti()).toHaveLength(2);
    expect(leggiOperaiTutti().map((o) => o.id).sort()).toEqual([
      "op-a",
      "op-b",
    ]);
  });

  it("backup vecchio senza chiave operai resta importabile (fallback [])", async () => {
    salvaOperai([
      {
        id: "op-local",
        nome: "Solo",
        cognome: "Locale",
        costoGiornata: 100,
        attivo: true,
      },
    ]);

    await ripristinaBackupCompleto({
      app: "PreventivAI",
      versione: 1,
      creatoIl: "2026-01-01T00:00:00.000Z",
      dati: {
        [STORAGE_KEYS.clienti]: [],
        [STORAGE_KEYS.cantieri]: [],
        [STORAGE_KEYS.preventivi]: [],
        [STORAGE_KEYS.datiAzienda]: {},
        [STORAGE_KEYS.listino]: [],
        [STORAGE_KEYS.esperienze]: [],
      },
    });

    expect(leggiOperaiTutti()).toEqual([]);
  });
});

describe("backup — confini offline safety (nessuna migrazione chiavi)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("backup include BACKUP_DATA_KEYS e lascia fuori chiavi solo-device note", () => {
    expect(Object.keys(APP_DATA_KEYS)).toEqual(
      expect.arrayContaining([
        STORAGE_KEYS.preventivi,
        STORAGE_KEYS.cantieri,
        STORAGE_KEYS.clienti,
        STORAGE_KEYS.datiAzienda,
        STORAGE_KEYS.listino,
        STORAGE_KEYS.esperienze,
      ])
    );
    expect(STORAGE_KEYS.operai in BACKUP_DATA_KEYS).toBe(true);
    expect(STORAGE_KEYS.operai in APP_DATA_KEYS).toBe(false);

    expect(STORAGE_KEYS.catalogoMateriali in APP_DATA_KEYS).toBe(false);
    expect(STORAGE_KEYS.attivita in APP_DATA_KEYS).toBe(false);
    expect(STORAGE_KEYS.brainObservations in APP_DATA_KEYS).toBe(false);
    expect(STORAGE_KEYS.pinAccesso in APP_DATA_KEYS).toBe(false);
    expect(STORAGE_KEYS.distinteMateriali in APP_DATA_KEYS).toBe(false);
    expect(STORAGE_KEYS.listaSpesa in APP_DATA_KEYS).toBe(false);
    expect(STORAGE_KEYS.firme in APP_DATA_KEYS).toBe(false);
    expect(STORAGE_KEYS.varianti in APP_DATA_KEYS).toBe(false);
    expect(STORAGE_KEYS.variantiTimeline in APP_DATA_KEYS).toBe(false);
    expect(STORAGE_KEYS.workflowTimeline in APP_DATA_KEYS).toBe(false);
    expect(STORAGE_KEYS.appLockConfig in APP_DATA_KEYS).toBe(false);
    expect(STORAGE_KEYS.backupAutomaticoConfig in APP_DATA_KEYS).toBe(false);
    expect(STORAGE_KEYS.backupAutomaticoUltimo in APP_DATA_KEYS).toBe(false);

    salvaStorage(STORAGE_KEYS.catalogoMateriali, [
      { id: "mat-1", nome: "Cavo" },
    ]);
    salvaStorage(STORAGE_KEYS.attivita, [{ id: "a1", titolo: "Sopralluogo" }]);
    salvaStorage(STORAGE_KEYS.distinteMateriali, [
      { id: "d1", titolo: "Distinta" },
    ]);
    salvaStorage(STORAGE_KEYS.listaSpesa, [{ id: "ls1", nome: "Cavo" }]);
    salvaStorage(STORAGE_KEYS.firme, [{ id: "f1" }]);
    salvaStorage(STORAGE_KEYS.varianti, [{ id: "v1" }]);

    const backup = creaBackupCompleto();
    expect(STORAGE_KEYS.catalogoMateriali in backup.dati).toBe(false);
    expect(STORAGE_KEYS.attivita in backup.dati).toBe(false);
    expect(STORAGE_KEYS.pinAccesso in backup.dati).toBe(false);
    expect(STORAGE_KEYS.distinteMateriali in backup.dati).toBe(false);
    expect(STORAGE_KEYS.listaSpesa in backup.dati).toBe(false);
    expect(STORAGE_KEYS.firme in backup.dati).toBe(false);
    expect(STORAGE_KEYS.varianti in backup.dati).toBe(false);
    expect(STORAGE_KEYS.operai in backup.dati).toBe(true);
  });

  it("ripristino non cancella chiavi solo-device non presenti nel backup", async () => {
    salvaStorage(STORAGE_KEYS.catalogoMateriali, [
      { id: "mat-keep", nome: "Canalina" },
    ]);
    salvaStorage(STORAGE_KEYS.clienti, [{ id: "c1", nome: "Bianchi" }]);

    const backup = creaBackupCompleto();
    expect(backup.dati[STORAGE_KEYS.clienti]).toEqual([
      { id: "c1", nome: "Bianchi" },
    ]);

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
