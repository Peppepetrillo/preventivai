/**
 * Notifiche locali PreventivAI.
 * - Planner in-memory (Agenda / GlobalCreate) — API storica
 * - Bridge Capacitor LocalNotifications su iPhone — no push remota
 * - Su web/PWA: no-op sicuro (nessun crash)
 */

import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";

import {
  haProgrammazioneMultiGiorno,
  leggiProgrammazione,
  normalizzaStatoGiornata,
  STATI_GIORNATA,
} from "../features/cantieri/services/programmazioneCantiereService";
import { creaLavoroDaCantiere } from "../features/lavori/lavoriDomain";
import { calcolaReminderAt } from "../features/lavori/schedulingDomain";

export const NOTIFICATION_TYPES = Object.freeze({
  REMINDER_SERATA: "reminder-serata",
  REMINDER_15MIN: "reminder-15min",
  REMINDER_30MIN: "reminder-30min",
  REMINDER_60MIN: "reminder-60min",
  REMINDER_MATERIALI: "reminder-materiali",
  REMINDER_PAGAMENTO: "reminder-pagamento",
  REMINDER_CHECKLIST: "reminder-checklist",
  REMINDER_ATTIVITA: "reminder-attivita",
  REMINDER_SPESA: "reminder-spesa",
  REMINDER_GENERICO: "reminder-generico",
  REMINDER_PERSONALIZZATO: "reminder-personalizzato",
});

export const TIPI_NOTIFICA_BETA = Object.freeze({
  SOPRALLUOGO: "sopralluogo",
  PREVENTIVO_DA_INVIARE: "preventivo-da-inviare",
  MATERIALI_DA_ACQUISTARE: "materiali-da-acquistare",
  LAVORO_IN_RITARDO: "lavoro-in-ritardo",
  CANTIERE_DA_COMPLETARE: "cantiere-da-completare",
});

export const NOTIFICATION_STATUS = Object.freeze({
  PIANIFICATA: "pianificata",
  INVIATA: "inviata",
  ANNULLATA: "annullata",
});

/**
 * @typedef {Object} NotificationPlan
 * @property {string} id
 * @property {string} type
 * @property {string} titolo
 * @property {string} messaggio
 * @property {string|Date|number=} scheduledAt
 * @property {string=} lavoroId
 * @property {string=} attivitaId
 * @property {string=} spesaId
 * @property {string} stato
 */

/**
 * @typedef {Object} NotificationAdapter
 * @property {(plan: NotificationPlan) => Promise<void>=} schedule
 * @property {(id: string) => Promise<void>=} cancel
 */

function creaIdNotifica(type, riferimento = "") {
  const ref = String(riferimento || "").trim();
  if (ref) return `${type}-${ref}`;
  return `${type}-globale-${Date.now()}`;
}

/** Tipi di notifica legati a un lavoro/cantiere (ID stabile `${tipo}-${lavoroId}`). */
const TIPI_NOTIFICA_LAVORO = [
  NOTIFICATION_TYPES.REMINDER_SERATA,
  NOTIFICATION_TYPES.REMINDER_15MIN,
  NOTIFICATION_TYPES.REMINDER_30MIN,
  NOTIFICATION_TYPES.REMINDER_60MIN,
  NOTIFICATION_TYPES.REMINDER_MATERIALI,
  NOTIFICATION_TYPES.REMINDER_PAGAMENTO,
  NOTIFICATION_TYPES.REMINDER_CHECKLIST,
  NOTIFICATION_TYPES.REMINDER_PERSONALIZZATO,
];

/**
 * Elenca gli ID nativi associati a un lavoro (per cancel prima di reschedule).
 * @param {string|number} lavoroId
 * @returns {string[]}
 */
export function elencaIdNotificheLavoro(lavoroId) {
  const id = String(lavoroId || "").trim();
  if (!id) return [];
  return TIPI_NOTIFICA_LAVORO.map((tipo) => creaIdNotifica(tipo, id));
}

/**
 * Elenca gli ID nativi associati a un'attività.
 * @param {string|number} attivitaId
 * @returns {string[]}
 */
export function elencaIdNotificheAttivita(attivitaId) {
  const id = String(attivitaId || "").trim();
  if (!id) return [];
  return [
    creaIdNotifica(NOTIFICATION_TYPES.REMINDER_ATTIVITA, id),
    creaIdNotifica(NOTIFICATION_TYPES.REMINDER_ATTIVITA, `${id}-urgente`),
  ];
}

/**
 * Riferimento stabile notifiche giornata programmata.
 * @param {string|number} cantiereId
 * @param {string|number} giornataId
 */
export function riferimentoNotificaGiornata(cantiereId, giornataId) {
  const cId = String(cantiereId || "").trim();
  const gId = String(giornataId || "").trim();
  if (!cId || !gId) return "";
  return `${cId}:${gId}`;
}

/**
 * Elenca ID logici notifiche di una singola giornata programmata.
 * @param {string|number} cantiereId
 * @param {string|number} giornataId
 * @returns {string[]}
 */
export function elencaIdNotificheGiornata(cantiereId, giornataId) {
  const ref = riferimentoNotificaGiornata(cantiereId, giornataId);
  if (!ref) return [];
  return TIPI_NOTIFICA_LAVORO.map((tipo) => creaIdNotifica(tipo, ref));
}

