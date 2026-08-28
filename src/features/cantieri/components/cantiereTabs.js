export const CANTIERE_TAB = {
  OPERATIVO: "operativo",
  GIORNATE: "giornate",
  ECONOMICO: "economico",
  DOCUMENTI: "documenti",
};

const MAPPA_SEZIONE_TAB = {
  "sezione-checklist": CANTIERE_TAB.OPERATIVO,
  "sezione-materiali": CANTIERE_TAB.OPERATIVO,
  "sezione-note": CANTIERE_TAB.OPERATIVO,
  "sezione-foto": CANTIERE_TAB.OPERATIVO,
  "sezione-programmazione": CANTIERE_TAB.GIORNATE,
  "sezione-registro-lavori": CANTIERE_TAB.GIORNATE,
  "sezione-diario": CANTIERE_TAB.DOCUMENTI,
  "sezione-varianti": CANTIERE_TAB.ECONOMICO,
  "sezione-pagamenti": CANTIERE_TAB.ECONOMICO,
  "sezione-documenti": CANTIERE_TAB.DOCUMENTI,
};

/** Hash senza tab dedicato — scroll diretto (es. stato in header). */
export const SEZIONI_SENZA_TAB = new Set(["sezione-modifica"]);

export function tabDaSezioneId(sezioneId) {
  const id = String(sezioneId || "").replace(/^#/, "");
  if (SEZIONI_SENZA_TAB.has(id)) return null;
  return MAPPA_SEZIONE_TAB[id] || null;
}
