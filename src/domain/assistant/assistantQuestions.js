/**
 * Assistente Sopralluogo — registro domande.
 * Solo raccolta informazioni. Nessun pricing.
 */

import { creaDomandaAssistente, ASSISTANT_PRIORITA } from "./assistantTypes";

const { ALTA, MEDIA } = ASSISTANT_PRIORITA;

/** @type {ReadonlyArray<import("./assistantTypes").AssistantDomanda>} */
export const ASSISTANT_DOMANDE = Object.freeze([
  // —— Cucina ——
  creaDomandaAssistente({
    id: "ASK_CUCINA_INDUZIONE_LINEA",
    categoria: "CUCINA",
    domanda: "È prevista una linea dedicata per il piano a induzione?",
    condizioniAttivazione: { cucina: "induzione" },
    catalogoIds: ["LINEA_INDUZIONE"],
    schedaTecnicaId: "BT_CUCINA_INDUZIONE",
    priorita: ALTA,
  }),

  // —— Climatizzazione ——
  creaDomandaAssistente({
    id: "ASK_CLIMA_QUANTI",
    categoria: "CLIMATIZZAZIONE",
    domanda: "Quanti climatizzatori sono previsti?",
    condizioniAttivazione: { climatizzazione: true },
    catalogoIds: ["CLIMA"],
    schedaTecnicaId: "BT_CLIMA_PREDISPOSIZIONE",
    priorita: ALTA,
  }),
  creaDomandaAssistente({
    id: "ASK_CLIMA_PREDISPOSIZIONE",
    categoria: "CLIMATIZZAZIONE",
    domanda: "È già presente la predisposizione?",
    condizioniAttivazione: { climatizzazione: true },
    catalogoIds: ["CLIMA"],
    schedaTecnicaId: "BT_CLIMA_PREDISPOSIZIONE",
    priorita: MEDIA,
  }),

  // —— Villa / esterni ——
  creaDomandaAssistente({
    id: "ASK_VILLA_SPAZI_ESTERNI",
    categoria: "IMMOBILE",
    domanda: "Sono presenti spazi esterni?",
    condizioniAttivazione: { tipoImmobile: "villa" },
    catalogoIds: ["ILLUMINAZIONE_ESTERNA"],
    schedaTecnicaId: null,
    priorita: MEDIA,
  }),
  creaDomandaAssistente({
    id: "ASK_VILLA_ILLUMINAZIONE_ESTERNA",
    categoria: "IMMOBILE",
    domanda: "Sono previste illuminazioni esterne?",
    condizioniAttivazione: { tipoImmobile: "villa" },
    catalogoIds: ["ILLUMINAZIONE_ESTERNA"],
    schedaTecnicaId: null,
    priorita: MEDIA,
  }),
  creaDomandaAssistente({
    id: "ASK_VILLA_CANCELLO",
    categoria: "IMMOBILE",
    domanda: "È presente un cancello automatico?",
    condizioniAttivazione: { tipoImmobile: "villa" },
    catalogoIds: ["CANCELLO"],
    schedaTecnicaId: "BT_CANCELLO_AUTOMATICO",
    priorita: ALTA,
  }),

  // —— Ufficio / rete dati ——
  creaDomandaAssistente({
    id: "ASK_UFFICIO_POSTAZIONI_DATI",
    categoria: "RETE_DATI",
    domanda: "Quante postazioni dati sono previste?",
    condizioniAttivazione: { tipoImmobile: "ufficio" },
    catalogoIds: ["PUNTO_DATI"],
    schedaTecnicaId: "BT_RETE_DATI_LAN",
    priorita: ALTA,
  }),

  // —— Fotovoltaico ——
  creaDomandaAssistente({
    id: "ASK_FV_ACCUMULO",
    categoria: "FOTOVOLTAICO",
    domanda: "È prevista anche la predisposizione per accumulo?",
    condizioniAttivazione: { predisposizioneFotovoltaico: true },
    catalogoIds: ["FOTOVOLTAICO"],
    schedaTecnicaId: "BT_FOTOVOLTAICO",
    priorita: MEDIA,
  }),
]);

export const ASSISTANT_DOMANDE_BY_ID = Object.freeze(
  Object.fromEntries(ASSISTANT_DOMANDE.map((d) => [d.id, d]))
);
