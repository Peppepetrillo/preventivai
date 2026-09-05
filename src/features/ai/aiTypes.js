/**
 * PreventivAI Intelligence v1 — tipi e costanti.
 * Confidence basata su quantità/qualità dati, non su score pseudo-scientifici.
 */

/** Categorie lavoro (classificazione deterministica). */
export const CATEGORIE_LAVORO_AI = Object.freeze({
  impianto_elettrico: "impianto_elettrico",
  ristrutturazione: "ristrutturazione",
  manutenzione: "manutenzione",
  quadro_elettrico: "quadro_elettrico",
  illuminazione: "illuminazione",
  fotovoltaico: "fotovoltaico",
  automazione: "automazione",
  altro: "altro",
});

export const ETICHETTE_CATEGORIA_LAVORO = Object.freeze({
  [CATEGORIE_LAVORO_AI.impianto_elettrico]: "Impianto elettrico",
  [CATEGORIE_LAVORO_AI.ristrutturazione]: "Ristrutturazione",
  [CATEGORIE_LAVORO_AI.manutenzione]: "Manutenzione",
  [CATEGORIE_LAVORO_AI.quadro_elettrico]: "Quadro elettrico",
  [CATEGORIE_LAVORO_AI.illuminazione]: "Illuminazione",
  [CATEGORIE_LAVORO_AI.fotovoltaico]: "Fotovoltaico",
  [CATEGORIE_LAVORO_AI.automazione]: "Automazione",
  [CATEGORIE_LAVORO_AI.altro]: "Altro",
});

/** Livelli confidence (testo UI, non percentuale). */
export const LIVELLI_CONFIDENZA_AI = Object.freeze({
  insufficiente: "insufficiente",
  bassa: "bassa",
  media: "media",
  buona: "buona",
});

export const ETICHETTE_CONFIDENZA_AI = Object.freeze({
  [LIVELLI_CONFIDENZA_AI.insufficiente]: "Dati insufficienti",
  [LIVELLI_CONFIDENZA_AI.bassa]: "Pochi dati",
  [LIVELLI_CONFIDENZA_AI.media]: "Dati medi",
  [LIVELLI_CONFIDENZA_AI.buona]: "Buona base dati",
});

/** Soglie simili / stats. */
export const AI_SOGLIE = Object.freeze({
  /** Score minimo per considerare un lavoro “potenzialmente simile”. */
  scoreMinimoSimile: 25,
  /** Max lavori simili restituiti. */
  maxLavoriSimili: 8,
  /** Minimo lavori con dati utili per stima affidabile. */
  minLavoriPerStima: 2,
  /** Minimo per confidence “buona”. */
  minLavoriBuona: 4,
});
