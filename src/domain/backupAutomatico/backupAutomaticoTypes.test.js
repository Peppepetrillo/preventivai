import { describe, expect, it } from "vitest";

import {
  FREQUENZE_BACKUP,
  STATI_BACKUP_AUTO,
  backupAutomaticoScaduto,
  calcolaProssimoBackup,
  calcolaStatoBackupAutomatico,
  formattaDataOraBackup,
  normalizzaConfigBackupAutomatico,
} from "./backupAutomaticoTypes";

describe("backupAutomaticoTypes — calcolo prossima esecuzione", () => {
  it("disattivato non calcola prossima data", () => {
    expect(calcolaProssimoBackup("2026-08-01T10:00:00.000Z", FREQUENZE_BACKUP.disattivato)).toBeNull();
  });

  it("giornaliero aggiunge 1 giorno", () => {
    const prossimo = calcolaProssimoBackup("2026-08-01T10:00:00.000Z", FREQUENZE_BACKUP.giornaliero);
    expect(prossimo).toBe(new Date("2026-08-02T10:00:00.000Z").toISOString());
  });

  it("settimanale aggiunge 7 giorni", () => {
    const prossimo = calcolaProssimoBackup("2026-08-01T10:00:00.000Z", FREQUENZE_BACKUP.settimanale);
    expect(prossimo).toBe(new Date("2026-08-08T10:00:00.000Z").toISOString());
  });

  it("mensile aggiunge 1 mese calendario", () => {
    const prossimo = calcolaProssimoBackup("2026-07-15T10:00:00.000Z", FREQUENZE_BACKUP.mensile);
    expect(prossimo).toBe(new Date("2026-08-15T10:00:00.000Z").toISOString());
  });

  it("mensile gestisce fine mese (31 gen → 28 feb)", () => {
    const prossimo = calcolaProssimoBackup("2026-01-31T12:00:00.000Z", FREQUENZE_BACKUP.mensile);
    expect(prossimo).toBe(new Date("2026-02-28T12:00:00.000Z").toISOString());
  });

  it("mensile gestisce cambio anno (31 dic → 31 gen)", () => {
    const prossimo = calcolaProssimoBackup("2025-12-31T08:00:00.000Z", FREQUENZE_BACKUP.mensile);
    expect(prossimo).toBe(new Date("2026-01-31T08:00:00.000Z").toISOString());
  });

  it("mensile gestisce 30 apr → 30 mag", () => {
    const prossimo = calcolaProssimoBackup("2026-04-30T09:00:00.000Z", FREQUENZE_BACKUP.mensile);
    expect(prossimo).toBe(new Date("2026-05-30T09:00:00.000Z").toISOString());
  });
});

describe("backupAutomaticoTypes — scadenza e stato", () => {
  it("disattivato non è mai scaduto", () => {
    const config = normalizzaConfigBackupAutomatico({
      frequenza: FREQUENZE_BACKUP.disattivato,
      enabled: false,
    });
    expect(backupAutomaticoScaduto(config, Date.parse("2099-01-01T00:00:00.000Z"))).toBe(false);
    expect(calcolaStatoBackupAutomatico(config)).toBe(STATI_BACKUP_AUTO.disattivato);
  });

  it("backup scaduto quando prossimoBackup è nel passato", () => {
    const config = normalizzaConfigBackupAutomatico({
      frequenza: FREQUENZE_BACKUP.giornaliero,
      enabled: true,
      prossimoBackup: "2026-01-01T00:00:00.000Z",
    });
    expect(backupAutomaticoScaduto(config, Date.parse("2026-08-01T00:00:00.000Z"))).toBe(true);
    expect(calcolaStatoBackupAutomatico(config, Date.parse("2026-08-01T00:00:00.000Z"))).toBe(
      STATI_BACKUP_AUTO.scaduto
    );
  });

  it("backup non scaduto quando prossimoBackup è futuro", () => {
    const config = normalizzaConfigBackupAutomatico({
      frequenza: FREQUENZE_BACKUP.settimanale,
      enabled: true,
      prossimoBackup: "2026-12-31T23:59:59.000Z",
      stato: STATI_BACKUP_AUTO.in_attesa,
    });
    expect(backupAutomaticoScaduto(config, Date.parse("2026-08-01T00:00:00.000Z"))).toBe(false);
    expect(calcolaStatoBackupAutomatico(config, Date.parse("2026-08-01T00:00:00.000Z"))).toBe(
      STATI_BACKUP_AUTO.in_attesa
    );
  });

  it("mantiene stato errore finché presente ultimoErrore", () => {
    const config = normalizzaConfigBackupAutomatico({
      frequenza: FREQUENZE_BACKUP.giornaliero,
      enabled: true,
      stato: STATI_BACKUP_AUTO.errore,
      ultimoErrore: "quota_superata",
      prossimoBackup: "2099-01-01T00:00:00.000Z",
    });
    expect(calcolaStatoBackupAutomatico(config)).toBe(STATI_BACKUP_AUTO.errore);
  });

  it("formatta data/ora in italiano o em dash se assente", () => {
    expect(formattaDataOraBackup(null)).toBe("—");
    expect(formattaDataOraBackup("2026-08-20T14:30:00.000Z")).toMatch(/20\/08\/2026/);
  });
});
