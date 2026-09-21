/**
 * Caduta di tensione indicativa (pure).
 *
 * Assunzioni (documentate in docs/CALCOLI-ELETTRICI.md):
 * - Resistività tipica a ~20 °C (Ω·mm²/m)
 * - Solo resistenza del conduttore (reattanza trascurata)
 * - Monofase: ΔU = 2 · ρ · L · I / S
 * - Trifase:  ΔU = √3 · ρ · L · I / S
 * - ΔU% = (ΔU / Un) · 100
 *
 * NON è una verifica normativa né di conformità.
 */

import {
  AVVISO_CADUTA,
  MATERIALI,
  RESISTIVITA,
  SISTEMI,
  SQRT3,
} from "./constants";

/**
 * @param {{
 *   tensioneNominaleV: number,
 *   correnteA: number,
 *   lunghezzaM: number,
 *   sezioneMm2: number,
 *   materiale: 'rame'|'alluminio',
 *   sistema: 'monofase'|'trifase',
 * }} input
 */
export function calcolaCadutaTensione({
  tensioneNominaleV,
  correnteA,
  lunghezzaM,
  sezioneMm2,
  materiale,
  sistema,
}) {
  if (
    !Number.isFinite(tensioneNominaleV) ||
    !Number.isFinite(correnteA) ||
    !Number.isFinite(lunghezzaM) ||
    !Number.isFinite(sezioneMm2)
  ) {
    return { ok: false, errore: "Inserisci un valore valido." };
  }
  if (tensioneNominaleV <= 0) {
    return { ok: false, errore: "La tensione deve essere maggiore di zero." };
  }
  if (correnteA < 0 || lunghezzaM <= 0 || sezioneMm2 <= 0) {
    return { ok: false, errore: "Controlla i valori inseriti." };
  }
  if (!MATERIALI.includes(materiale)) {
    return { ok: false, errore: "Controlla i valori inseriti." };
  }
  if (!SISTEMI.includes(sistema)) {
    return { ok: false, errore: "Controlla i valori inseriti." };
  }

  const rho = RESISTIVITA[materiale];
  const fattore = sistema === "monofase" ? 2 : SQRT3;
  const cadutaV = (fattore * rho * lunghezzaM * correnteA) / sezioneMm2;
  const cadutaPercentuale = (cadutaV / tensioneNominaleV) * 100;

  if (!Number.isFinite(cadutaV) || !Number.isFinite(cadutaPercentuale)) {
    return { ok: false, errore: "Controlla i valori inseriti." };
  }

  return {
    ok: true,
    cadutaV,
    cadutaPercentuale,
    formula:
      sistema === "monofase"
        ? "ΔU = 2 × ρ × L × I / S"
        : "ΔU = √3 × ρ × L × I / S",
    parametri: {
      resistivitaOhmMm2PerM: rho,
      materiale,
      sistema,
      tensioneNominaleV,
      correnteA,
      lunghezzaM,
      sezioneMm2,
    },
    avviso: AVVISO_CADUTA,
  };
}
