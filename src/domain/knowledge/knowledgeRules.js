/**
 * Knowledge Rules — Knowledge Base + Rule Engine PreventivAI.
 *
 * Ogni regola è un oggetto documentato, abilitabile e prioritizzabile.
 * Il motore (knowledgeEngine) ne esegue solo la funzione `execute`.
 * Nessuna AI / API / LLM.
 */

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

function leggiMq(input = {}) {
  const grezzo = input.mq ?? input.superficieMq;
  if (grezzo === null || grezzo === undefined || grezzo === "") return null;
  const mq = Number(grezzo);
  return Number.isFinite(mq) ? mq : null;
}

/**
 * RULE_001 — Stima punti impianto
 *
 * Scopo: dare una prima stima operativa dei punti partendo dalla superficie.
 * Formula v1: 1 punto = 1 mq (raffinabile in regole successive).
 */
export const RULE_001 = {
  id: "RULE_001",
  nome: "Stima punti impianto",
  descrizione:
    "Stima iniziale del numero di punti partendo dalla superficie.",
  categoria: "Punti impianto",
  tags: ["mq", "punti", "stima"],
  version: "1.0",
  fonte: "Esperienza sul campo",
  enabled: true,
  priority: 100,

  execute(input = {}) {
    const mq = leggiMq(input);
    if (mq === null) return risultatoVuoto();

    return risultatoApplicato({
      dati: { puntiStimati: mq },
    });
  },
};

/**
 * RULE_002 — Quadro elettrico standard
 *
 * Scopo: suggerire un quadro 24 moduli quando la superficie supera i 100 mq.
 * Su mq > 150 cede il campo quadro a RULE_003 (priorità più alta / first-wins).
 */
export const RULE_002 = {
  id: "RULE_002",
  nome: "Quadro elettrico",
  descrizione: "Suggerisce quadro 24 moduli oltre 100 mq.",
  categoria: "Quadro elettrico",
  tags: ["quadro", "moduli", "mq"],
  version: "1.0",
  fonte: "Esperienza sul campo",
  enabled: true,
  priority: 200,

  execute(input = {}) {
    const mq = leggiMq(input);
    if (mq === null || mq <= 100) return risultatoVuoto();

    return risultatoApplicato({
      suggerimenti: ["Quadro 24 moduli"],
      dati: { quadroSuggerito: "Quadro 24 moduli" },
    });
  },
};

/**
 * RULE_003 — Quadro elettrico grande
 *
 * Scopo: suggerire un quadro 36 moduli su superfici oltre 150 mq.
 * Priorità superiore a RULE_002 per vincere su `quadroSuggerito`.
 */
export const RULE_003 = {
  id: "RULE_003",
  nome: "Quadro grande",
  descrizione: "Suggerisce quadro 36 moduli oltre 150 mq.",
  categoria: "Quadro elettrico",
  tags: ["quadro", "moduli", "mq", "grande"],
  version: "1.0",
  fonte: "Esperienza sul campo",
  enabled: true,
  priority: 300,

  execute(input = {}) {
    const mq = leggiMq(input);
    if (mq === null || mq <= 150) return risultatoVuoto();

    return risultatoApplicato({
      suggerimenti: ["Quadro 36 moduli"],
      dati: { quadroSuggerito: "Quadro 36 moduli" },
    });
  },
};

/**
 * RULE_004 — Climatizzazione
 *
 * Scopo: se il cliente richiede predisposizione clima, ricordare la voce
 * di predisposizione nel preventivo (tubazioni / linee dedicate).
 */
export const RULE_004 = {
  id: "RULE_004",
  nome: "Climatizzazione",
  descrizione: "Aggiunge predisposizione climatizzazione se richiesta.",
  categoria: "Climatizzazione",
  tags: ["clima", "predisposizione", "extra"],
  version: "1.0",
  fonte: "Esperienza sul campo",
  enabled: true,
  priority: 150,

  execute(input = {}) {
    if (!input.extra?.clima) return risultatoVuoto();

    return risultatoApplicato({
      suggerimenti: ["Predisposizione climatizzazione"],
    });
  },
};

/**
 * RULE_005 — Domotica
 *
 * Scopo: quando è richiesta la domotica, elencare i componenti base
 * (gateway, bus, alimentatore) tipici di un impianto bus.
 */
export const RULE_005 = {
  id: "RULE_005",
  nome: "Domotica",
  descrizione: "Aggiunge componenti base di un impianto domotico.",
  categoria: "Domotica",
  tags: ["domotica", "gateway", "bus", "extra"],
  version: "1.0",
  fonte: "Esperienza sul campo",
  enabled: true,
  priority: 150,

  execute(input = {}) {
    if (!input.extra?.domotica) return risultatoVuoto();

    return risultatoApplicato({
      suggerimenti: ["Gateway", "Bus", "Alimentatore"],
    });
  },
};

/**
 * RULE_006 — Distribuzione su più livelli
 *
 * Scopo: con più di un piano, suggerire la distribuzione linee per piano
 * (montanti / sottocentri) per evitare impianti monolinea inadeguati.
 */
export const RULE_006 = {
  id: "RULE_006",
  nome: "Due livelli",
  descrizione: "Suggerisce distribuzione linee per piano su più livelli.",
  categoria: "Distribuzione",
  tags: ["livelli", "piani", "distribuzione"],
  version: "1.0",
  fonte: "Esperienza sul campo",
  enabled: true,
  priority: 140,

  execute(input = {}) {
    const livelli = Number(input.livelli);
    if (!Number.isFinite(livelli) || livelli <= 1) return risultatoVuoto();

    return risultatoApplicato({
      suggerimenti: ["Distribuzione linee per piano"],
    });
  },
};

/**
 * RULE_007 — Immobile villa
 *
 * Scopo: in villa aggiungere le voci tipiche esterne / accesso
 * (cancello, illuminazione esterna, citofono/videocitofono).
 */
export const RULE_007 = {
  id: "RULE_007",
  nome: "Villa",
  descrizione: "Suggerimenti tipici per impianto in villa.",
  categoria: "Immobile",
  tags: ["villa", "esterno", "citofono", "cancello"],
  version: "1.0",
  fonte: "Esperienza sul campo",
  enabled: true,
  priority: 130,

  execute(input = {}) {
    if (input.tipoImmobile !== "villa") return risultatoVuoto();

    return risultatoApplicato({
      suggerimenti: [
        "Predisposizione cancello",
        "Illuminazione esterna",
        "Citofono/Videocitofono",
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
];
