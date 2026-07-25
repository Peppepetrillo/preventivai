/**
 * PreventivAI Brain — tipi e factory (nessun learning in questo sprint).
 *
 * Flusso futuro:
 * 1. Osservare → 2. Memorizzare → 3. Analizzare → 4. Conferma → 5. Conoscenza Personale
 */

/**
 * @typedef {Object} BrainObservation
 * @property {string} id
 * @property {number} createdAt
 * @property {string} tipoImmobile
 * @property {number|null} superficieMq
 * @property {number} livelli
 * @property {string} statoImmobile
 * @property {string} livelloImpianto
 * @property {string} serieCivile
 * @property {Object} extra
 * @property {Object} propostaOriginale
 * @property {Object} modificheUtente
 */

/**
 * @typedef {Object} PersonalKnowledge
 * @property {string} id
 * @property {number} createdAt
 * @property {string=} titolo
 * @property {string=} categoria
 * @property {string=} descrizione
 * @property {"brain"|"manuale"|string=} origine
 * @property {string|null=} patternId
 * @property {number|null=} affidabilita
 * @property {number|null=} osservazioni
 * @property {Object=} payload
 */

/**
 * @returns {string}
 */
export function creaIdBrain(prefisso = "brain") {
  return `${prefisso}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Converte livelli UI ("1"|"2"|"3"|"4+"|number) in numero.
 * @param {string|number=} valore
 * @returns {number}
 */
export function normalizzaLivelliBrain(valore) {
  if (String(valore) === "4+") return 4;
  const n = Number(valore);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

/**
 * @param {object} input
 * @param {object} proposta
 * @param {object=} modificheUtente
 * @returns {BrainObservation}
 */
export function creaBrainObservation(input = {}, proposta = {}, modificheUtente = {}) {
  const mqGrezzo = input.superficieMq ?? input.mq;
  let superficieMq = null;
  if (mqGrezzo !== null && mqGrezzo !== undefined && mqGrezzo !== "") {
    const n = Number(mqGrezzo);
    superficieMq = Number.isFinite(n) ? n : null;
  }

  return {
    id: creaIdBrain("obs"),
    createdAt: Date.now(),
    tipoImmobile: String(input.tipoImmobile || ""),
    superficieMq,
    livelli: normalizzaLivelliBrain(input.livelli ?? input.numeroLivelli),
    statoImmobile: String(input.statoImmobile || ""),
    livelloImpianto: String(input.livelloImpianto || ""),
    serieCivile: String(input.serieCivile || ""),
    extra:
      input.extra && typeof input.extra === "object" ? { ...input.extra } : {},
    propostaOriginale:
      proposta && typeof proposta === "object" ? { ...proposta } : {},
    modificheUtente:
      modificheUtente && typeof modificheUtente === "object"
        ? { ...modificheUtente }
        : {},
  };
}
