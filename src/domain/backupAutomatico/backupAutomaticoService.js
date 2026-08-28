/**
 * Backup automatico UX-7.2 — config locale + snapshot ultimo backup.
 * Usa esclusivamente creaBackupCompleto() per generare il JSON.
 */

import { STORAGE_FALLBACKS, STORAGE_KEYS } from "../../app/storageKeys";
import { creaBackupCompleto } from "../../utils/backup";
import { leggiStorage, salvaStorage } from "../../utils/storage";
import {
  cancellaNotifica,
  programmaNotifica,
} from "../../services/notificationService";
import {
  FREQUENZE_BACKUP,
  NOTIFICA_BACKUP_AUTO_ID,
  STATI_BACKUP_AUTO,
  backupAutomaticoScaduto,
  calcolaProssimoBackup,
  calcolaStatoBackupAutomatico,
  creaConfigBackupAutomaticoDefault,
  normalizzaConfigBackupAutomatico,
} from "./backupAutomaticoTypes";

const CHIAVE_CONFIG = () => STORAGE_KEYS.backupAutomaticoConfig;
const CHIAVE_SNAPSHOT = () => STORAGE_KEYS.backupAutomaticoUltimo;

let esecuzioneInCorso = false;

function leggiConfigGrezzo() {
  return leggiStorage(
    CHIAVE_CONFIG(),
    STORAGE_FALLBACKS[STORAGE_KEYS.backupAutomaticoConfig]
  );
}

function salvaConfigGrezzo(config) {
  return salvaStorage(CHIAVE_CONFIG(), config);
}

/**
 * @returns {object}
 */
export function leggiConfigBackupAutomatico() {
  return normalizzaConfigBackupAutomatico(leggiConfigGrezzo());
}

/**
 * @param {object} config
 * @returns {Promise<object>}
 */
export async function salvaConfigBackupAutomatico(config) {
  const normalizzata = normalizzaConfigBackupAutomatico(config);
  normalizzata.stato = calcolaStatoBackupAutomatico(normalizzata);
  const esito = await salvaConfigGrezzo(normalizzata);
  if (!esito.ok) {
    return {
      config: normalizzata,
      success: false,
      error: esito.error || "config_save_failed",
    };
  }
  return { config: normalizzata, success: true };
}

/**
 * @returns {object|null}
 */
export function leggiSnapshotBackupAutomatico() {
  const grezzo = leggiStorage(
    CHIAVE_SNAPSHOT(),
    STORAGE_FALLBACKS[STORAGE_KEYS.backupAutomaticoUltimo]
  );
  if (!grezzo || typeof grezzo !== "object") return null;
  if (grezzo.app !== "PreventivAI" || !grezzo.dati) return null;
  return grezzo;
}

/**
 * @param {object} backup
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function salvaSnapshotBackupAutomatico(backup) {
  const esito = await salvaStorage(CHIAVE_SNAPSHOT(), backup);
  if (!esito.ok) {
    return { success: false, error: esito.error || "snapshot_save_failed" };
  }
  return { success: true };
}

async function aggiornaPromemoriaBackup(config) {
  await cancellaNotifica(NOTIFICA_BACKUP_AUTO_ID);

  if (!config.enabled || !config.prossimoBackup) return;

  const scadenza = Date.parse(config.prossimoBackup);
  if (!Number.isFinite(scadenza) || scadenza <= Date.now()) return;

  await programmaNotifica({
    id: NOTIFICA_BACKUP_AUTO_ID,
    titolo: "Backup PreventivAI",
    corpo: "Apri PreventivAI per aggiornare il backup automatico.",
    data: config.prossimoBackup,
    extra: { tipo: "backup-automatico" },
  });
}

/**
 * @param {string} frequenza
 * @param {{ now?: () => number }=} opzioni
 * @returns {Promise<{ config: object, success: boolean, error?: string }>}
 */
export async function impostaFrequenzaBackupAutomatico(frequenza, opzioni = {}) {
  const nowFn = opzioni.now || (() => Date.now());
  const adesso = new Date(nowFn()).toISOString();
  const valida = Object.values(FREQUENZE_BACKUP).includes(frequenza)
    ? frequenza
    : FREQUENZE_BACKUP.disattivato;

  const attivo = valida !== FREQUENZE_BACKUP.disattivato;
  const precedente = leggiConfigBackupAutomatico();

  /** @type {object} */
  const config = {
    ...creaConfigBackupAutomaticoDefault(),
    frequenza: valida,
    enabled: attivo,
    ultimoBackup: attivo ? precedente.ultimoBackup : null,
    prossimoBackup: null,
    ultimoErrore: null,
    ultimoErroreIl: null,
    stato: attivo ? STATI_BACKUP_AUTO.in_attesa : STATI_BACKUP_AUTO.disattivato,
  };

  if (attivo) {
    if (!precedente.ultimoBackup) {
      config.prossimoBackup = adesso;
      config.stato = STATI_BACKUP_AUTO.scaduto;
    } else {
      config.prossimoBackup =
        precedente.prossimoBackup ||
        calcolaProssimoBackup(adesso, valida) ||
        adesso;
    }
  }

  const salvato = await salvaConfigBackupAutomatico(config);
  if (salvato.success) {
    await aggiornaPromemoriaBackup(salvato.config);
  }
  return salvato;
}