/**
 * Elenca tutti gli ID logici (legacy cantiere + ogni giornata programmata).
 * @param {object} cantiere
 * @returns {string[]}
 */
export function elencaIdNotificheCantiereCompleto(cantiere = {}) {
  const cantiereId = String(cantiere.id || "").trim();
  if (!cantiereId) return [];
  const ids = [...elencaIdNotificheLavoro(cantiereId)];
  for (const giornata of leggiProgrammazione(cantiere)) {
    ids.push(...elencaIdNotificheGiornata(cantiereId, giornata.id));
  }
  return ids;
}

/**
 * True se campi di una giornata programmata rilevanti per notifiche sono cambiati.
 * @param {object} precedente
 * @param {object} prossimo
 */
export function campiNotificaGiornataCambiati(precedente = {}, prossimo = {}) {
  const pick = (g) => ({
    data: String(g?.data || "").trim(),
    oraInizio: String(g?.oraInizio || "").trim(),
    stato: normalizzaStatoGiornata(g?.stato),
  });
  return JSON.stringify(pick(precedente)) !== JSON.stringify(pick(prossimo));
}

/**
 * Risolve startAt da giornata programmata (data + oraInizio).
 * @param {object} giornata
 * @returns {number|null}
 */
export function risolviStartAtGiornata(giornata = {}) {
  const daDataOra = combinaDataOraItaliana(giornata.data, giornata.oraInizio || "09:00");
  return daDataOra ? daDataOra.getTime() : null;
}

/**
 * True se la giornata può ricevere notifiche (reminder cantiere attivo, stato valido, data presente).
 * @param {object} giornata
 * @param {object} cantiere
 */
export function giornataNotificabile(giornata = {}, cantiere = {}) {
  if (!cantiere.reminderEnabled) return false;
  const stato = normalizzaStatoGiornata(giornata.stato);
  if (
    stato === STATI_GIORNATA.completata ||
    stato === STATI_GIORNATA.annullata
  ) {
    return false;
  }
  if (!String(giornata.data || "").trim()) return false;
  return risolviStartAtGiornata(giornata) != null;
}

/**
 * Proietta cantiere + giornata in un lavoro virtuale per scheduling notifiche.
 * @param {object} cantiere
 * @param {object} giornata
 */
export function creaLavoroVirtualePerNotificaGiornata(cantiere = {}, giornata = {}) {
  const base = creaLavoroDaCantiere(cantiere);
  const cantiereId = String(cantiere.id || "");
  const giornataId = String(giornata.id || "");
  const ora = String(giornata.oraInizio || "").trim();
  const startAt = risolviStartAtGiornata(giornata);

  return {
    ...base,
    id: riferimentoNotificaGiornata(cantiereId, giornataId),
    cantiereId,
    giornataId,
    scheduledDate: giornata.data,
    scheduledTime: ora,
    dataIntervento: giornata.data,
    orario: ora,
    startAt,
    reminderEnabled: Boolean(cantiere.reminderEnabled),
    reminderMinutes: cantiere.reminderMinutes,
  };
}

/**
 * True se campi rilevanti per le notifiche locali di un lavoro sono cambiati.
 * @param {object} precedente
 * @param {object} prossimo
 */
export function campiNotificaLavoroCambiati(precedente = {}, prossimo = {}) {
  const pick = (c) => ({
    scheduledDate: c?.scheduledDate ?? c?.extra?.scheduledDate ?? "",
    scheduledTime: c?.scheduledTime ?? c?.extra?.scheduledTime ?? "",
    dataIntervento: c?.dataIntervento ?? "",
    orario: c?.orario ?? "",
    startAt: c?.startAt ?? null,
    reminderEnabled: Boolean(c?.reminderEnabled ?? c?.extra?.reminderEnabled),
    reminderMinutes: c?.reminderMinutes ?? c?.extra?.reminderMinutes ?? 60,
    saldo: Number(c?.saldo ?? 0),
    checklistLen: (c?.checklist || []).length,
    materialiLen: (c?.materialiDaComprare || []).length,
    stato: c?.stato ?? "",
    statoPianificazione: c?.statoPianificazione ?? "",
  });
  return JSON.stringify(pick(precedente)) !== JSON.stringify(pick(prossimo));
}

/**
 * Risolve timestamp inizio lavoro per scheduling.
 * @param {object} lavoro
 * @returns {number|null}
 */
export function risolviStartAtLavoro(lavoro = {}) {
  if (lavoro.startAt != null && Number.isFinite(Number(lavoro.startAt))) {
    return Number(lavoro.startAt);
  }
  const daDataOra = combinaDataOraItaliana(
    lavoro.scheduledDate || lavoro.dataIntervento,
    lavoro.scheduledTime || lavoro.orario
  );
  return daDataOra ? daDataOra.getTime() : null;
}

/**
 * Calcola quando inviare una notifica in base al tipo e all'inizio lavoro.
 * @param {string} type
 * @param {object} lavoro
 * @param {number|null} reminderMinutes
 * @returns {number|null}
 */
