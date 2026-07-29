/**
 * Layer astratto per integrazione calendario esterno.
 * Implementazioni future: Apple Calendar, Google Calendar.
 */

/**
 * @typedef {Object} CalendarEventInput
 * @property {string} id
 * @property {string} titolo
 * @property {string=} descrizione
 * @property {string=} indirizzo
 * @property {string|Date=} inizio
 * @property {string|Date=} fine
 * @property {string=} tipoLavoro
 * @property {string=} link
 */

/**
 * @typedef {Object} CalendarSyncResult
 * @property {boolean} ok
 * @property {string=} externalId
 * @property {string=} provider
 * @property {string=} messaggio
 */

const PROVIDER_LOCALE = "locale";

function creaRisultatoLocale(partial = {}) {
  return {
    ok: true,
    provider: PROVIDER_LOCALE,
    ...partial,
  };
}

/**
 * Adapter opzionale per provider calendario.
 * @typedef {Object} CalendarAdapter
 * @property {(event: CalendarEventInput) => Promise<CalendarSyncResult>} createCalendarEvent
 * @property {(id: string, event: CalendarEventInput) => Promise<CalendarSyncResult>} updateCalendarEvent
 * @property {(id: string) => Promise<CalendarSyncResult>} deleteCalendarEvent
 * @property {(lavoro: object) => Promise<CalendarSyncResult>} syncJob
 */

export class CalendarService {
  /**
   * @param {CalendarAdapter|null} adapter
   */
  constructor(adapter = null) {
    this.adapter = adapter;
  }

  /**
   * @param {CalendarEventInput} event
   * @returns {Promise<CalendarSyncResult>}
   */
  async createCalendarEvent(event) {
    if (this.adapter?.createCalendarEvent) {
      return this.adapter.createCalendarEvent(event);
    }
    return creaRisultatoLocale({
      externalId: `local-${event.id}`,
      messaggio: "Evento registrato localmente. Sync calendario non ancora attivo.",
    });
  }

  /**
   * @param {string} id
   * @param {CalendarEventInput} event
   * @returns {Promise<CalendarSyncResult>}
   */
  async updateCalendarEvent(id, event) {
    if (this.adapter?.updateCalendarEvent) {
      return this.adapter.updateCalendarEvent(id, event);
    }
    return creaRisultatoLocale({
      externalId: id,
      messaggio: "Aggiornamento locale. Sync calendario non ancora attivo.",
    });
  }

  /**
   * @param {string} id
   * @returns {Promise<CalendarSyncResult>}
   */
  async deleteCalendarEvent(id) {
    if (this.adapter?.deleteCalendarEvent) {
      return this.adapter.deleteCalendarEvent(id);
    }
    return creaRisultatoLocale({
      externalId: id,
      messaggio: "Eliminazione locale. Sync calendario non ancora attivo.",
    });
  }

  /**
   * Sincronizza un lavoro dell'agenda con il calendario esterno.
   * @param {object} lavoro
   * @returns {Promise<CalendarSyncResult>}
   */
  async syncJob(lavoro = {}) {
    if (this.adapter?.syncJob) {
      return this.adapter.syncJob(lavoro);
    }

    const event = {
      id: String(lavoro.id || ""),
      titolo: lavoro.titolo || lavoro.cliente || "Lavoro",
      descrizione: lavoro.cliente || "",
      indirizzo: lavoro.indirizzo || "",
      inizio: lavoro.data && lavoro.orario ? `${lavoro.data} ${lavoro.orario}` : undefined,
      tipoLavoro: lavoro.tipoLavoro,
      link: lavoro.link,
    };

    if (!event.id) {
      return { ok: false, provider: PROVIDER_LOCALE, messaggio: "Lavoro senza id." };
    }

    return this.createCalendarEvent(event);
  }
}

/** Istanza singleton con adapter locale (no-op esterno). */
export const calendarService = new CalendarService();
