/**
 * Service osservazioni Brain — memorizzazione (punto 1–2 del ciclo Brain).
 * Nessuna analisi / conferma / conoscenza automatica.
 */

import {
  cancellaTutteOsservazioni,
  contaOsservazioniRepository,
  inserisciOsservazione,
  leggiOsservazioni,
} from "./brainObservationRepository";
import { creaBrainObservation } from "./brainTypes";

/**
 * Salva un'osservazione (preventivo osservato).
 * Accetta già una BrainObservation oppure (input, proposta, modificheUtente).
 *
 * @param {object} inputOrObservation
 * @param {object=} proposta
 * @param {object=} modificheUtente
 * @returns {object}
 */
export function salvaOsservazione(
  inputOrObservation = {},
  proposta,
  modificheUtente = {}
) {
  const giaFormattata =
    typeof inputOrObservation?.createdAt === "number" &&
    inputOrObservation?.id &&
    proposta === undefined;

  const osservazione = giaFormattata
    ? inputOrObservation
    : creaBrainObservation(inputOrObservation, proposta || {}, modificheUtente);

  return inserisciOsservazione(osservazione);
}

/**
 * @returns {object[]}
 */
export function elencaOsservazioni() {
  return leggiOsservazioni();
}

/**
 * @returns {number}
 */
export function contaOsservazioni() {
  return contaOsservazioniRepository();
}

/**
 * @returns {object[]}
 */
export function cancellaOsservazioni() {
  return cancellaTutteOsservazioni();
}
