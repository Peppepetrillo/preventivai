/**
 * UX-13 — Tipologie impianto/lavoro (config centralizzata).
 * Separata da tipoLavoro wizard (impianto | intervento | express).
 */

export const TIPOLOGIA_IMPIANTO = Object.freeze({
  elettrico: "elettrico",
  allarme: "allarme",
  videosorveglianza: "videosorveglianza",
  reteDati: "rete-dati",
  tvSat: "tv-sat",
  domotica: "domotica",
  fotovoltaico: "fotovoltaico",
  illuminazione: "illuminazione",
  altro: "altro",
});

export const TIPOLOGIA_IMPIANTO_DEFAULT = TIPOLOGIA_IMPIANTO.elettrico;

/** @type {ReadonlyArray<{ id: string, label: string, emoji: string, categoriaCatalogo?: string }>} */
export const TIPOLOGIA_IMPIANTO_OPZIONI = Object.freeze([
  {
    id: TIPOLOGIA_IMPIANTO.elettrico,
    label: "Elettrico",
    emoji: "⚡",
    categoriaCatalogo: "elettrico",
  },
  {
    id: TIPOLOGIA_IMPIANTO.allarme,
    label: "Allarme",
    emoji: "🔔",
    categoriaCatalogo: "allarme",
  },
  {
    id: TIPOLOGIA_IMPIANTO.videosorveglianza,
    label: "Videosorveglianza",
    emoji: "📹",
    categoriaCatalogo: "videosorveglianza",
  },
  {
    id: TIPOLOGIA_IMPIANTO.reteDati,
    label: "Rete dati",
    emoji: "🌐",
    categoriaCatalogo: "rete-dati",
  },
  {
    id: TIPOLOGIA_IMPIANTO.tvSat,
    label: "TV / SAT",
    emoji: "📺",
    categoriaCatalogo: "tv-sat",
  },
  {
    id: TIPOLOGIA_IMPIANTO.domotica,
    label: "Domotica",
    emoji: "🏠",
    categoriaCatalogo: "domotica",
  },
  {
    id: TIPOLOGIA_IMPIANTO.fotovoltaico,
    label: "Fotovoltaico",
    emoji: "☀️",
    categoriaCatalogo: "fotovoltaico",
  },
  {
    id: TIPOLOGIA_IMPIANTO.illuminazione,
    label: "Illuminazione",
    emoji: "💡",
    categoriaCatalogo: "illuminazione",
  },
  {
    id: TIPOLOGIA_IMPIANTO.altro,
    label: "Altro",
    emoji: "",
    categoriaCatalogo: undefined,
  },
]);

/**
 * @param {string=} id
 */
export function opzioneTipologiaImpianto(id) {
  return (
    TIPOLOGIA_IMPIANTO_OPZIONI.find((item) => item.id === id) ||
    TIPOLOGIA_IMPIANTO_OPZIONI.find(
      (item) => item.id === TIPOLOGIA_IMPIANTO_DEFAULT
    )
  );
}

/**
 * Categoria catalogo materiali suggerita per la tipologia (filtro soft UX).
 * @param {string=} tipologiaImpianto
 * @returns {string|undefined}
 */
export function categoriaCatalogoDaTipologia(tipologiaImpianto) {
  return opzioneTipologiaImpianto(tipologiaImpianto)?.categoriaCatalogo;
}
