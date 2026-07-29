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
  REMINDER_ATTIVITA: "reminder-attivita",
  REMINDER_SPESA: "reminder-spesa",
  REMINDER_GENERICO: "reminder-generico",
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
 * @property {string=} attivitaId
 * @property {string=} spesaId
 * @property {string} stato
 */

/**
 * Adapter opzionale per push nativo (Capacitor / Web Push).
 * @typedef {Object} NotificationAdapter
 * @property {(plan: NotificationPlan) => Promise<void>=} schedule
 * @property {(id: string) => Promise<void>=} cancel
 */

function creaIdNotifica(type, riferimento = "") {
  return `${type}-${riferimento || "globale"}-${Date.now()}`;
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
   * Pianifica una notifica (solo struttura, nessun invio reale senza adapter).
   * @param {Omit<NotificationPlan, "id"|"stato"> & { id?: string }} notification
   * @returns {Promise<NotificationPlan>|NotificationPlan}
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
      return Promise.resolve(this.adapter.schedule(piano)).then(() => piano);
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

  /**
   * Piano notifiche per un'attività agenda.
   * @param {object} attivita
   * @returns {NotificationPlan[]}
   */
  planForActivity(attivita = {}) {
    const piani = [];
    const base = { attivitaId: String(attivita.id || "") };

    if (attivita.reminder || attivita.ora) {
      piani.push(
        this.schedule({
          ...base,
          type: NOTIFICATION_TYPES.REMINDER_ATTIVITA,
          titolo: attivita.titolo || "Attività",
          messaggio: attivita.ora
            ? `Ricorda alle ${attivita.ora}: ${attivita.titolo || "attività"}.`
            : `Ricorda: ${attivita.titolo || "attività"}.`,
          scheduledAt: attivita.data,
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
   * Piano notifiche per lista spesa / materiali da comprare.
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
   * Reminder generico (promemoria manuale).
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
