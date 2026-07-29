/**
 * Struttura notifiche intelligenti.
 * Implementazione push/reminder nativi prevista in sprint futuri.
 */

export const NOTIFICATION_TYPES = Object.freeze({
  REMINDER_SERATA: "reminder-serata",
  REMINDER_60MIN: "reminder-60min",
  REMINDER_MATERIALI: "reminder-materiali",
  REMINDER_PAGAMENTO: "reminder-pagamento",
  REMINDER_CHECKLIST: "reminder-checklist",
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
 * @property {string|Date=} scheduledAt
 * @property {string=} lavoroId
 * @property {string} stato
 */

function creaIdNotifica(type, lavoroId = "") {
  return `${type}-${lavoroId || "globale"}-${Date.now()}`;
}

export class NotificationService {
  constructor() {
    /** @type {NotificationPlan[]} */
    this.pianificate = [];
  }

  /**
   * Pianifica una notifica (solo struttura, nessun invio reale).
   * @param {Omit<NotificationPlan, "id"|"stato"> & { id?: string }} notification
   * @returns {NotificationPlan}
   */
  schedule(notification) {
    const piano = {
      id: notification.id || creaIdNotifica(notification.type, notification.lavoroId),
      stato: NOTIFICATION_STATUS.PIANIFICATA,
      ...notification,
    };
    this.pianificate.push(piano);
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
   * Genera il piano notifiche per un lavoro dell'agenda.
   * @param {object} lavoro
   * @returns {NotificationPlan[]}
   */
  planForLavoro(lavoro = {}) {
    const piani = [];
    const base = {
      lavoroId: String(lavoro.id || ""),
    };

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
}

export const notificationService = new NotificationService();
