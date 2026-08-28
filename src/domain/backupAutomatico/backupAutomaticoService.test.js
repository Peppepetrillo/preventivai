import { beforeEach, describe, expect, it, vi } from "vitest";

import { APP_DATA_KEYS, STORAGE_KEYS } from "../../app/storageKeys";
import { VERSIONE_BACKUP } from "../../utils/backup";
import * as storage from "../../utils/storage";
import { leggiStorage } from "../../utils/storage";
import {
  FREQUENZE_BACKUP,
  STATI_BACKUP_AUTO,
} from "./backupAutomaticoTypes";
import {
  eseguiBackupAutomaticoSeScaduto,
  impostaFrequenzaBackupAutomatico,
  leggiConfigBackupAutomatico,
  leggiSnapshotBackupAutomatico,
  ottieniSnapshotPerEsportazione,
  resetEsecuzioneBackupAutomaticoInCorso,
} from "./backupAutomaticoService";

vi.mock("../../services/notificationService", () => ({
  programmaNotifica: vi.fn().mockResolvedValue(undefined),
  cancellaNotifica: vi.fn().mockResolvedValue(undefined),
}));

const salvaDatoCloudImmediato = vi.fn().mockResolvedValue(undefined);

vi.mock("../../services/cloudSyncService", () => ({
  salvaDatoCloudImmediato: (...args) => salvaDatoCloudImmediato(...args),
}));

const backupMock = {
  app: "PreventivAI",
  versione: VERSIONE_BACKUP,
  creatoIl: "2026-08-20T10:00:00.000Z",
  dati: {
    [STORAGE_KEYS.clienti]: [{ id: "c1", nome: "Rossi", deletedAt: "2026-08-19T00:00:00.000Z" }],
    [STORAGE_KEYS.cantieri]: [
      {
        id: "cant1",
        origine: "diretto",
        tipoIntervento: "Riparazione",
        descrizioneIntervento: "Test UX-6.5",
        deletedAt: null,
      },
    ],
    [STORAGE_KEYS.preventivi]: [],
    [STORAGE_KEYS.datiAzienda]: {},
    [STORAGE_KEYS.listino]: [],
    [STORAGE_KEYS.esperienze]: [],
  },
};

