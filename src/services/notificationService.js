/**
 * Notifiche locali PreventivAI.
 * - Planner in-memory (Agenda / GlobalCreate) — API storica
 * - Bridge Capacitor LocalNotifications su iPhone — no push remota
 * - Su web/PWA: no-op sicuro (nessun crash)
 */

import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";

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
  return `${type}-${riferimento || "globale"}-${Date.now()}`;
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
    const piano = {
      id:
        notification.id ||
        creaIdNotifica(
          notification.type,
          notification.lavoroId ||
            notification.attivitaId ||
            notification.spesaId ||
            ""
        ),
      stato: NOTIFICATION_STATUS.PIANIFICATA,
      ...notification,
    };
    this.pianificate.push(piano);

    if (this.adapter?.schedule) {
      void Promise.resolve(this.adapter.schedule(piano));
    } else {
      const at = normalizzaDataNotifica(piano.scheduledAt);
      if (at && at.getTime() > Date.now()) {
        void programmaNotifica({
          id: piano.id,
          titolo: piano.titolo,
          corpo: piano.messaggio,
          data: at,
          extra: {
            type: piano.type,
            lavoroId: piano.lavoroId || "",
            attivitaId: piano.attivitaId || "",
            spesaId: piano.spesaId || "",
          },
        });
      }
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
   * @param {object} lavoro
   * @param {{ reminderMinutes?: number|null }} [opzioni]
   * @returns {NotificationPlan[]}
   */
  planForLavoro(lavoro = {}, opzioni = {}) {
    const piani = [];
    const base = {
      lavoroId: String(lavoro.id || ""),
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

      const scheduledAt =
        lavoro.startAt && Number.isFinite(lavoro.startAt)
          ? lavoro.startAt - n * 60_000
          : undefined;

      piani.push(
        this.schedule({
          ...base,
          type,
          titolo,
          messaggio: `Intervento alle ${lavoro.orario || lavoro.scheduledTime || "—"}: ${lavoro.cliente || lavoro.titolo}.`,
          scheduledAt,
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
        })
      );

      piani.push(
        this.schedule({
          ...base,
          type: NOTIFICATION_TYPES.REMINDER_60MIN,
          titolo: "Tra un'ora",
          messaggio: `Intervento alle ${lavoro.orario || "—"}: ${lavoro.cliente || lavoro.titolo}.`,
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
    const base = { attivitaId: String(attivita.id || "") };
    const scheduledAt = combinaDataOraItaliana(attivita.data, attivita.ora);

    if (attivita.reminder || attivita.ora) {
      piani.push(
        this.schedule({
          ...base,
          type: NOTIFICATION_TYPES.REMINDER_ATTIVITA,
          titolo: attivita.titolo || "Attività",
          messaggio: attivita.ora
            ? `Ricorda alle ${attivita.ora}: ${attivita.titolo || "attività"}.`
            : `Ricorda: ${attivita.titolo || "attività"}.`,
          scheduledAt: scheduledAt || undefined,
        })
      );
    }

    if (attivita.priorita === "alta") {
      piani.push(
        this.schedule({
          ...base,
          type: NOTIFICATION_TYPES.REMINDER_ATTIVITA,
          titolo: "Attività urgente",
          messaggio: `${attivita.titolo || "Attività"} ha priorità alta.`,
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

    const piano = this.schedule({
      type: NOTIFICATION_TYPES.REMINDER_SPESA,
      titolo: "Materiale da comprare",
      messaggio:
        voci.length === 1
          ? `Compra: ${voci[0].nome || "1 materiale"}.`
          : `${voci.length} materiali da acquistare oggi.`,
      spesaId: String(shopping.id || voci[0]?.id || ""),
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
