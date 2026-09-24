/**
 * Preferenza tema UI — puro, senza side-effect DOM.
 * Valori: chiaro | scuro | sistema
 */

export const TEMA = Object.freeze({
  chiaro: "chiaro",
  scuro: "scuro",
  sistema: "sistema",
});

export const TEMI_VALIDI = Object.freeze([
  TEMA.chiaro,
  TEMA.scuro,
  TEMA.sistema,
]);

export const ETICHETTE_TEMA = Object.freeze({
  [TEMA.chiaro]: "Chiaro",
  [TEMA.scuro]: "Scuro",
  [TEMA.sistema]: "Sistema",
});

/**
 * @param {unknown} valore
 * @returns {"chiaro"|"scuro"|"sistema"}
 */
export function normalizzaPreferenzaTema(valore) {
  const v = String(valore || "").trim().toLowerCase();
  if (TEMI_VALIDI.includes(v)) return v;
  return TEMA.sistema;
}

/**
 * @param {"chiaro"|"scuro"|"sistema"} preferenza
 * @param {{ matches?: boolean }|null|undefined} mediaScuro
 * @returns {"light"|"dark"}
 */
export function risolviTemaEffettivo(preferenza, mediaScuro) {
  const pref = normalizzaPreferenzaTema(preferenza);
  if (pref === TEMA.chiaro) return "light";
  if (pref === TEMA.scuro) return "dark";
  const scuro =
    mediaScuro && typeof mediaScuro.matches === "boolean"
      ? mediaScuro.matches
      : typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;
  return scuro ? "dark" : "light";
}

/**
 * @param {"light"|"dark"} temaEffettivo
 * @param {Document=} doc
 */
export function applicaTemaDom(temaEffettivo, doc = typeof document !== "undefined" ? document : null) {
  if (!doc?.documentElement) return;
  const tema = temaEffettivo === "dark" ? "dark" : "light";
  doc.documentElement.setAttribute("data-theme", tema);
  doc.documentElement.style.colorScheme = tema;
  const meta = doc.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", tema === "dark" ? "#07111f" : "#e8eef6");
  }
}
