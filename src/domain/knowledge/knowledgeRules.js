/**
 * Knowledge Rules — Knowledge Base + Rule Engine PreventivAI.
 *
 * I suggerimenti sono SEMPRE riferimenti al Catalogo Lavorazioni (id + quantita).
 * Nessuna descrizione libera. Nessuna AI / API / LLM.
 */

import { CATALOGO_IDS } from "./knowledgeCatalogRefs";
import { knowledgeRulesCaratteristiche } from "./knowledgeRulesCaratteristiche";

function risultatoVuoto() {
  return {
    applicata: false,
    suggerimenti: [],
    dati: {},
  };
}

function risultatoApplicato({ suggerimenti = [], dati = {} } = {}) {
  return {
    applicata: true,
    suggerimenti,
    dati,
  };
}

function ref(id, quantita = 1, meta = {}) {
  return { id, quantita, meta };
}

function leggiMq(input = {}) {
  const grezzo = input.mq ?? input.superficieMq;
  if (grezzo === null || grezzo === undefined || grezzo === "") return null;
  const mq = Number(grezzo);
  return Number.isFinite(mq) ? mq : null;
}

/**
 * RULE_001 — Stima punti impianto
 * Emette PUNTO_IMPIANTO con quantita = mq.
 */
export const RULE_001 = {
  id: "RULE_001",
  nome: "Stima punti impianto",
  descrizione:
    "Stima iniziale del numero di punti partendo dalla superficie.",
  categoria: "Punti impianto",
  tags: ["mq", "punti", "stima"],
  version: "2.0",
  fonte: "Esperienza sul campo",
  enabled: true,
  priority: 100,

  execute(input = {}) {
    const mq = leggiMq(input);
    if (mq === null) return risultatoVuoto();

    return risultatoApplicato({
      dati: { puntiStimati: mq },
      suggerimenti: [ref(CATALOGO_IDS.PUNTO_IMPIANTO, mq)],
    });
  },
};

/**
 * RULE_002 — Quadro elettrico standard (oltre 100 mq)
 */
export const RULE_002 = {
  id: "RULE_002",
  nome: "Quadro elettrico",
  descrizione: "Suggerisce quadro elettrico 24 moduli oltre 100 mq.",
  categoria: "Quadro elettrico",
  tags: ["quadro", "moduli", "mq"],
  version: "2.0",
  fonte: "Esperienza sul campo",
  enabled: true,
  priority: 200,

  execute(input = {}) {
    const mq = leggiMq(input);
    if (mq === null || mq <= 100) return risultatoVuoto();

    return risultatoApplicato({
      suggerimenti: [
        ref(CATALOGO_IDS.QUADRO_ELETTRICO, 1, { moduli: 24 }),
      ],
      dati: {
        quadroSuggerito: CATALOGO_IDS.QUADRO_ELETTRICO,
        quadroModuli: 24,
      },
    });
  },
};

/**
 * RULE_008 — Quadro 12 moduli per appartamenti fino a 100 mq (compresi).
 * Prezzo solo via Catalogo → Listino (mai nella regola).
 */
export const RULE_008 = {
  id: "RULE_008",
  nome: "Quadro 12 moduli appartamento",
  descrizione:
    "Suggerisce quadro 12 moduli per appartamenti fino a 100 mq inclusi.",
  categoria: "Quadro elettrico",
  tags: ["quadro", "moduli", "mq", "appartamento"],
  version: "1.0",
  fonte: "Esperienza sul campo",
  enabled: true,
  priority: 195,

  execute(input = {}) {
    if (input.tipoImmobile !== "appartamento") return risultatoVuoto();
    const mq = leggiMq(input);
    if (mq === null || mq > 100) return risultatoVuoto();

    return risultatoApplicato({
      suggerimenti: [
        ref(CATALOGO_IDS.QUADRO_12_MODULI, 1, { moduli: 12 }),
      ],
      dati: {
        quadroSuggerito: CATALOGO_IDS.QUADRO_12_MODULI,
        quadroModuli: 12,
      },
    });
  },
};

/**
 * RULE_003 — Quadro elettrico grande (oltre 150 mq)
 */
