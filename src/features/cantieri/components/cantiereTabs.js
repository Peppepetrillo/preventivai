export const CANTIERE_TAB = {
  OPERATIVO: "operativo",
  ECONOMICO: "economico",
  DOCUMENTI: "documenti",
  IMPOSTAZIONI: "impostazioni",
};

const MAPPA_SEZIONE_TAB = {
  "sezione-checklist": CANTIERE_TAB.OPERATIVO,
  "sezione-materiali": CANTIERE_TAB.OPERATIVO,
  "sezione-note": CANTIERE_TAB.OPERATIVO,
  "sezione-foto": CANTIERE_TAB.OPERATIVO,
  "sezione-diario": CANTIERE_TAB.DOCUMENTI,
  "sezione-varianti": CANTIERE_TAB.ECONOMICO,
  "sezione-pagamenti": CANTIERE_TAB.ECONOMICO,
  "sezione-documenti": CANTIERE_TAB.DOCUMENTI,
  "sezione-modifica": CANTIERE_TAB.IMPOSTAZIONI,
};

export function tabDaSezioneId(sezioneId) {
  const id = String(sezioneId || "").replace(/^#/, "");
  return MAPPA_SEZIONE_TAB[id] || null;
}
