/**
 * Knowledge Engine 2.0 — regole per caratteristiche impianto.
 *
 * Ogni regola:
 * - è indipendente e disattivabile (`enabled`)
 * - restituisce SOLO { id: catalogoId, quantita } (+ meta opzionale)
 * - non contiene prezzi
 *
 * Catalogo / Listino non sono toccati qui.
 */

import { CATALOGO_IDS } from "./knowledgeCatalogRefs";
import { CUCINA_TIPI } from "./knowledgeInputTypes";

function risultatoVuoto() {
  return { applicata: false, suggerimenti: [], dati: {} };
}

function risultatoApplicato({ suggerimenti = [], dati = {} } = {}) {
  return { applicata: true, suggerimenti, dati };
}

function ref(id, quantita = 1, meta = {}) {
  return { id, quantita, meta };
}

/**
 * Factory: regola booleana → una voce Catalogo.
 * Esportata per test / estensioni.
 */
export function creaRegolaFlag({
  id,
  nome,
  descrizione,
  categoria,
  tags = [],
  priority = 160,
  campo,
  catalogoId,
  quantita = 1,
  version = "2.0",
  fonte = "Knowledge Engine 2.0 — caratteristiche impianto",
}) {
  return {
    id,
    nome,
    descrizione,
    categoria,
    tags,
    version,
    fonte,
    enabled: true,
    priority,
    /** @param {import("./knowledgeInputTypes").KnowledgeInput} input */
    execute(input = {}) {
      if (!input?.[campo]) return risultatoVuoto();
      return risultatoApplicato({
        suggerimenti: [ref(catalogoId, quantita)],
      });
    },
  };
}

/**
 * RULE_020 — Climatizzazione richiesta
 * SE climatizzazione = sì → CLIMA
 */
export const RULE_020 = creaRegolaFlag({
  id: "RULE_020",
  nome: "Climatizzazione",
  descrizione: "Aggiunge predisposizione clima se richiesta dall'impianto.",
  categoria: "Climatizzazione",
  tags: ["clima", "caratteristica", "ke2"],
  priority: 160,
  campo: "climatizzazione",
  catalogoId: CATALOGO_IDS.CLIMA,
});

/**
 * RULE_021 — Cucina a induzione
 * SE cucina = induzione → LINEA_INDUZIONE
 */
export const RULE_021 = {
  id: "RULE_021",
  nome: "Linea cucina induzione",
  descrizione:
    "Aggiunge linea dedicata quando la cucina è a induzione.",
  categoria: "Cucina",
  tags: ["cucina", "induzione", "linea", "ke2"],
  version: "2.0",
  fonte: "Knowledge Engine 2.0 — caratteristiche impianto",
  enabled: true,
  priority: 165,
  execute(input = {}) {
    if (input.cucina !== CUCINA_TIPI.INDUZIONE) return risultatoVuoto();
    return risultatoApplicato({
      suggerimenti: [ref(CATALOGO_IDS.LINEA_INDUZIONE, 1)],
    });
  },
};

/**
 * RULE_022 — Rete dati / LAN
 * SE reteDati = sì → PUNTO_DATI
 */
export const RULE_022 = creaRegolaFlag({
  id: "RULE_022",
  nome: "Rete dati",
  descrizione: "Aggiunge punto dati / Ethernet se richiesta la rete LAN.",
  categoria: "Rete dati",
  tags: ["rete", "lan", "dati", "ke2"],
  priority: 162,
  campo: "reteDati",
  catalogoId: CATALOGO_IDS.PUNTO_DATI,
});

/**
 * RULE_023 — Impianto TV
 * SE impiantoTv = sì → PUNTO_TV
 */
export const RULE_023 = creaRegolaFlag({
  id: "RULE_023",
  nome: "Impianto TV",
  descrizione: "Aggiunge punto TV se richiesto impianto televisivo.",
  categoria: "Rete dati",
  tags: ["tv", "antenna", "ke2"],
  priority: 161,
  campo: "impiantoTv",
  catalogoId: CATALOGO_IDS.PUNTO_TV,
});

/**
 * RULE_024 — Citofono
 * SE citofono = sì → CITOFONO
 */
export const RULE_024 = creaRegolaFlag({
  id: "RULE_024",
  nome: "Citofono",
  descrizione: "Aggiunge predisposizione citofono se richiesta.",
  categoria: "Citofonia",
  tags: ["citofono", "ke2"],
  priority: 158,
  campo: "citofono",
  catalogoId: CATALOGO_IDS.CITOFONO,
});

