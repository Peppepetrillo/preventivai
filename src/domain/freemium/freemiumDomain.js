/**
 * Freemium / trial — logica pura, senza STORAGE_KEYS nuovi.
 * Persistenza del trial start: 🛑 HUMAN-DECISIONS (non inventare chiavi).
 *
 * Flusso commerciale previsto:
 *   TRIAL (15 giorni) → FREE → PRO
 *
 * Prezzi e feature PRO: non definiti qui — vedi docs/FREEMIUM.md.
 */

export const TRIAL_GIORNI = 15;

export const PIANO = Object.freeze({
  TRIAL: "trial",
  FREE: "free",
  PRO: "pro",
});

/**
 * @param {string|number|Date|null|undefined} valore
 * @returns {Date|null}
 */
export function parseDataIso(valore) {
  if (valore == null || valore === "") return null;
  if (valore instanceof Date) {
    return Number.isNaN(valore.getTime()) ? null : valore;
  }
  const d = new Date(valore);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Giorni interi trascorsi da inizio trial (floor).
 * @param {Date} inizio
 * @param {Date} ora
 */
export function giorniTrascorsiDalTrial(inizio, ora = new Date()) {
  const ms = ora.getTime() - inizio.getTime();
  if (ms < 0) return 0;
  return Math.floor(ms / (24 * 60 * 60 * 1000));
}

/**
 * Calcola stato piano da record locale (non persistito finché human GO).
 *
 * @param {{
 *   trialIniziatoIl?: string|Date|null,
 *   pianoOverride?: 'trial'|'free'|'pro'|null,
 *   abbonamentoAttivo?: boolean,
 * }=} record
 * @param {Date=} ora
 * @returns {{
 *   piano: 'trial'|'free'|'pro',
 *   trialAttivo: boolean,
 *   giorniRimanenti: number|null,
 *   giorniTrascorsi: number|null,
 *   trialScaduto: boolean,
 *   messaggioUtente: string,
 *   datiConservati: true,
 * }}
 */
export function calcolaStatoFreemium(record = {}, ora = new Date()) {
  if (record.abbonamentoAttivo || record.pianoOverride === PIANO.PRO) {
    return {
      piano: PIANO.PRO,
      trialAttivo: false,
      giorniRimanenti: null,
      giorniTrascorsi: null,
      trialScaduto: false,
      messaggioUtente: "Piano Pro attivo.",
      datiConservati: true,
    };
  }

  if (record.pianoOverride === PIANO.FREE) {
    return {
      piano: PIANO.FREE,
      trialAttivo: false,
      giorniRimanenti: 0,
      giorniTrascorsi: null,
      trialScaduto: true,
      messaggioUtente:
        "Periodo di prova terminato. I tuoi dati restano disponibili.",
      datiConservati: true,
    };
  }

  const inizio = parseDataIso(record.trialIniziatoIl);
  if (!inizio) {
    // Nessuna persistenza ancora: trattato come trial non avviato (UI onboarding).
    return {
      piano: PIANO.TRIAL,
      trialAttivo: false,
      giorniRimanenti: TRIAL_GIORNI,
      giorniTrascorsi: 0,
      trialScaduto: false,
      messaggioUtente: `${TRIAL_GIORNI} giorni di prova gratuiti all’attivazione.`,
      datiConservati: true,
    };
  }

  const trascorsi = giorniTrascorsiDalTrial(inizio, ora);
  const rimanenti = Math.max(0, TRIAL_GIORNI - trascorsi);
  const scaduto = rimanenti <= 0;

  if (scaduto) {
    return {
      piano: PIANO.FREE,
      trialAttivo: false,
      giorniRimanenti: 0,
      giorniTrascorsi: trascorsi,
      trialScaduto: true,
      messaggioUtente:
        "Periodo di prova terminato. I tuoi dati restano disponibili.",
      datiConservati: true,
    };
  }

  return {
    piano: PIANO.TRIAL,
    trialAttivo: true,
    giorniRimanenti: rimanenti,
    giorniTrascorsi: trascorsi,
    trialScaduto: false,
    messaggioUtente:
      rimanenti === 1
        ? "Ultimo giorno di prova gratuita."
        : `Prova gratuita: ${rimanenti} giorni rimanenti.`,
    datiConservati: true,
  };
}

/**
 * Gate soft per feature premium future.
 * Oggi: trial e pro consentono tutto; free non blocca dati (solo segnale UI).
 *
 * @param {{ piano?: string, feature?: string }=} ctx
 * @returns {{ consentito: boolean, codice?: string, messaggio?: string }}
 */
export function valutaAccessoFeature(ctx = {}) {
  const piano = ctx.piano || PIANO.TRIAL;
  // Nessuna feature PRO bloccata finché human non decide il catalogo piani.
  void ctx.feature;
  if (piano === PIANO.FREE) {
    return {
      consentito: true,
      codice: "free_senza_limiti_ancora",
      messaggio:
        "Piano Free: i limiti Pro saranno definiti prima della pubblicazione.",
    };
  }
  return { consentito: true };
}
