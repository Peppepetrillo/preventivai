/**
 * Stima sezione cavo per criterio di caduta di tensione (pure).
 *
 * NON è dimensionamento normativo. Solo stima matematica:
 * - Monofase: S = 2 · ρ · L · I / ΔU_max
 * - Trifase:  S = √3 · ρ · L · I / ΔU_max
 * - ΔU_max = Un · (cadutaMax% / 100)
 * - Arrotondamento alla sezione commerciale successiva in SEZIONI_STANDARD_MM2
 */

import {
  AVVISO_SEZIONE,
  MATERIALI,
  RESISTIVITA,
  SEZIONI_STANDARD_MM2,
  SISTEMI,
  SQRT3,
} from "./constants";

/**
 * @param {number} sezioneCalcolataMm2
 * @returns {number|null} prima sezione standard >= calcolata, o null se oltre catalogo
 */
export function sezioneStandardMinima(sezioneCalcolataMm2) {
  if (!Number.isFinite(sezioneCalcolataMm2) || sezioneCalcolataMm2 <= 0) {
    return null;
  }
  for (const s of SEZIONI_STANDARD_MM2) {
    if (s >= sezioneCalcolataMm2 - Number.EPSILON) {
      return s;
    }
  }
  return null;
}

/**
 * @param {{
 *   correnteA: number,
 *   lunghezzaM: number,
 *   tensioneV: number,
 *   sistema: 'monofase'|'trifase',
 *   materiale: 'rame'|'alluminio',
 *   cadutaMaxPercentuale: number,
 * }} input
 */
export function stimaSezioneCavo({
  correnteA,
  lunghezzaM,
  tensioneV,
  sistema,
  materiale,
  cadutaMaxPercentuale,
}) {
  if (
    !Number.isFinite(correnteA) ||
    !Number.isFinite(lunghezzaM) ||
    !Number.isFinite(tensioneV) ||
    !Number.isFinite(cadutaMaxPercentuale)
  ) {
    return { ok: false, errore: "Inserisci un valore valido." };
  }
  if (tensioneV <= 0) {
    return { ok: false, errore: "La tensione deve essere maggiore di zero." };
  }
  if (
    correnteA < 0 ||
    lunghezzaM <= 0 ||
    cadutaMaxPercentuale <= 0 ||
    cadutaMaxPercentuale > 100
  ) {
    return { ok: false, errore: "Controlla i valori inseriti." };
  }
  if (!MATERIALI.includes(materiale) || !SISTEMI.includes(sistema)) {
    return { ok: false, errore: "Controlla i valori inseriti." };
  }

  const rho = RESISTIVITA[materiale];
  const deltaUMax = tensioneV * (cadutaMaxPercentuale / 100);
  const fattore = sistema === "monofase" ? 2 : SQRT3;
  const sezioneCalcolataMm2 = (fattore * rho * lunghezzaM * correnteA) / deltaUMax;

  if (!Number.isFinite(sezioneCalcolataMm2) || sezioneCalcolataMm2 <= 0) {
    return { ok: false, errore: "Controlla i valori inseriti." };
  }

  const sezioneStimataMm2 = sezioneStandardMinima(sezioneCalcolataMm2);
  if (sezioneStimataMm2 == null) {
    return {
      ok: false,
      errore:
        "La sezione stimata supera le sezioni standard disponibili in questo strumento.",
      sezioneCalcolataMm2,
      sezioniStandardMm2: [...SEZIONI_STANDARD_MM2],
    };
  }

  return {
    ok: true,
    sezioneCalcolataMm2,
    sezioneStimataMm2,
    sezioniStandardMm2: [...SEZIONI_STANDARD_MM2],
    formula:
      sistema === "monofase"
        ? "S = 2 × ρ × L × I / ΔU_max"
        : "S = √3 × ρ × L × I / ΔU_max",
    parametri: {
      resistivitaOhmMm2PerM: rho,
      materiale,
      sistema,
      correnteA,
      lunghezzaM,
      tensioneV,
      cadutaMaxPercentuale,
      deltaUMaxV: deltaUMax,
    },
    avviso: AVVISO_SEZIONE,
  };
}