export const RULE_003 = {
  id: "RULE_003",
  nome: "Quadro grande",
  descrizione: "Suggerisce quadro elettrico 36 moduli oltre 150 mq.",
  categoria: "Quadro elettrico",
  tags: ["quadro", "moduli", "mq", "grande"],
  version: "2.0",
  fonte: "Esperienza sul campo",
  enabled: true,
  priority: 300,

  execute(input = {}) {
    const mq = leggiMq(input);
    if (mq === null || mq <= 150) return risultatoVuoto();

    return risultatoApplicato({
      suggerimenti: [
        ref(CATALOGO_IDS.QUADRO_ELETTRICO, 1, { moduli: 36 }),
      ],
      dati: {
        quadroSuggerito: CATALOGO_IDS.QUADRO_ELETTRICO,
        quadroModuli: 36,
      },
    });
  },
};

/**
 * RULE_004 — Climatizzazione (legacy)
 * Sostituita da RULE_020 (KE 2.0). Disattivata per evitare duplicati.
 */
export const RULE_004 = {
  id: "RULE_004",
  nome: "Climatizzazione",
  descrizione:
    "Legacy — sostituita da RULE_020. Aggiunge predisposizione clima.",
  categoria: "Climatizzazione",
  tags: ["clima", "predisposizione", "extra", "legacy"],
  version: "2.0",
  fonte: "Esperienza sul campo",
  enabled: false,
  priority: 150,

  execute(input = {}) {
    if (!input.extra?.clima && !input.climatizzazione) return risultatoVuoto();

    return risultatoApplicato({
      suggerimenti: [ref(CATALOGO_IDS.CLIMA, 1)],
    });
  },
};

/**
 * RULE_005 — Domotica (legacy)
 * Sostituita da RULE_031 (KE 2.0). Disattivata per evitare duplicati.
 */
export const RULE_005 = {
  id: "RULE_005",
  nome: "Domotica",
  descrizione:
    "Legacy — sostituita da RULE_031. Componenti base impianto domotico.",
  categoria: "Domotica",
  tags: ["domotica", "gateway", "bus", "extra", "legacy"],
  version: "2.0",
  fonte: "Esperienza sul campo",
  enabled: false,
  priority: 150,

  execute(input = {}) {
    if (!input.extra?.domotica && !input.domotica) return risultatoVuoto();

    return risultatoApplicato({
      suggerimenti: [
        ref(CATALOGO_IDS.GATEWAY, 1),
        ref(CATALOGO_IDS.BUS, 1),
        ref(CATALOGO_IDS.ALIMENTATORE, 1),
      ],
    });
  },
};

/**
 * RULE_006 — Distribuzione su più livelli
 */
export const RULE_006 = {
  id: "RULE_006",
  nome: "Due livelli",
  descrizione: "Suggerisce distribuzione linee per piano su più livelli.",
  categoria: "Distribuzione",
  tags: ["livelli", "piani", "distribuzione"],
  version: "2.0",
  fonte: "Esperienza sul campo",
  enabled: true,
  priority: 140,

  execute(input = {}) {
    const livelli = Number(input.livelli);
    if (!Number.isFinite(livelli) || livelli <= 1) return risultatoVuoto();

    return risultatoApplicato({
      suggerimenti: [ref(CATALOGO_IDS.DISTRIBUZIONE_LINEE_PIANO, 1)],
    });
  },
};

/**
 * RULE_007 — Immobile villa
 */
export const RULE_007 = {
  id: "RULE_007",
  nome: "Villa",
  descrizione: "Suggerimenti tipici per impianto in villa.",
  categoria: "Immobile",
  tags: ["villa", "esterno", "citofono", "cancello"],
  version: "2.0",
  fonte: "Esperienza sul campo",
  enabled: true,
  priority: 130,

  execute(input = {}) {
    if (input.tipoImmobile !== "villa") return risultatoVuoto();

    return risultatoApplicato({
      suggerimenti: [
        ref(CATALOGO_IDS.CANCELLO, 1),
        ref(CATALOGO_IDS.ILLUMINAZIONE_ESTERNA, 1),
        ref(CATALOGO_IDS.CITOFONO, 1),
      ],
    });
  },
};

/** Registro Knowledge Base — estendibile a centinaia di regole. */
export const knowledgeRules = [
  RULE_001,
  RULE_002,
  RULE_003,
  RULE_004,
  RULE_005,
  RULE_006,
  RULE_007,
  RULE_008,
  ...knowledgeRulesCaratteristiche,
];
