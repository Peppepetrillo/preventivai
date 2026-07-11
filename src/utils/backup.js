import { leggiStorage, salvaStorage } from "./storage";
import { CHIAVI_DATI_APP } from "./chiaviStorage";
import { salvaDatoCloudImmediato } from "../services/cloudSyncService";

export const VERSIONE_BACKUP = 1;

export function creaBackupCompleto() {
  const dati = Object.fromEntries(
    Object.entries(CHIAVI_DATI_APP).map(([chiave, fallback]) => [
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
    Object.entries(CHIAVI_DATI_APP).map(async ([chiave, fallback]) => {
      const valore = backup.dati[chiave] ?? fallback;

      await salvaStorage(chiave, valore);
      await salvaDatoCloudImmediato(chiave, valore);
    })
  );
}

export function nomeFileBackup() {
  const data = new Date().toISOString().slice(0, 10);
  return `preventivai-backup-${data}.json`;
}