export function calcolaScheduledAtPerTipo(type, lavoro = {}, reminderMinutes = null) {
  const startAt = risolviStartAtLavoro(lavoro);
  if (!startAt) return null;

  if (reminderMinutes != null && Number(reminderMinutes) > 0) {
    return calcolaReminderAt(startAt, Number(reminderMinutes));
  }

  switch (type) {
    case NOTIFICATION_TYPES.REMINDER_15MIN:
      return calcolaReminderAt(startAt, 15);
    case NOTIFICATION_TYPES.REMINDER_30MIN:
      return calcolaReminderAt(startAt, 30);
    case NOTIFICATION_TYPES.REMINDER_60MIN:
      return calcolaReminderAt(startAt, 60);
    case NOTIFICATION_TYPES.REMINDER_SERATA:
      return calcolaReminderAt(startAt, 24 * 60);
    case NOTIFICATION_TYPES.REMINDER_MATERIALI:
      return calcolaReminderAt(startAt, 24 * 60);
    case NOTIFICATION_TYPES.REMINDER_CHECKLIST:
      return calcolaReminderAt(startAt, 120);
    case NOTIFICATION_TYPES.REMINDER_PAGAMENTO:
      return startAt + 60 * 60_000;
    default:
      return calcolaReminderAt(startAt, 60);
  }
}

/**
 * Risolve scheduledAt per attività/promemoria.
 * @param {object} input
 * @returns {number|null}
 */
export function calcolaScheduledAtAttivita(input = {}) {
  const daDataOra = combinaDataOraItaliana(input.data, input.ora);
  if (daDataOra) return daDataOra.getTime();
  const normalizzata = normalizzaDataNotifica(input.scheduledAt);
  return normalizzata ? normalizzata.getTime() : null;
}

async function sincronizzaNotificaNativa(piano) {
  const at = normalizzaDataNotifica(piano.scheduledAt);
  if (!at || at.getTime() <= Date.now()) {
    // Rimuove eventuale notifica pendente (es. data spostata nel passato).
    await cancellaNotifica(piano.id);
    return { skipped: true, motivo: "data_assente_o_passata" };
  }

  await cancellaNotifica(piano.id);
  return programmaNotifica({
    id: piano.id,
    titolo: piano.titolo,
    corpo: piano.messaggio,
    data: at,
    extra: {
      type: piano.type,
      lavoroId: piano.cantiereId || piano.lavoroId || "",
      giornataId: piano.giornataId || "",
      attivitaId: piano.attivitaId || "",
      spesaId: piano.spesaId || "",
      ...(piano.extra && typeof piano.extra === "object" ? piano.extra : {}),
    },
  });
}

/** ID numerico stabile richiesto da LocalNotifications su iOS. */
export function toNumericNotificationId(id) {
  const numerico = Number(id);
  if (Number.isInteger(numerico) && numerico > 0 && numerico < 2147483647) {
    return numerico;
  }
  const testo = String(id || "");
  let hash = 0;
  for (let i = 0; i < testo.length; i += 1) {
    hash = (hash << 5) - hash + testo.charCodeAt(i);
    hash |= 0;
  }
  const positivo = Math.abs(hash) % 2147483646;
  return positivo === 0 ? 1 : positivo;
}