/**
 * RULE_025 — Videocitofono
 * SE videocitofono = sì → VIDEOCITOFONO
 */
export const RULE_025 = creaRegolaFlag({
  id: "RULE_025",
  nome: "Videocitofono",
  descrizione: "Aggiunge predisposizione videocitofono se richiesta.",
  categoria: "Citofonia",
  tags: ["videocitofono", "ke2"],
  priority: 159,
  campo: "videocitofono",
  catalogoId: CATALOGO_IDS.VIDEOCITOFONO,
});

/**
 * RULE_026 — Allarme
 * SE allarme = sì → ALLARME
 */
export const RULE_026 = creaRegolaFlag({
  id: "RULE_026",
  nome: "Impianto allarme",
  descrizione: "Aggiunge predisposizione allarme se richiesta.",
  categoria: "Sicurezza",
  tags: ["allarme", "sicurezza", "ke2"],
  priority: 170,
  campo: "allarme",
  catalogoId: CATALOGO_IDS.ALLARME,
});

/**
 * RULE_027 — Videosorveglianza
 * SE videosorveglianza = sì → VIDEOSORVEGLIANZA
 */
export const RULE_027 = creaRegolaFlag({
  id: "RULE_027",
  nome: "Videosorveglianza",
  descrizione: "Aggiunge videosorveglianza se richiesta.",
  categoria: "Sicurezza",
  tags: ["videosorveglianza", "cctv", "ke2"],
  priority: 171,
  campo: "videosorveglianza",
  catalogoId: CATALOGO_IDS.VIDEOSORVEGLIANZA,
});

/**
 * RULE_028 — Cancello automatico
 * SE cancelloAutomatico = sì → CANCELLO
 */
export const RULE_028 = creaRegolaFlag({
  id: "RULE_028",
  nome: "Cancello automatico",
  descrizione: "Aggiunge predisposizione cancello / automazione se richiesta.",
  categoria: "Immobile",
  tags: ["cancello", "automazione", "ke2"],
  priority: 155,
  campo: "cancelloAutomatico",
  catalogoId: CATALOGO_IDS.CANCELLO,
});

/**
 * RULE_029 — Predisposizione fotovoltaico
 * SE predisposizioneFotovoltaico = sì → FOTOVOLTAICO
 */
export const RULE_029 = creaRegolaFlag({
  id: "RULE_029",
  nome: "Predisposizione fotovoltaico",
  descrizione: "Aggiunge predisposizione fotovoltaico se richiesta.",
  categoria: "Fotovoltaico",
  tags: ["fotovoltaico", "ke2"],
  priority: 154,
  campo: "predisposizioneFotovoltaico",
  catalogoId: CATALOGO_IDS.FOTOVOLTAICO,
});

/**
 * RULE_030 — Predisposizione colonnina ricarica
 * SE predisposizioneColonnina = sì → RICARICA_AUTO
 */
export const RULE_030 = creaRegolaFlag({
  id: "RULE_030",
  nome: "Colonnina ricarica",
  descrizione:
    "Aggiunge predisposizione ricarica auto / colonnina se richiesta.",
  categoria: "Ricarica Auto",
  tags: ["ricarica", "colonnina", "ke2"],
  priority: 153,
  campo: "predisposizioneColonnina",
  catalogoId: CATALOGO_IDS.RICARICA_AUTO,
});

/**
 * RULE_031 — Domotica (caratteristica)
 * SE domotica = sì → GATEWAY + BUS + ALIMENTATORE
 */
export const RULE_031 = {
  id: "RULE_031",
  nome: "Domotica base",
  descrizione:
    "Aggiunge componenti base domotica (gateway, bus, alimentatore).",
  categoria: "Domotica",
  tags: ["domotica", "gateway", "ke2"],
  version: "2.0",
  fonte: "Knowledge Engine 2.0 — caratteristiche impianto",
  enabled: true,
  priority: 168,
  execute(input = {}) {
    if (!input.domotica) return risultatoVuoto();
    return risultatoApplicato({
      suggerimenti: [
        ref(CATALOGO_IDS.GATEWAY, 1),
        ref(CATALOGO_IDS.BUS, 1),
        ref(CATALOGO_IDS.ALIMENTATORE, 1),
      ],
    });
  },
};

/** Registro regole caratteristiche KE 2.0. */
export const knowledgeRulesCaratteristiche = [
  RULE_020,
  RULE_021,
  RULE_022,
  RULE_023,
  RULE_024,
  RULE_025,
  RULE_026,
  RULE_027,
  RULE_028,
  RULE_029,
  RULE_030,
  RULE_031,
];
