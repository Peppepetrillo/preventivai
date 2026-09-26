import { leggiStorage, salvaStorage } from "./storage";
import { CHIAVI_BACKUP } from "./chiaviStorage";
import { salvaDatoCloudImmediato } from "../services/cloudSyncService";

export const VERSIONE_BACKUP = 1;

export function creaBackupCompleto() {
  const dati = Object.fromEntries(
    Object.entries(CHIAVI_BACKUP).map(([chiave, fallback]) => [
      chiave,
      leggiStorage(chiave, fallback),
    ])
  );

  return {
    app: "PreventivAI",
    versione: VERSIONE_BACKUP,
    creatoIl: new Date().toISOString(),
    dati,
  };
}

export async function ripristinaBackupCompleto(backup) {
  if (!backup || backup.app !== "PreventivAI" || !backup.dati) {
    throw new Error("File backup non valido.");
  }

  await Promise.all(
    Object.entries(CHIAVI_BACKUP).map(async ([chiave, fallback]) => {
      // Chiave assente nel file → non toccare lo storage locale (evita wipe operai
      // su backup pre-BACKUP_DATA_KEYS). Solo chiavi presenti vengono ripristinate.
      if (!Object.prototype.hasOwnProperty.call(backup.dati, chiave)) {
        return;
      }
      const grezzo = backup.dati[chiave];
      const valore = grezzo === undefined || grezzo === null ? fallback : grezzo;

      await salvaStorage(chiave, valore);
      // No-op per chiavi fuori APP_DATA_KEYS (es. operai) — sync cloud invariato.
      await salvaDatoCloudImmediato(chiave, valore);
    })
  );
}

export function nomeFileBackup() {
  const data = new Date().toISOString().slice(0, 10);
  return `preventivai-backup-${data}.json`;
}
