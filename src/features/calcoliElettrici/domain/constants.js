/**
 * Costanti e sezioni standard — Calcoli elettrici (field tool).
 * Assunzioni documentate in docs/CALCOLI-ELETTRICI.md
 */

export const SQRT3 = Math.sqrt(3);

/** Resistività tipiche a ~20 °C (Ω·mm²/m) — calcolo indicativo. */
export const RESISTIVITA = Object.freeze({
  rame: 0.0175,
  alluminio: 0.028,
});

export const MATERIALI = Object.freeze(["rame", "alluminio"]);

export const SISTEMI = Object.freeze(["monofase", "trifase"]);

/** Sezioni commerciali mm² usate per stima. */
export const SEZIONI_STANDARD_MM2 = Object.freeze([
  1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120,
]);

export const AVVISO_CADUTA =
  "Calcolo indicativo della caduta di tensione. La verifica finale deve considerare condizioni di posa, portata, temperatura, lunghezza, protezioni e normativa applicabile.";

export const AVVISO_SEZIONE =
  "Sezione minima stimata per il criterio di caduta di tensione. Da verificare in base alle condizioni reali di posa e alla portata del cavo.";
