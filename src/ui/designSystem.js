/**
 * Badge stato cantiere — Design System v1.0 (semantica fissa).
 * @param {string=} stato
 * @returns {string}
 */
export function classeBadgeStatoCantiere(stato) {
  if (stato === "In corso") return "ds-badge ds-badge-in-corso";
  if (stato === "Completato") return "ds-badge ds-badge-completato";
  if (stato === "Sospeso") return "ds-badge ds-badge-sospeso";
  if (stato === "Da iniziare") return "ds-badge ds-badge-da-iniziare";
  return "ds-badge ds-badge-da-iniziare";
}
