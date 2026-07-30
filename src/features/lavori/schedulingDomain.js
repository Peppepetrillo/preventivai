/**
 * Dominio pianificazione temporale per lavori in agenda.
 * Retrocompatibile con dataIntervento / orario / durataStimata.
 */

/** @typedef {"pianificato"|"in-corso"|"completato"|"rimandato"} StatoPianificazione */

export const STATO_PIANIFICAZIONE = Object.freeze({
  PIANIFICATO: "pianificato",
  IN_CORSO: "in-corso",
  COMPLETATO: "completato",
  RIMANDATO: "rimandato",
});

export const ETICHETTE_STATO_PIANIFICAZIONE = Object.freeze({
  [STATO_PIANIFICAZIONE.PIANIFICATO]: "Pianificato",
  [STATO_PIANIFICAZIONE.IN_CORSO]: "In corso",
  [STATO_PIANIFICAZIONE.COMPLETATO]: "Completato",
  [STATO_PIANIFICAZIONE.RIMANDATO]: "Rimandato",
});

/** Preset reminder supportati (minuti prima dell'inizio). */
export const REMINDER_PRESETS = Object.freeze([
  { id: "15", minutes: 15, label: "15 minuti prima" },
  { id: "30", minutes: 30, label: "30 minuti prima" },
  { id: "60", minutes: 60, label: "1 ora prima" },
  { id: "giorno-prima", minutes: 24 * 60, label: "Il giorno precedente" },
  { id: "personalizzato", minutes: null, label: "Personalizzato" },
]);

/** Slot orari rapidi per TimePickerField. */
export const ORARI_SUGGERITI = Object.freeze([
  "07:00",
  "07:30",
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
]);

export const DURATE_SUGGERITE = Object.freeze([
  { minuti: 30, label: "30 min" },
  { minuti: 60, label: "1 h" },
  { minuti: 90, label: "1 h 30" },
  { minuti: 120, label: "2 h" },
  { minuti: 180, label: "3 h" },
  { minuti: 240, label: "4 h" },
]);

export const PRIORITA_LAVORO = Object.freeze({
  BASSA: "bassa",
  MEDIA: "media",
  ALTA: "alta",
});

/**
 * Formatta Date → DD/MM/YYYY.
 * @param {Date} data
 */
export function formattaDataLocale(data = new Date()) {
  return data.toLocaleDateString("it-IT");
}

/**
 * Parse DD/MM/YYYY o ISO → Date a mezzanotte.
 * @param {string|Date|null|undefined} grezzo
 * @returns {Date|null}
 */
