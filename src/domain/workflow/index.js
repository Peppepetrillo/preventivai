/**
 * Adapter default: collega il Workflow Service ai repository reali.
 * La UI e i moduli feature importano da qui le API pronte all'uso.
 */

import { STORAGE_KEYS } from "../../app/storageKeys";
import { creaCantiereDaPreventivo } from "../../features/cantieri/cantieriDomain";
import {
  leggiCantieriTutti,
  salvaCantieri,
} from "../../repositories/cantieriRepository";
import { leggiClientiTutti } from "../../repositories/clientiRepository";
import {
  aggiornaPreventivo,
  leggiPreventiviTutti,
  salvaPreventivi,
} from "../../repositories/preventiviRepository";
import { leggiStorage, salvaStorage } from "../../utils/storage";
import { creaPreventivoWorkflowService } from "./preventivoWorkflowService";

const CHIAVE_TIMELINE = () => STORAGE_KEYS.workflowTimeline;

function leggiTimeline() {
  const grezzo = leggiStorage(CHIAVE_TIMELINE(), []);
  return Array.isArray(grezzo) ? grezzo : [];
}

function salvaTimeline(eventi = []) {
  salvaStorage(CHIAVE_TIMELINE(), Array.isArray(eventi) ? eventi : []);
  return eventi;
}

/** Istanza di produzione con DI sui repository. */
export const preventivoWorkflow = creaPreventivoWorkflowService({
  leggiPreventivi: leggiPreventiviTutti,
  aggiornaPreventivo,
  salvaPreventivi,
  leggiCantieri: leggiCantieriTutti,
  salvaCantieri,
  leggiClienti: leggiClientiTutti,
  creaCantiereDaPreventivo,
  leggiTimeline,
  salvaTimeline,
});

export const accettaPreventivo = (id, opzioni) =>
  preventivoWorkflow.accettaPreventivo(id, opzioni);

export const convertiInCantiere = (id, opzioni) =>
  preventivoWorkflow.convertiInCantiere(id, opzioni);

export const completaLavoroDaCantiere = (id, opzioni) =>
  preventivoWorkflow.completaLavoroDaCantiere(id, opzioni);

export const sincronizzaVarianteSuPreventivo = (id, variante) =>
  preventivoWorkflow.sincronizzaVarianteSuPreventivo(id, variante);

export const rifiutaPreventivo = (id, opzioni) =>
  preventivoWorkflow.rifiutaPreventivo(id, opzioni);

export const annullaPreventivo = (id, opzioni) =>
  preventivoWorkflow.annullaPreventivo(id, opzioni);

export const inviaPreventivo = (id, opzioni) =>
  preventivoWorkflow.inviaPreventivo(id, opzioni);

export const ottieniAzioniDisponibili = (preventivo) =>
  preventivoWorkflow.ottieniAzioniDisponibili(preventivo);

export const ottieniTimeline = (preventivoId) =>
  preventivoWorkflow.ottieniTimeline(preventivoId);

export const contaPreventiviConvertiti = () =>
  preventivoWorkflow.contaPreventiviConvertiti();

export const trovaCantiereCollegato = (preventivo) =>
  preventivoWorkflow.trovaCantiereCollegato(preventivo);

export { creaPreventivoWorkflowService } from "./preventivoWorkflowService";
export {
  AZIONI_PREVENTIVO,
  EVENTI_WORKFLOW,
  EVENTI_WORKFLOW_LABEL,
  STATI_PREVENTIVO,
  etichettaStatoPreventivo,
  isStatoPreventivoTerminale,
  normalizzaStatoPreventivo,
} from "./preventivoWorkflowTypes";

/** Test helper */
export function resetWorkflowTimeline() {
  salvaTimeline([]);
}
