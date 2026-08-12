/**
 * PreventivAI 2.0 — Configurazione wizard Nuovo Preventivo
 *
 * Decisioni approvate:
 * - BottomNav resta visibile (modalità semplificata via WizardContext)
 * - tipoLavoro salvato come metadato sul preventivo (non influenza i calcoli)
 * - Flusso UX-5.2: Cliente → Componi → Riepilogo (tipo lavoro in Componi)
 * - Express accessibile dal bottone in Componi
 * - Sezione "Più usati" basata su frequenza locale (lavorazioniUsage)
 * - Architettura aperta per "Ripeti ultimo preventivo/cliente" (wizardExtensions)
 */

export const TIPO_LAVORO = {
  impianto: "impianto",
  intervento: "intervento",
  express: "express",
};

export const TIPO_LAVORO_DEFAULT = TIPO_LAVORO.impianto;

export const WIZARD_STEPS = [
  {
    id: "cliente",
    title: "Cliente",
    shortTitle: "Cliente",
  },
  {
    id: "componi",
    title: "Componi",
    shortTitle: "Componi",
  },
  {
    id: "conferma",
    title: "Riepilogo",
    shortTitle: "Riepilogo",
  },
];

export const TIPO_LAVORO_OPZIONI = [
  {
    id: TIPO_LAVORO.impianto,
    titolo: "Impianto completo",
    descrizione: "Ristrutturazione, nuovo impianto, kit stanza",
    icona: "home",
    evidenziaKit: true,
    categorieAperte: ["Impianto", "Quadro", "Illuminazione"],
  },
  {
    id: TIPO_LAVORO.intervento,
    titolo: "Intervento",
    descrizione: "Guasto, sostituzione, piccola riparazione",
    icona: "wrench",
    evidenziaKit: false,
    categorieAperte: ["Assistenza", "Bassa tensione", "Impianto"],
  },
  {
    id: TIPO_LAVORO.express,
    titolo: "Preventivo Express",
    descrizione: "Detta o scrivi: l'AI compone il preventivo per te",
    icona: "sparkles",
    evidenziaKit: false,
    categorieAperte: [],
    percorsoExpress: true,
  },
];

/** Opzioni segmento in Componi (Express ha bottone dedicato). */
export const TIPO_LAVORO_OPZIONI_SEGMENTO = TIPO_LAVORO_OPZIONI.filter(
  (opzione) => !opzione.percorsoExpress
);

export const CONDIZIONI_DEFAULT = {
  sconto: 0,
  iva: 22,
  validita: 30,
  pagamento: "Bonifico bancario",
  acconto: 0,
  note: "",
};

export const PIU_USATI_LIMIT = 6;

/** Slot per estensioni future senza refactor dello state */
export const WIZARD_EXTENSION_SLOTS = {
  ultimoCliente: "ultimoCliente",
  ultimoPreventivo: "ultimoPreventivo",
  prefill: "prefill",
};

export function indiceStep(stepId) {
  return WIZARD_STEPS.findIndex((step) => step.id === stepId);
}

export function stepDaIndice(indice) {
  return WIZARD_STEPS[indice] || WIZARD_STEPS[0];
}

export function opzioneTipoLavoro(tipoLavoro) {
  return TIPO_LAVORO_OPZIONI.find((opzione) => opzione.id === tipoLavoro) || null;
}
