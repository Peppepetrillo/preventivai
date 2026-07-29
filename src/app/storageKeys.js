import { listinoBase } from "../data/listinoBase";

export const STORAGE_KEYS = {
  preventivi: "archivioPreventivi",
  cantieri: "cantieri",
  clienti: "clienti",
  datiAzienda: "datiAzienda",
  listino: "listinoLocale",
  pinAccesso: "pinAccesso",
  appLockConfig: "preventivai:app-lock-config",
  lavorazioniUsage: "preventivai:lavorazioni-usage",
  wizardExtensions: "preventivai:wizard-extensions",
  esperienze: "preventivai:esperienze",
  /** Catalogo Serie Civile — solo locale, fuori sync cloud (Sprint 11C) */
  serieCivili: "preventivai:serie-civili",
  /** PreventivAI Brain — locale only, fuori sync cloud */
  brainObservations: "preventivai.brain.observations",
  brainPersonalKnowledge: "preventivai.brain.personalKnowledge",
  brainPatterns: "preventivai.brain.patterns",
  /** Timeline workflow preventivo → cantiere (locale) */
  workflowTimeline: "preventivai.workflow.timeline",
  /** Varianti cantiere — locale, separate dal preventivo */
  varianti: "preventivai.varianti",
  variantiTimeline: "preventivai.varianti.timeline",
  /** Firme cliente — locale, separate dal preventivo */
  firme: "preventivai.firme",
  /** Storico condivisioni PDF — locale */
  condivisioni: "preventivai.condivisioni",
  /** Decision Memory sopralluogo — locale only */
  decisionMemory: "preventivai.decisionMemory",
  /** Sessioni sopralluogo — locale only */
  sopralluogoSessions: "preventivai.sopralluogo.sessions",
  sopralluogoSessionAttiva: "preventivai.sopralluogo.sessionAttiva",
  /** Insight di campo — locale only */
  insights: "preventivai.insights",
};

export const STORAGE_FALLBACKS = {
  [STORAGE_KEYS.preventivi]: [],
  [STORAGE_KEYS.cantieri]: [],
  [STORAGE_KEYS.clienti]: [],
  [STORAGE_KEYS.datiAzienda]: {},
  [STORAGE_KEYS.listino]: listinoBase,
  [STORAGE_KEYS.pinAccesso]: "",
  [STORAGE_KEYS.appLockConfig]: { timeoutMinuti: 5 },
  [STORAGE_KEYS.lavorazioniUsage]: {},
  [STORAGE_KEYS.wizardExtensions]: {},
  [STORAGE_KEYS.esperienze]: [],
  [STORAGE_KEYS.serieCivili]: null,
  [STORAGE_KEYS.brainObservations]: [],
  [STORAGE_KEYS.brainPersonalKnowledge]: [],
  [STORAGE_KEYS.brainPatterns]: [],
  [STORAGE_KEYS.workflowTimeline]: [],
  [STORAGE_KEYS.varianti]: [],
  [STORAGE_KEYS.variantiTimeline]: [],
  [STORAGE_KEYS.firme]: [],
  [STORAGE_KEYS.condivisioni]: [],
  [STORAGE_KEYS.decisionMemory]: [],
  [STORAGE_KEYS.sopralluogoSessions]: [],
  [STORAGE_KEYS.sopralluogoSessionAttiva]: null,
  [STORAGE_KEYS.insights]: [],
};

export const APP_DATA_KEYS = {
  [STORAGE_KEYS.preventivi]: STORAGE_FALLBACKS[STORAGE_KEYS.preventivi],
  [STORAGE_KEYS.cantieri]: STORAGE_FALLBACKS[STORAGE_KEYS.cantieri],
  [STORAGE_KEYS.clienti]: STORAGE_FALLBACKS[STORAGE_KEYS.clienti],
  [STORAGE_KEYS.datiAzienda]: STORAGE_FALLBACKS[STORAGE_KEYS.datiAzienda],
  [STORAGE_KEYS.listino]: STORAGE_FALLBACKS[STORAGE_KEYS.listino],
  // RC-2A: knowledge Experience Engine — sync + backup/restore con il resto del dataset
  [STORAGE_KEYS.esperienze]: STORAGE_FALLBACKS[STORAGE_KEYS.esperienze],
};

export const NATIVE_STORAGE_KEYS = {
  ...APP_DATA_KEYS,
  [STORAGE_KEYS.pinAccesso]: STORAGE_FALLBACKS[STORAGE_KEYS.pinAccesso],
};
