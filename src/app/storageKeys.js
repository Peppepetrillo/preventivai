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
