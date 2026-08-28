/**
 * Backup automatico UX-7.2 — tipi e calcolo scadenze.
 * Config e snapshot fuori APP_DATA_KEYS (solo locale).
 */

export const FREQUENZE_BACKUP = Object.freeze({
  disattivato: "disattivato",
  giornaliero: "giornaliero",
  settimanale: "settimanale",
  mensile: "mensile",
});

export const STATI_BACKUP_AUTO = Object.freeze({
  disattivato: "disattivato",
  aggiornato: "aggiornato",
  in_attesa: "in_attesa",
  scaduto: "scaduto",
  errore: "errore",
});

export const ETICHETTE_FREQUENZA = Object.freeze({
  [FREQUENZE_BACKUP.disattivato]: "Disattivato",
  [FREQUENZE_BACKUP.giornaliero]: "Ogni giorno",
  [FREQUENZE_BACKUP.settimanale]: "Ogni settimana",
  [FREQUENZE_BACKUP.mensile]: "Ogni mese",
});

export const ETICHETTE_STATO = Object.freeze({
  [STATI_BACKUP_AUTO.disattivato]: "Disattivato",
  [STATI_BACKUP_AUTO.aggiornato]: "Aggiornato",
  [STATI_BACKUP_AUTO.in_attesa]: "In attesa",
  [STATI_BACKUP_AUTO.scaduto]: "Scaduto",
  [STATI_BACKUP_AUTO.errore]: "Errore",
});

export const NOTIFICA_BACKUP_AUTO_ID = "backup-automatico-reminder";

/**
 * @returns {object}
 */
export function creaConfigBackupAutomaticoDefault() {
  return {
    frequenza: FREQUENZE_BACKUP.disattivato,
    enabled: false,
    ultimoBackup: null,
    prossimoBackup: null,
    stato: STATI_BACKUP_AUTO.disattivato,
    ultimoErrore: null,
    ultimoErroreIl: null,
  };
}

/**
 * @param {unknown} grezzo
 * @returns {object}
 */
export function normalizzaConfigBackupAutomatico(grezzo) {
  const base = creaConfigBackupAutomaticoDefault();
  if (!grezzo || typeof grezzo !== "object") return base;

  const frequenza = Object.values(FREQUENZE_BACKUP).includes(grezzo.frequenza)
    ? grezzo.frequenza
    : base.frequenza;
  const enabled =
    frequenza !== FREQUENZE_BACKUP.disattivato && Boolean(grezzo.enabled);

  return {
    ...base,
    frequenza,
    enabled,
    ultimoBackup: grezzo.ultimoBackup ? String(grezzo.ultimoBackup) : null,
    prossimoBackup: grezzo.prossimoBackup ? String(grezzo.prossimoBackup) : null,
    stato: Object.values(STATI_BACKUP_AUTO).includes(grezzo.stato)
      ? grezzo.stato
      : enabled
        ? STATI_BACKUP_AUTO.in_attesa
        : STATI_BACKUP_AUTO.disattivato,
    ultimoErrore: grezzo.ultimoErrore ? String(grezzo.ultimoErrore) : null,
    ultimoErroreIl: grezzo.ultimoErroreIl ? String(grezzo.ultimoErroreIl) : null,
  };
}

/**
 * Calcola la prossima esecuzione da un timestamp ISO.
 * Mensile: +1 mese calendario (31 gen → 28/29 feb).
 *
 * @param {string|Date|number} da
 * @param {string} frequenza
 * @returns {string|null} ISO
 */
export function calcolaProssimoBackup(da, frequenza) {
  if (
    !frequenza ||
    frequenza === FREQUENZE_BACKUP.disattivato ||
    !Object.values(FREQUENZE_BACKUP).includes(frequenza)
  ) {
    return null;
  }

  const base =
    da instanceof Date
      ? new Date(da.getTime())
      : new Date(typeof da === "number" ? da : String(da || ""));

  if (Number.isNaN(base.getTime())) return null;

  const prossimo = new Date(base.getTime());

  if (frequenza === FREQUENZE_BACKUP.giornaliero) {
    prossimo.setDate(prossimo.getDate() + 1);
  } else if (frequenza === FREQUENZE_BACKUP.settimanale) {
    prossimo.setDate(prossimo.getDate() + 7);
  } else if (frequenza === FREQUENZE_BACKUP.mensile) {
    const giornoOrigine = prossimo.getDate();
    prossimo.setMonth(prossimo.getMonth() + 1);
    if (prossimo.getDate() !== giornoOrigine) {
      prossimo.setDate(0);
    }
  } else {
    return null;
  }

  return prossimo.toISOString();
}

/**
 * @param {object} config
 * @param {number=} nowMs
 * @returns {boolean}
 */
export function backupAutomaticoScaduto(config, nowMs = Date.now()) {
  const cfg = normalizzaConfigBackupAutomatico(config);
  if (!cfg.enabled || cfg.frequenza === FREQUENZE_BACKUP.disattivato) {
    return false;
  }
  if (!cfg.prossimoBackup) return true;
  const scadenza = Date.parse(cfg.prossimoBackup);
  if (!Number.isFinite(scadenza)) return true;
  return scadenza <= nowMs;
}

/**
 * @param {object} config
 * @param {number=} nowMs
 * @returns {string}
 */
export function calcolaStatoBackupAutomatico(config, nowMs = Date.now()) {
  const cfg = normalizzaConfigBackupAutomatico(config);

  if (!cfg.enabled || cfg.frequenza === FREQUENZE_BACKUP.disattivato) {
    return STATI_BACKUP_AUTO.disattivato;
  }

  if (cfg.stato === STATI_BACKUP_AUTO.errore && cfg.ultimoErrore) {
    return STATI_BACKUP_AUTO.errore;
  }

  if (backupAutomaticoScaduto(cfg, nowMs)) {
    return STATI_BACKUP_AUTO.scaduto;
  }

  if (cfg.stato === STATI_BACKUP_AUTO.aggiornato) {
    return STATI_BACKUP_AUTO.aggiornato;
  }

  return STATI_BACKUP_AUTO.in_attesa;
}

/**
 * @param {string|null|undefined} iso
 * @returns {string}
 */
export function formattaDataOraBackup(iso) {
  if (!iso) return "—";
  const t = Date.parse(String(iso));
  if (!Number.isFinite(t)) return "—";
  return new Date(t).toLocaleString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