export function normalizzaDataNotifica(data) {
  if (data == null || data === "") return null;
  if (data instanceof Date) {
    return Number.isNaN(data.getTime()) ? null : data;
  }
  if (typeof data === "number" && Number.isFinite(data)) {
    const d = new Date(data);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const raw = String(data).trim();
  const it = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[ T](\d{1,2}):(\d{2}))?$/);
  if (it) {
    const d = new Date(
      Number(it[3]),
      Number(it[2]) - 1,
      Number(it[1]),
      Number(it[4] || 9),
      Number(it[5] || 0),
      0,
      0
    );
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function combinaDataOraItaliana(data, ora = "") {
  const match = String(data || "").trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return normalizzaDataNotifica(data);
  const [hh = "9", mm = "0"] = String(ora || "09:00").split(":");
  const d = new Date(
    Number(match[3]),
    Number(match[2]) - 1,
    Number(match[1]),
    Number(hh) || 9,
    Number(mm) || 0,
    0,
    0
  );
  return Number.isNaN(d.getTime()) ? null : d;
}

export function notificheDisponibili() {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

/**
 * @returns {Promise<{ granted: boolean, display: string, disponibile: boolean }>}
 */
export async function controllaPermessoNotifiche() {
  if (!notificheDisponibili()) {
    return { granted: false, display: "prompt", disponibile: false };
  }

  try {
    const status = await LocalNotifications.checkPermissions();
    return {
      granted: status?.display === "granted",
      display: String(status?.display || "denied"),
      disponibile: true,
    };
  } catch {
    return { granted: false, display: "denied", disponibile: true };
  }
}

/**
 * @returns {Promise<{ granted: boolean, display: string, disponibile: boolean }>}
 */
export async function richiediPermessoNotifiche() {
  if (!notificheDisponibili()) {
    return { granted: false, display: "prompt", disponibile: false };
  }

  try {
    let status = await LocalNotifications.checkPermissions();
    if (status?.display !== "granted") {
      status = await LocalNotifications.requestPermissions();
    }
    return {
      granted: status?.display === "granted",
      display: String(status?.display || "denied"),
      disponibile: true,
    };
  } catch {
    return { granted: false, display: "denied", disponibile: true };
  }
}

/**
 * @param {{ id: string|number, titolo: string, corpo?: string, data: Date|string|number, extra?: object }} input
 */
export async function programmaNotifica(input = {}) {
  const id = input.id;
  const titolo = String(input.titolo || "").trim();
  const corpo = String(input.corpo || "").trim();

  if (id == null || id === "" || !titolo) {
    return { success: false, error: "dati_incompleti" };
  }

  const when = normalizzaDataNotifica(input.data);
  if (!when) {
    return { success: false, error: "data_invalida" };
  }
  if (when.getTime() <= Date.now()) {
    return { success: false, error: "data_passata" };
  }

  if (!notificheDisponibili()) {
    return { success: true, skipped: true, motivo: "web_fallback" };
  }

  try {
    const permesso = await richiediPermessoNotifiche();
    if (!permesso.granted) {
      return { success: false, error: "permesso_negato" };
    }

    const notifId = toNumericNotificationId(id);
    await LocalNotifications.cancel({
      notifications: [{ id: notifId }],
    });
    await LocalNotifications.schedule({
      notifications: [
        {
          id: notifId,
          title: titolo,
          body: corpo,
          schedule: { at: when, allowWhileIdle: true },
          extra: {
            ...(input.extra && typeof input.extra === "object" ? input.extra : {}),
            logicalId: String(id),
          },
        },
      ],
    });

    return { success: true, id: notifId, at: when.toISOString() };
  } catch (errore) {
    return { success: false, error: errore?.message || "schedule_fallito" };
  }
}

export async function cancellaNotifica(id) {
  if (id == null || id === "") {
    return { success: false, error: "dati_incompleti" };
  }
  if (!notificheDisponibili()) {
    return { success: true, skipped: true, motivo: "web_fallback" };
  }
  try {
    await LocalNotifications.cancel({
      notifications: [{ id: toNumericNotificationId(id) }],
    });
    return { success: true };
  } catch (errore) {
    return { success: false, error: errore?.message || "cancel_fallito" };
  }
}

export async function cancellaTutteNotifiche() {
  if (!notificheDisponibili()) {
    return { success: true, skipped: true, motivo: "web_fallback" };
  }
  try {
    const pending = await LocalNotifications.getPending();
    const lista = Array.isArray(pending?.notifications)
      ? pending.notifications
      : [];
    if (lista.length > 0) {
      await LocalNotifications.cancel({
        notifications: lista.map((n) => ({ id: n.id })),
      });
    }
    return { success: true, cancellate: lista.length };
  } catch (errore) {
    return { success: false, error: errore?.message || "cancel_all_fallito" };
  }
}

/* ——— Helper tipi beta ——— */

export function programmaPromemoriaSopralluogo({
  id,
  cliente = "",
  data,
  indirizzo = "",
} = {}) {
  const nome = String(cliente || "").trim();
  return programmaNotifica({
    id: id || `sopralluogo-${nome || "x"}`,
    titolo: "Sopralluogo",
    corpo: nome
      ? `Promemoria sopralluogo — ${nome}${indirizzo ? `: ${indirizzo}` : ""}`
      : "Hai un sopralluogo in programma.",
    data,
    extra: { tipo: TIPI_NOTIFICA_BETA.SOPRALLUOGO, cliente: nome, indirizzo },
  });
}

export function programmaPreventivoDaInviare({ id, cliente = "", data } = {}) {
  const nome = String(cliente || "").trim();
  return programmaNotifica({
    id: id || `preventivo-inviare-${nome || "x"}`,
    titolo: "Preventivo da inviare",
    corpo: nome
      ? `Ricorda di inviare il preventivo a ${nome}.`
      : "Hai un preventivo da inviare.",
    data,
    extra: { tipo: TIPI_NOTIFICA_BETA.PREVENTIVO_DA_INVIARE, cliente: nome },
  });
}

export function programmaMaterialiDaAcquistare({
  id,
  quantita = 0,
  data,
  etichetta = "",
} = {}) {
  const n = Number(quantita) || 0;
  return programmaNotifica({
    id: id || `materiali-${etichetta || "acquisti"}`,
    titolo: "Materiali da acquistare",
    corpo:
      n > 0
        ? `${n} materiali da acquistare${etichetta ? ` — ${etichetta}` : ""}.`
        : "Hai materiali da acquistare.",
    data,
    extra: {
      tipo: TIPI_NOTIFICA_BETA.MATERIALI_DA_ACQUISTARE,
      quantita: n,
      etichetta,
    },
  });
}

export function programmaLavoroInRitardo({ id, cliente = "", titolo = "", data } = {}) {
  const label = String(titolo || cliente || "Lavoro").trim();
  return programmaNotifica({
    id: id || `lavoro-ritardo-${label}`,
    titolo: "Lavoro in ritardo",
    corpo: `${label} risulta in ritardo. Controlla l'agenda.`,
    data,
    extra: {
      tipo: TIPI_NOTIFICA_BETA.LAVORO_IN_RITARDO,
      cliente: String(cliente || ""),
      titolo: String(titolo || ""),
    },
  });
}

export function programmaCantiereDaCompletare({
  id,
  cliente = "",
  titolo = "",
  data,
} = {}) {
  const label = String(titolo || cliente || "Cantiere").trim();
  return programmaNotifica({
    id: id || `cantiere-completare-${label}`,
    titolo: "Cantiere da completare",
    corpo: `${label}: ricorda di chiudere il cantiere.`,
    data,
    extra: {
      tipo: TIPI_NOTIFICA_BETA.CANTIERE_DA_COMPLETARE,
      cliente: String(cliente || ""),
      titolo: String(titolo || ""),
    },
  });
}

export class NotificationService {
  /**
   * @param {NotificationAdapter|null} adapter
   */
  constructor(adapter = null) {
    /** @type {NotificationPlan[]} */
    this.pianificate = [];
    this.adapter = adapter;
  }

  /**
   * @param {Omit<NotificationPlan, "id"|"stato"> & { id?: string }} notification
   * @returns {NotificationPlan}
   */
  schedule(notification) {
    const riferimento =
      notification.lavoroId ||
      notification.attivitaId ||
      notification.spesaId ||
      "";

    const piano = {
      id:
        notification.id ||
        creaIdNotifica(notification.type, riferimento),
      stato: NOTIFICATION_STATUS.PIANIFICATA,
      ...notification,
    };

    if (!piano.scheduledAt && notification.lavoroId) {
      piano.scheduledAt = calcolaScheduledAtPerTipo(
        piano.type,
        notification.lavoro || {},
        notification.reminderMinutes ?? null
      );
    }

    if (!piano.scheduledAt && (notification.data || notification.ora)) {
      piano.scheduledAt = calcolaScheduledAtAttivita(notification);
    }

    const esistenteIdx = this.pianificate.findIndex(
      (item) =>
        item.id === piano.id && item.stato === NOTIFICATION_STATUS.PIANIFICATA
    );
    if (esistenteIdx >= 0) {
      this.pianificate[esistenteIdx] = piano;
    } else {
      this.pianificate.push(piano);
    }

    if (this.adapter?.schedule) {
      void Promise.resolve(this.adapter.schedule(piano));
    } else {
      void sincronizzaNotificaNativa(piano);
    }

    return piano;
  }

  /**
   * @param {string} id
   */
  cancel(id) {
    const idx = this.pianificate.findIndex((n) => n.id === id);
    if (idx < 0) return null;
    this.pianificate[idx] = {
      ...this.pianificate[idx],
      stato: NOTIFICATION_STATUS.ANNULLATA,
    };
    if (this.adapter?.cancel) {
      void this.adapter.cancel(id);
    } else {
      void cancellaNotifica(id);
    }
    return this.pianificate[idx];
  }

  /**
   * @param {string} [lavoroId]
   * @returns {NotificationPlan[]}
   */
  listPianificate(lavoroId) {
    return this.pianificate.filter(
      (n) =>
        n.stato === NOTIFICATION_STATUS.PIANIFICATA &&
        (!lavoroId || n.lavoroId === lavoroId)
    );
  }

  /**
   * Cancella tutte le notifiche native associate a un lavoro/cantiere.
   * @param {object|string|number} lavoroOrId
   */
  async cancelNotificheLavoro(lavoroOrId) {
    const lavoroId =
      typeof lavoroOrId === "object" && lavoroOrId
        ? String(lavoroOrId.id || "")
        : String(lavoroOrId || "");
    if (!lavoroId) return;

    const ids = elencaIdNotificheLavoro(lavoroId);
    for (const id of ids) {
      const idx = this.pianificate.findIndex((n) => n.id === id);
      if (idx >= 0) {
        this.pianificate[idx] = {
          ...this.pianificate[idx],
          stato: NOTIFICATION_STATUS.ANNULLATA,
        };
      }
      if (this.adapter?.cancel) {
        await Promise.resolve(this.adapter.cancel(id));
      } else {
        await cancellaNotifica(id);
      }
    }
  }

  /**
   * Cancella notifiche legacy del cantiere e di tutte le giornate programmate.
   * @param {object|string|number} cantiereOrId
   */
  async cancelNotificheCantiereCompleto(cantiereOrId) {
    const cantiere =
      typeof cantiereOrId === "object" && cantiereOrId
        ? cantiereOrId
        : { id: cantiereOrId };
    const cantiereId = String(cantiere.id || "");
    if (!cantiereId) return;

    await this.cancelNotificheLavoro(cantiereId);
    for (const giornata of leggiProgrammazione(cantiere)) {
      await this.cancelNotificheGiornata(cantiereId, giornata.id);
    }
  }

  /**
   * Cancella solo le notifiche di una giornata programmata.
   * @param {object|string|number} cantiereOrId
   * @param {object|string|number} giornataOrId
   */
  async cancelNotificheGiornata(cantiereOrId, giornataOrId) {
    const cantiereId =
      typeof cantiereOrId === "object" && cantiereOrId
        ? String(cantiereOrId.id || "")
        : String(cantiereOrId || "");
    const giornataId =
      typeof giornataOrId === "object" && giornataOrId
        ? String(giornataOrId.id || "")
        : String(giornataOrId || "");
    if (!cantiereId || !giornataId) return;

    const ids = elencaIdNotificheGiornata(cantiereId, giornataId);
    for (const id of ids) {
      const idx = this.pianificate.findIndex((n) => n.id === id);
      if (idx >= 0) {
        this.pianificate[idx] = {
          ...this.pianificate[idx],
          stato: NOTIFICATION_STATUS.ANNULLATA,
        };
      }
      if (this.adapter?.cancel) {
        await Promise.resolve(this.adapter.cancel(id));
      } else {
        await cancellaNotifica(id);
      }
    }
  }

  /**
   * Resync centralizzato: legacy singolo intervento o multi-giornata.
   * @param {object} cantiere
   * @param {{ lavoro?: object, reminderMinutes?: number|null }} [opzioni]
   * @returns {Promise<NotificationPlan[]>}
   */
  async resyncNotificheCantiere(cantiere = {}, opzioni = {}) {
    const cantiereId = String(cantiere.id || "");
    if (!cantiereId) return [];

    if (haProgrammazioneMultiGiorno(cantiere)) {
      await this.cancelNotificheLavoro(cantiereId);

      if (!cantiere.reminderEnabled) {
        for (const giornata of leggiProgrammazione(cantiere)) {
          await this.cancelNotificheGiornata(cantiereId, giornata.id);
        }
        return [];
      }

      /** @type {NotificationPlan[]} */
      const piani = [];
      for (const giornata of leggiProgrammazione(cantiere)) {
        if (giornataNotificabile(giornata, cantiere)) {
          const parziali = await this.resyncNotificheGiornata(cantiere, giornata, opzioni);
          piani.push(...parziali);
        } else {
          await this.cancelNotificheGiornata(cantiereId, giornata.id);
        }
      }
      return piani;
    }

    return this.resyncNotificheLavoroLegacy(cantiere, opzioni);
  }

  /**
   * Resync singolo cantiere senza programmazione multi-giornata (legacy).
   * @param {object} cantiereOLavoro
   * @param {{ lavoro?: object, reminderMinutes?: number|null }} [opzioni]
   * @returns {Promise<NotificationPlan[]>}
   */
  async resyncNotificheLavoroLegacy(cantiereOLavoro = {}, opzioni = {}) {
    const lavoroId = String(cantiereOLavoro.id || "");
    if (!lavoroId) return [];

    await this.cancelNotificheLavoro(lavoroId);

    if (!cantiereOLavoro.reminderEnabled) return [];

    const lavoro = opzioni.lavoro || cantiereOLavoro;
    return this.planForLavoro(lavoro, {
      reminderMinutes:
        opzioni.reminderMinutes ?? cantiereOLavoro.reminderMinutes,
    });
  }

  /**
   * Resync: cancel notifiche precedenti + ricalcolo e schedule solo se reminder attivo.
   * @param {object} cantiereOLavoro
   * @param {{ lavoro?: object, reminderMinutes?: number|null }} [opzioni]
   * @returns {Promise<NotificationPlan[]>}
   */
  async resyncNotificheLavoro(cantiereOLavoro = {}, opzioni = {}) {
    return this.resyncNotificheCantiere(cantiereOLavoro, opzioni);
  }

  /**
   * Resync notifiche di una singola giornata programmata.
   * @param {object} cantiere
   * @param {object} giornata
   * @param {{ reminderMinutes?: number|null }} [opzioni]
   * @returns {Promise<NotificationPlan[]>}
   */
  async resyncNotificheGiornata(cantiere = {}, giornata = {}, opzioni = {}) {
    const cantiereId = String(cantiere.id || "");
    const giornataId = String(giornata.id || "");
    if (!cantiereId || !giornataId) return [];

    await this.cancelNotificheGiornata(cantiereId, giornataId);

    if (!giornataNotificabile(giornata, cantiere)) return [];

    const lavoro = creaLavoroVirtualePerNotificaGiornata(cantiere, giornata);
    return this.planForGiornata(cantiere, giornata, lavoro, {
      reminderMinutes: opzioni.reminderMinutes ?? cantiere.reminderMinutes,
    });
  }

  /**
   * Cancella tutte le notifiche native associate a un'attività.
   * @param {object|string|number} attivitaOrId
   */
  async cancelNotificheAttivita(attivitaOrId) {
    const attivitaId =
      typeof attivitaOrId === "object" && attivitaOrId
        ? String(attivitaOrId.id || "")
        : String(attivitaOrId || "");
    if (!attivitaId) return;

    const ids = elencaIdNotificheAttivita(attivitaId);
    for (const id of ids) {
      const idx = this.pianificate.findIndex((n) => n.id === id);
      if (idx >= 0) {
        this.pianificate[idx] = {
          ...this.pianificate[idx],
          stato: NOTIFICATION_STATUS.ANNULLATA,
        };
      }
      if (this.adapter?.cancel) {
        await Promise.resolve(this.adapter.cancel(id));
      } else {
        await cancellaNotifica(id);
      }
    }
  }

  /**
   * Resync notifiche attività: cancel + schedule se reminder o ora impostati.
   * @param {object} attivita
   * @returns {Promise<NotificationPlan[]>}
   */
  async resyncNotificheAttivita(attivita = {}) {
    const attivitaId = String(attivita.id || "");
    if (!attivitaId) return [];

    await this.cancelNotificheAttivita(attivitaId);

    if (!attivita.reminder && !attivita.ora) return [];

    return this.planForActivity(attivita);
  }

  /**
   * @param {object} lavoro
   * @param {{ reminderMinutes?: number|null }} [opzioni]
   * @returns {NotificationPlan[]}
   */
  planForLavoro(lavoro = {}, opzioni = {}) {
    const piani = [];
    const cantiereId = String(lavoro.cantiereId || lavoro.id || "");
    const base = {
      lavoroId: String(lavoro.id || ""),
      cantiereId,
      lavoro,
    };

    const minuti =
      opzioni.reminderMinutes ??
      lavoro.reminderMinutes ??
      (lavoro.reminderEnabled ? 60 : null);

    if (minuti != null && Number(minuti) > 0) {
      const n = Number(minuti);
      let type = NOTIFICATION_TYPES.REMINDER_PERSONALIZZATO;
      let titolo = `${n} minuti prima`;
      if (n === 15) {
        type = NOTIFICATION_TYPES.REMINDER_15MIN;
        titolo = "Tra 15 minuti";
      } else if (n === 30) {
        type = NOTIFICATION_TYPES.REMINDER_30MIN;
        titolo = "Tra 30 minuti";
      } else if (n === 60) {
        type = NOTIFICATION_TYPES.REMINDER_60MIN;
        titolo = "Tra un'ora";
      } else if (n === 24 * 60) {
        type = NOTIFICATION_TYPES.REMINDER_SERATA;
        titolo = "Domani in cantiere";
      }

      piani.push(
        this.schedule({
          ...base,
          type,
          titolo,
          messaggio: `Intervento alle ${lavoro.orario || lavoro.scheduledTime || "—"}: ${lavoro.cliente || lavoro.titolo}.`,
          scheduledAt: calcolaScheduledAtPerTipo(type, lavoro, n),
          reminderMinutes: n,
        })
      );
    } else {
      piani.push(
        this.schedule({
          ...base,
          type: NOTIFICATION_TYPES.REMINDER_SERATA,
          titolo: "Domani in cantiere",
          messaggio: `Preparati per ${lavoro.titolo || lavoro.cliente || "il lavoro di domani"}.`,
          scheduledAt: calcolaScheduledAtPerTipo(
            NOTIFICATION_TYPES.REMINDER_SERATA,
            lavoro
          ),
        })
      );

      piani.push(
        this.schedule({
          ...base,
          type: NOTIFICATION_TYPES.REMINDER_60MIN,
          titolo: "Tra un'ora",
          messaggio: `Intervento alle ${lavoro.orario || "—"}: ${lavoro.cliente || lavoro.titolo}.`,
          scheduledAt: calcolaScheduledAtPerTipo(
            NOTIFICATION_TYPES.REMINDER_60MIN,
            lavoro
          ),
        })
      );
    }

    if ((lavoro.materialiDaComprare || []).length > 0) {
      piani.push(
        this.schedule({
          ...base,
          type: NOTIFICATION_TYPES.REMINDER_MATERIALI,
          titolo: "Materiali da comprare",
          messaggio: `${lavoro.materialiDaComprare.length} materiali da acquistare prima dell'intervento.`,
          scheduledAt: calcolaScheduledAtPerTipo(
            NOTIFICATION_TYPES.REMINDER_MATERIALI,
            lavoro
          ),
        })
      );
    }

    if (lavoro.saldo > 0) {
      piani.push(
        this.schedule({
          ...base,
          type: NOTIFICATION_TYPES.REMINDER_PAGAMENTO,
          titolo: "Saldo da incassare",
          messaggio: `Ricorda il saldo per ${lavoro.cliente || lavoro.titolo}.`,
          scheduledAt: calcolaScheduledAtPerTipo(
            NOTIFICATION_TYPES.REMINDER_PAGAMENTO,
            lavoro
          ),
        })
      );
    }

    if ((lavoro.checklist || []).length > 0) {
      piani.push(
        this.schedule({
          ...base,
          type: NOTIFICATION_TYPES.REMINDER_CHECKLIST,
          titolo: "Checklist da completare",
          messaggio: `${lavoro.checklist.length} attività ancora aperte.`,
          scheduledAt: calcolaScheduledAtPerTipo(
            NOTIFICATION_TYPES.REMINDER_CHECKLIST,
            lavoro
          ),
        })
      );
    }

    return piani;
  }

  /**
   * Pianifica notifiche per una singola giornata programmata (multi-giornata).
   * @param {object} cantiere
   * @param {object} giornata
   * @param {object} lavoro
   * @param {{ reminderMinutes?: number|null }} [opzioni]
   * @returns {NotificationPlan[]}
   */
  planForGiornata(cantiere = {}, giornata = {}, lavoro = {}, opzioni = {}) {
    const piani = [];
    const cantiereId = String(cantiere.id || "");
    const giornataId = String(giornata.id || "");
    const ref = riferimentoNotificaGiornata(cantiereId, giornataId);
    const base = {
      lavoroId: ref,
      cantiereId,
      giornataId,
      lavoro,
    };

    const minuti =
      opzioni.reminderMinutes ??
      lavoro.reminderMinutes ??
      (lavoro.reminderEnabled ? 60 : null);

    if (minuti != null && Number(minuti) > 0) {
      const n = Number(minuti);
      let type = NOTIFICATION_TYPES.REMINDER_PERSONALIZZATO;
      let titolo = `${n} minuti prima`;
      if (n === 15) {
        type = NOTIFICATION_TYPES.REMINDER_15MIN;
        titolo = "Tra 15 minuti";
      } else if (n === 30) {
        type = NOTIFICATION_TYPES.REMINDER_30MIN;
        titolo = "Tra 30 minuti";
      } else if (n === 60) {
        type = NOTIFICATION_TYPES.REMINDER_60MIN;
        titolo = "Tra un'ora";
      } else if (n === 24 * 60) {
        type = NOTIFICATION_TYPES.REMINDER_SERATA;
        titolo = "Domani in cantiere";
      }

      piani.push(
        this.schedule({
          ...base,
          type,
          titolo,
          messaggio: `Intervento alle ${lavoro.orario || lavoro.scheduledTime || "—"}: ${lavoro.cliente || lavoro.titolo}.`,
          scheduledAt: calcolaScheduledAtPerTipo(type, lavoro, n),
          reminderMinutes: n,
        })
      );
    }

    if ((lavoro.materialiDaComprare || []).length > 0) {
      piani.push(
        this.schedule({
          ...base,
          type: NOTIFICATION_TYPES.REMINDER_MATERIALI,
          titolo: "Materiali da comprare",
          messaggio: `${lavoro.materialiDaComprare.length} materiali da acquistare prima dell'intervento.`,
          scheduledAt: calcolaScheduledAtPerTipo(
            NOTIFICATION_TYPES.REMINDER_MATERIALI,
            lavoro
          ),
        })
      );
    }

    if (lavoro.saldo > 0) {
      piani.push(
        this.schedule({
          ...base,
          type: NOTIFICATION_TYPES.REMINDER_PAGAMENTO,
          titolo: "Saldo da incassare",
          messaggio: `Ricorda il saldo per ${lavoro.cliente || lavoro.titolo}.`,
          scheduledAt: calcolaScheduledAtPerTipo(
            NOTIFICATION_TYPES.REMINDER_PAGAMENTO,
            lavoro
          ),
        })
      );
    }

    if ((lavoro.checklist || []).length > 0) {
      piani.push(
        this.schedule({
          ...base,
          type: NOTIFICATION_TYPES.REMINDER_CHECKLIST,
          titolo: "Checklist da completare",
          messaggio: `${lavoro.checklist.length} attività ancora aperte.`,
          scheduledAt: calcolaScheduledAtPerTipo(
            NOTIFICATION_TYPES.REMINDER_CHECKLIST,
            lavoro
          ),
        })
      );
    }

    return piani;
  }

  /**
   * @param {object} attivita
   * @returns {NotificationPlan[]}
   */
  planForActivity(attivita = {}) {
    const piani = [];
    const base = {
      attivitaId: String(attivita.id || ""),
      data: attivita.data,
      ora: attivita.ora,
    };
    const scheduledAt = calcolaScheduledAtAttivita(attivita);

    if (attivita.reminder || attivita.ora) {
      piani.push(
        this.schedule({
          ...base,
          type: NOTIFICATION_TYPES.REMINDER_ATTIVITA,
          titolo: attivita.titolo || "Attività",
          messaggio: attivita.ora
            ? `Ricorda alle ${attivita.ora}: ${attivita.titolo || "attività"}.`
            : `Ricorda: ${attivita.titolo || "attività"}.`,
          scheduledAt,
        })
      );
    }

    if (attivita.priorita === "alta" && scheduledAt) {
      piani.push(
        this.schedule({
          ...base,
          id: creaIdNotifica(
            NOTIFICATION_TYPES.REMINDER_ATTIVITA,
            `${attivita.id}-urgente`
          ),
          type: NOTIFICATION_TYPES.REMINDER_ATTIVITA,
          titolo: "Attività urgente",
          messaggio: `${attivita.titolo || "Attività"} ha priorità alta.`,
          scheduledAt: scheduledAt - 30 * 60_000,
        })
      );
    }

    return piani;
  }

  /**
   * @param {object[]|object} shopping
   * @returns {NotificationPlan[]}
   */
  planForShopping(shopping = []) {
    const voci = Array.isArray(shopping)
      ? shopping
      : shopping.voci || shopping.items || [];
    if (voci.length === 0) return [];

    const spesaId = String(shopping.id || voci[0]?.id || "");
    const domaniMattina = new Date();
    domaniMattina.setDate(domaniMattina.getDate() + 1);
    domaniMattina.setHours(8, 0, 0, 0);

    const piano = this.schedule({
      type: NOTIFICATION_TYPES.REMINDER_SPESA,
      titolo: "Materiale da comprare",
      messaggio:
        voci.length === 1
          ? `Compra: ${voci[0].nome || "1 materiale"}.`
          : `${voci.length} materiali da acquistare oggi.`,
      spesaId,
      scheduledAt: domaniMattina.getTime(),
    });

    return [piano];
  }

  /**
   * @param {{ titolo?: string, messaggio?: string, scheduledAt?: string|Date, attivitaId?: string }} input
   * @returns {NotificationPlan[]}
   */
  planForReminder(input = {}) {
    const piano = this.schedule({
      type: NOTIFICATION_TYPES.REMINDER_GENERICO,
      titolo: input.titolo || "Promemoria",
      messaggio: input.messaggio || input.titolo || "Hai un promemoria.",
      scheduledAt: input.scheduledAt,
      attivitaId: input.attivitaId ? String(input.attivitaId) : "",
    });
    return [piano];
  }
}

export const notificationService = new NotificationService();