/**
 * @param {object} config
 * @param {number} nowMs
 * @returns {object}
 */
export function rifrescaStatoConfig(config, nowMs = Date.now()) {
  const cfg = normalizzaConfigBackupAutomatico(config);
  if (!cfg.enabled) {
    return { ...cfg, stato: STATI_BACKUP_AUTO.disattivato };
  }
  if (cfg.stato === STATI_BACKUP_AUTO.errore && cfg.ultimoErrore) {
    return cfg;
  }
  const stato = calcolaStatoBackupAutomatico(cfg, nowMs);
  return { ...cfg, stato };
}

/**
 * Esegue backup se scaduto. Idempotente: una sola esecuzione alla volta.
 *
 * @param {{ now?: () => number, creaBackup?: () => object }=} opzioni
 * @returns {Promise<{ eseguito: boolean, config: object, error?: string, motivo?: string }>}
 */
export async function eseguiBackupAutomaticoSeScaduto(opzioni = {}) {
  if (esecuzioneInCorso) {
    return {
      eseguito: false,
      config: leggiConfigBackupAutomatico(),
      motivo: "gia_in_corso",
    };
  }

  const nowFn = opzioni.now || (() => Date.now());
  const creaBackup = opzioni.creaBackup || creaBackupCompleto;
  let config = rifrescaStatoConfig(leggiConfigBackupAutomatico(), nowFn());

  if (!config.enabled || config.frequenza === FREQUENZE_BACKUP.disattivato) {
    return { eseguito: false, config, motivo: "disattivato" };
  }

  if (!backupAutomaticoScaduto(config, nowFn())) {
    if (config.stato === STATI_BACKUP_AUTO.aggiornato) {
      config = { ...config, stato: STATI_BACKUP_AUTO.in_attesa };
      await salvaConfigBackupAutomatico(config);
    }
    return { eseguito: false, config, motivo: "non_scaduto" };
  }

  esecuzioneInCorso = true;

  try {
    const backup = creaBackup();
    const esitoSnapshot = await salvaSnapshotBackupAutomatico(backup);

    if (!esitoSnapshot.success) {
      const errore =
        esitoSnapshot.error === "QuotaExceededError" ||
        String(esitoSnapshot.error || "").toLowerCase().includes("quota")
          ? "quota_superata"
          : esitoSnapshot.error || "snapshot_save_failed";

      const configErrore = {
        ...config,
        stato: STATI_BACKUP_AUTO.errore,
        ultimoErrore: errore,
        ultimoErroreIl: new Date(nowFn()).toISOString(),
      };
      await salvaConfigBackupAutomatico(configErrore);
      return { eseguito: false, config: configErrore, error: errore };
    }

    const adessoIso = new Date(nowFn()).toISOString();
    const prossimo =
      calcolaProssimoBackup(adessoIso, config.frequenza) ||
      calcolaProssimoBackup(nowFn(), config.frequenza);

    const configOk = {
      ...config,
      ultimoBackup: adessoIso,
      prossimoBackup: prossimo,
      stato: STATI_BACKUP_AUTO.aggiornato,
      ultimoErrore: null,
      ultimoErroreIl: null,
    };

    const salvato = await salvaConfigBackupAutomatico(configOk);
    if (!salvato.success) {
      const configErrore = {
        ...configOk,
        stato: STATI_BACKUP_AUTO.errore,
        ultimoErrore: salvato.error || "config_save_failed",
        ultimoErroreIl: adessoIso,
      };
      await salvaConfigGrezzo(configErrore);
      return {
        eseguito: false,
        config: configErrore,
        error: configErrore.ultimoErrore,
      };
    }

    await aggiornaPromemoriaBackup(salvato.config);
    return { eseguito: true, config: salvato.config };
  } finally {
    esecuzioneInCorso = false;
  }
}

/**
 * @returns {{ disponibile: boolean, backup?: object, error?: string }}
 */
export function ottieniSnapshotPerEsportazione() {
  const backup = leggiSnapshotBackupAutomatico();
  if (!backup) {
    return { disponibile: false, error: "nessun_backup_automatico" };
  }
  return { disponibile: true, backup };
}

/** Esposto per test idempotenza concorrente. */
export function resetEsecuzioneBackupAutomaticoInCorso() {
  esecuzioneInCorso = false;
}