describe("backupAutomaticoService UX-7.2", () => {
  beforeEach(() => {
    localStorage.clear();
    resetEsecuzioneBackupAutomaticoInCorso();
    vi.clearAllMocks();
  });

  it("disattivato non esegue backup", async () => {
    const esito = await eseguiBackupAutomaticoSeScaduto({
      now: () => Date.parse("2026-08-20T12:00:00.000Z"),
      creaBackup: () => backupMock,
    });
    expect(esito.eseguito).toBe(false);
    expect(esito.motivo).toBe("disattivato");
    expect(leggiSnapshotBackupAutomatico()).toBeNull();
  });

  it("persiste configurazione frequenza giornaliera", async () => {
    const now = () => Date.parse("2026-08-20T12:00:00.000Z");
    await impostaFrequenzaBackupAutomatico(FREQUENZE_BACKUP.giornaliero, { now });

    const config = leggiConfigBackupAutomatico();
    expect(config.frequenza).toBe(FREQUENZE_BACKUP.giornaliero);
    expect(config.enabled).toBe(true);
    expect(config.stato).toBe(STATI_BACKUP_AUTO.scaduto);
    expect(config.prossimoBackup).toBeTruthy();
  });

  it("persiste configurazione frequenza settimanale e mensile", async () => {
    await impostaFrequenzaBackupAutomatico(FREQUENZE_BACKUP.settimanale);
    expect(leggiConfigBackupAutomatico().frequenza).toBe(FREQUENZE_BACKUP.settimanale);

    localStorage.clear();
    await impostaFrequenzaBackupAutomatico(FREQUENZE_BACKUP.mensile);
    expect(leggiConfigBackupAutomatico().frequenza).toBe(FREQUENZE_BACKUP.mensile);
  });

  it("esegue backup scaduto e aggiorna ultimo/prossimo/stato", async () => {
    const nowMs = Date.now();
    await impostaFrequenzaBackupAutomatico(FREQUENZE_BACKUP.giornaliero, { now: () => nowMs });

    const esito = await eseguiBackupAutomaticoSeScaduto({
      now: () => nowMs,
      creaBackup: () => ({ ...backupMock, creatoIl: new Date(nowMs).toISOString() }),
    });

    expect(esito.eseguito).toBe(true);
    expect(esito.config.ultimoBackup).toBe(new Date(nowMs).toISOString());
    expect(Date.parse(esito.config.prossimoBackup)).toBeGreaterThan(nowMs);
    expect(esito.config.stato).toBe(STATI_BACKUP_AUTO.aggiornato);

    const snapshot = leggiSnapshotBackupAutomatico();
    expect(snapshot).toEqual(expect.objectContaining({ app: "PreventivAI", versione: VERSIONE_BACKUP }));
    expect(() => JSON.stringify(snapshot)).not.toThrow();
  });

  it("non esegue backup se non scaduto", async () => {
    const nowMs = Date.parse("2026-08-20T12:00:00.000Z");
    await storage.salvaStorage(STORAGE_KEYS.backupAutomaticoConfig, {
      frequenza: FREQUENZE_BACKUP.giornaliero,
      enabled: true,
      ultimoBackup: "2026-08-20T11:00:00.000Z",
      prossimoBackup: "2026-08-21T11:00:00.000Z",
      stato: STATI_BACKUP_AUTO.in_attesa,
      ultimoErrore: null,
      ultimoErroreIl: null,
    });

    const creaBackup = vi.fn(() => backupMock);
    const esito = await eseguiBackupAutomaticoSeScaduto({
      now: () => nowMs,
      creaBackup,
    });

    expect(esito.eseguito).toBe(false);
    expect(esito.motivo).toBe("non_scaduto");
    expect(creaBackup).not.toHaveBeenCalled();
  });

  it("doppia apertura app non crea backup duplicati", async () => {
    const nowMs = Date.parse("2026-08-20T12:00:00.000Z");
    await impostaFrequenzaBackupAutomatico(FREQUENZE_BACKUP.giornaliero, { now: () => nowMs });

    const creaBackup = vi.fn(() => backupMock);
    const primo = await eseguiBackupAutomaticoSeScaduto({ now: () => nowMs, creaBackup });
    const secondo = await eseguiBackupAutomaticoSeScaduto({ now: () => nowMs, creaBackup });

    expect(primo.eseguito).toBe(true);
    expect(secondo.eseguito).toBe(false);
    expect(secondo.motivo).toBe("non_scaduto");
    expect(creaBackup).toHaveBeenCalledTimes(1);
  });

  it("resume con backup scaduto crea un solo snapshot", async () => {
    const scadutoMs = Date.parse("2026-08-25T08:00:00.000Z");
    await storage.salvaStorage(STORAGE_KEYS.backupAutomaticoConfig, {
      frequenza: FREQUENZE_BACKUP.settimanale,
      enabled: true,
      ultimoBackup: "2026-08-10T08:00:00.000Z",
      prossimoBackup: "2026-08-17T08:00:00.000Z",
      stato: STATI_BACKUP_AUTO.scaduto,
      ultimoErrore: null,
      ultimoErroreIl: null,
    });

    const creaBackup = vi.fn(() => backupMock);
    const esito = await eseguiBackupAutomaticoSeScaduto({
      now: () => scadutoMs,
      creaBackup,
    });

    expect(esito.eseguito).toBe(true);
    expect(creaBackup).toHaveBeenCalledTimes(1);
    expect(leggiSnapshotBackupAutomatico()?.app).toBe("PreventivAI");
  });

  it("conserva un solo snapshot sovrascrivendo il precedente", async () => {
    const nowMs = Date.parse("2026-08-20T12:00:00.000Z");
    await impostaFrequenzaBackupAutomatico(FREQUENZE_BACKUP.giornaliero, { now: () => nowMs });

    await eseguiBackupAutomaticoSeScaduto({
      now: () => nowMs,
      creaBackup: () => ({ ...backupMock, creatoIl: "2026-08-20T12:00:00.000Z" }),
    });

    const scadutoMs = Date.parse("2026-08-22T12:00:00.000Z");
    await storage.salvaStorage(STORAGE_KEYS.backupAutomaticoConfig, {
      ...leggiConfigBackupAutomatico(),
      prossimoBackup: "2026-08-21T12:00:00.000Z",
      stato: STATI_BACKUP_AUTO.scaduto,
    });

    await eseguiBackupAutomaticoSeScaduto({
      now: () => scadutoMs,
      creaBackup: () => ({ ...backupMock, creatoIl: "2026-08-22T12:00:00.000Z" }),
    });

    const snapshot = leggiSnapshotBackupAutomatico();
    expect(snapshot?.creatoIl).toBe("2026-08-22T12:00:00.000Z");
  });

  it("gestisce errore storage quota con stato errore", async () => {
    const nowMs = Date.parse("2026-08-20T12:00:00.000Z");
    await impostaFrequenzaBackupAutomatico(FREQUENZE_BACKUP.giornaliero, { now: () => nowMs });

    const salvaSpy = vi.spyOn(storage, "salvaStorage").mockImplementation(async (chiave, valore) => {
      if (chiave === STORAGE_KEYS.backupAutomaticoUltimo) {
        return { ok: false, error: "QuotaExceededError" };
      }
      localStorage.setItem(chiave, JSON.stringify(valore));
      return { ok: true };
    });

    const esito = await eseguiBackupAutomaticoSeScaduto({
      now: () => nowMs,
      creaBackup: () => backupMock,
    });

    expect(esito.eseguito).toBe(false);
    expect(esito.config.stato).toBe(STATI_BACKUP_AUTO.errore);
    expect(esito.config.ultimoErrore).toBe("quota_superata");
    salvaSpy.mockRestore();
  });

  it("esportazione ultimo backup disponibile", async () => {
    await storage.salvaStorage(STORAGE_KEYS.backupAutomaticoUltimo, backupMock);
    const esito = ottieniSnapshotPerEsportazione();
    expect(esito.disponibile).toBe(true);
    expect(esito.backup?.versione).toBe(VERSIONE_BACKUP);
  });

  it("nessun backup automatico disponibile per esportazione", () => {
    const esito = ottieniSnapshotPerEsportazione();
    expect(esito.disponibile).toBe(false);
    expect(esito.error).toBe("nessun_backup_automatico");
  });

  it("snapshot include dati UX-6.5 e elementi cestinati UX-7.1", async () => {
    const nowMs = Date.parse("2026-08-20T12:00:00.000Z");
    await impostaFrequenzaBackupAutomatico(FREQUENZE_BACKUP.giornaliero, { now: () => nowMs });
    await eseguiBackupAutomaticoSeScaduto({ now: () => nowMs, creaBackup: () => backupMock });

    const snapshot = leggiSnapshotBackupAutomatico();
    expect(snapshot?.dati[STORAGE_KEYS.cantieri][0].origine).toBe("diretto");
    expect(snapshot?.dati[STORAGE_KEYS.clienti][0].deletedAt).toBeTruthy();
  });

  it("config backup automatico fuori APP_DATA_KEYS", () => {
    expect(STORAGE_KEYS.backupAutomaticoConfig in APP_DATA_KEYS).toBe(false);
    expect(STORAGE_KEYS.backupAutomaticoUltimo in APP_DATA_KEYS).toBe(false);
  });

  it("VERSIONE_BACKUP resta invariata", () => {
    expect(VERSIONE_BACKUP).toBe(1);
  });

  it("config non passa da salvaDatoCloudImmediato", async () => {
    salvaDatoCloudImmediato.mockClear();
    await impostaFrequenzaBackupAutomatico(FREQUENZE_BACKUP.giornaliero);
    expect(leggiStorage(STORAGE_KEYS.backupAutomaticoConfig).enabled).toBe(true);
    expect(
      salvaDatoCloudImmediato.mock.calls.some(
        ([chiave]) =>
          chiave === STORAGE_KEYS.backupAutomaticoConfig ||
          chiave === STORAGE_KEYS.backupAutomaticoUltimo
      )
    ).toBe(false);
  });
});