export function parseDataScheduling(grezzo) {
  if (!grezzo) return null;
  if (grezzo instanceof Date && !Number.isNaN(grezzo.getTime())) {
    const d = new Date(grezzo);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  const testo = String(grezzo).trim();
  const matchIt = testo.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (matchIt) {
    const d = new Date(
      Number(matchIt[3]),
      Number(matchIt[2]) - 1,
      Number(matchIt[1])
    );
    if (Number.isNaN(d.getTime())) return null;
    d.setHours(0, 0, 0, 0);
    return d;
  }
  const iso = Date.parse(testo);
  if (!Number.isFinite(iso)) return null;
  const d = new Date(iso);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * @param {string} ora HH:mm
 * @returns {{ ore: number, minuti: number }|null}
 */
export function parseOra(ora = "") {
  const match = String(ora).trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const ore = Number(match[1]);
  const minuti = Number(match[2]);
  if (ore > 23 || minuti > 59) return null;
  return { ore, minuti };
}

/**
 * Calcola timestamp inizio da data + ora.
 * @param {string|Date} scheduledDate
 * @param {string} scheduledTime
 * @returns {number|null} epoch ms
 */
export function calcolaStartAt(scheduledDate, scheduledTime) {
  const giorno = parseDataScheduling(scheduledDate);
  const ora = parseOra(scheduledTime);
  if (!giorno || !ora) return null;
  const start = new Date(giorno);
  start.setHours(ora.ore, ora.minuti, 0, 0);
  return start.getTime();
}

/**
 * @param {number|null} startAt
 * @param {number|null|undefined} estimatedDuration minuti
 * @returns {number|null}
 */
export function calcolaEndAt(startAt, estimatedDuration) {
  if (!startAt) return null;
  const minuti = Number(estimatedDuration);
  if (!Number.isFinite(minuti) || minuti <= 0) return null;
  return startAt + minuti * 60_000;
}

/**
 * Legge la struttura temporale da un record (cantiere/lavoro), con fallback legacy.
 * @param {object} record
 */
export function leggiScheduling(record = {}) {
  const scheduledDate =
    record.scheduledDate ||
    record.dataIntervento ||
    record.dataProgrammata ||
    record.dataAppuntamento ||
    record.data ||
    record.extra?.scheduledDate ||
    record.extra?.dataIntervento ||
    "";

  const scheduledTime =
    record.scheduledTime ||
    record.orario ||
    record.ora ||
    record.extra?.scheduledTime ||
    record.extra?.orario ||
    "";

  const estimatedDuration = Number(
    record.estimatedDuration ??
      record.durataStimata ??
      record.extra?.estimatedDuration ??
      record.extra?.durataStimata ??
      0
  );

  const startAt =
    record.startAt ||
    calcolaStartAt(scheduledDate, scheduledTime) ||
    null;

  const endAt =
    record.endAt ||
    calcolaEndAt(startAt, estimatedDuration > 0 ? estimatedDuration : null) ||
    null;

  const reminderEnabled = Boolean(
    record.reminderEnabled ?? record.extra?.reminderEnabled ?? false
  );
  const reminderMinutes = Number(
    record.reminderMinutes ?? record.extra?.reminderMinutes ?? 60
  );

  return {
    scheduledDate: String(scheduledDate || "").trim(),
    scheduledTime: String(scheduledTime || "").trim(),
    estimatedDuration:
      Number.isFinite(estimatedDuration) && estimatedDuration > 0
        ? estimatedDuration
        : null,
    startAt,
    endAt,
    reminderEnabled,
    reminderMinutes: Number.isFinite(reminderMinutes) ? reminderMinutes : 60,
  };
}

/**
 * Costruisce il blocco scheduling da un form NuovoLavoroSheet.
 * @param {object} form
 */
export function costruisciSchedulingDaForm(form = {}) {
  const scheduledDate = String(form.scheduledDate || form.data || "").trim();
  const scheduledTime = String(form.scheduledTime || form.ora || "").trim();
  const estimatedDuration = Number(
    form.estimatedDuration ?? form.durataStimata ?? 0
  );
  const durata =
    Number.isFinite(estimatedDuration) && estimatedDuration > 0
      ? estimatedDuration
      : null;
  const startAt = calcolaStartAt(scheduledDate, scheduledTime);
  const endAt = calcolaEndAt(startAt, durata);
  const reminderEnabled = Boolean(form.reminderEnabled);
  const reminderMinutes = Number(form.reminderMinutes ?? 60);

  return {
    scheduledDate,
    scheduledTime,
    estimatedDuration: durata,
    startAt,
    endAt,
    reminderEnabled,
    reminderMinutes:
      reminderEnabled && Number.isFinite(reminderMinutes)
        ? reminderMinutes
        : null,
    // Alias legacy per selector agenda esistenti
    dataIntervento: scheduledDate,
    orario: scheduledTime,
    durataStimata: durata,
  };
}

/**
 * Mappa stato cantiere → stato pianificazione agenda.
 * @param {object} record
 * @returns {StatoPianificazione}
 */
export function risolviStatoPianificazione(record = {}) {
  const esplicito = String(
    record.statoPianificazione || record.extra?.statoPianificazione || ""
  ).toLowerCase();
  if (Object.values(STATO_PIANIFICAZIONE).includes(esplicito)) {
    return /** @type {StatoPianificazione} */ (esplicito);
  }

  const stato = record.stato || "";
  if (stato === "Completato") return STATO_PIANIFICAZIONE.COMPLETATO;
  if (stato === "Rimandato") return STATO_PIANIFICAZIONE.RIMANDATO;
  if (stato === "In corso" || stato === "In pausa") {
    return STATO_PIANIFICAZIONE.IN_CORSO;
  }
  return STATO_PIANIFICAZIONE.PIANIFICATO;
}

/**
 * @param {StatoPianificazione} stato
 */
export function etichettaStatoPianificazione(stato) {
  if (stato === "programmato") return ETICHETTE_STATO_PIANIFICAZIONE.pianificato;
  return (
    ETICHETTE_STATO_PIANIFICAZIONE[stato] ||
    ETICHETTE_STATO_PIANIFICAZIONE.pianificato
  );
}

/**
 * @param {StatoPianificazione} stato
 */
export function classeBadgeStatoPianificazione(stato) {
  if (stato === STATO_PIANIFICAZIONE.COMPLETATO) {
    return "ds-badge ds-badge-completato";
  }
  if (stato === STATO_PIANIFICAZIONE.IN_CORSO) {
    return "ds-badge ds-badge-in-corso";
  }
  if (stato === STATO_PIANIFICAZIONE.RIMANDATO) {
    return "ds-badge ds-badge-sospeso";
  }
  return "ds-badge ds-badge-da-iniziare";
}

/**
 * Simbolo stato timeline (○ ◔ ● ⚠) — testo accessibile via aria.
 * @param {StatoPianificazione} stato
 */
export function glifoStatoPianificazione(stato) {
  if (stato === STATO_PIANIFICAZIONE.COMPLETATO) return "●";
  if (stato === STATO_PIANIFICAZIONE.IN_CORSO) return "◔";
  if (stato === STATO_PIANIFICAZIONE.RIMANDATO) return "!";
  return "○";
}

/**
 * Timestamp reminder a partire da startAt e minuti prima.
 * @param {number} startAt
 * @param {number} reminderMinutes
 */
export function calcolaReminderAt(startAt, reminderMinutes) {
  if (!startAt || !Number.isFinite(Number(reminderMinutes))) return null;
  return startAt - Number(reminderMinutes) * 60_000;
}
