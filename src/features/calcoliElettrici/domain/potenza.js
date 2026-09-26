/**
 * Potenza e corrente — monofase / trifase (pure).
 */

import { SQRT3 } from "./constants";

/**
 * @param {{ potenzaW: number, tensioneV: number }} input
 */
export function calcolaCorrenteMonofase({ potenzaW, tensioneV }) {
  if (!Number.isFinite(potenzaW) || !Number.isFinite(tensioneV)) {
    return { ok: false, errore: "Inserisci un valore valido." };
  }
  if (potenzaW < 0 || tensioneV <= 0) {
    return {
      ok: false,
      errore:
        tensioneV <= 0
          ? "La tensione deve essere maggiore di zero."
          : "Controlla i valori inseriti.",
    };
  }
  return {
    ok: true,
    correnteA: potenzaW / tensioneV,
    formula: "I = P / V",
  };
}

/**
 * @param {{ correnteA: number, tensioneV: number }} input
 */
export function calcolaPotenzaMonofase({ correnteA, tensioneV }) {
  if (!Number.isFinite(correnteA) || !Number.isFinite(tensioneV)) {
    return { ok: false, errore: "Inserisci un valore valido." };
  }
  if (correnteA < 0 || tensioneV <= 0) {
    return {
      ok: false,
      errore:
        tensioneV <= 0
          ? "La tensione deve essere maggiore di zero."
          : "Controlla i valori inseriti.",
    };
  }
  return {
    ok: true,
    potenzaW: tensioneV * correnteA,
    formula: "P = V × I",
  };
}

/**
 * @param {{ potenzaW: number, tensioneV: number, cosPhi: number }} input
 */
export function calcolaCorrenteTrifase({ potenzaW, tensioneV, cosPhi }) {
  if (
    !Number.isFinite(potenzaW) ||
    !Number.isFinite(tensioneV) ||
    !Number.isFinite(cosPhi)
  ) {
    return { ok: false, errore: "Inserisci un valore valido." };
  }
  if (potenzaW < 0 || tensioneV <= 0) {
    return {
      ok: false,
      errore:
        tensioneV <= 0
          ? "La tensione deve essere maggiore di zero."
          : "Controlla i valori inseriti.",
    };
  }
  if (cosPhi <= 0 || cosPhi > 1) {
    return { ok: false, errore: "cosφ deve essere tra 0 e 1 (escluso 0)." };
  }
  const denominatore = SQRT3 * tensioneV * cosPhi;
  return {
    ok: true,
    correnteA: potenzaW / denominatore,
    formula: "I = P / (√3 × V × cosφ)",
    cosPhiUsato: cosPhi,
  };
}

/**
 * @param {{ correnteA: number, tensioneV: number, cosPhi: number }} input
 */
export function calcolaPotenzaTrifase({ correnteA, tensioneV, cosPhi }) {
  if (
    !Number.isFinite(correnteA) ||
    !Number.isFinite(tensioneV) ||
    !Number.isFinite(cosPhi)
  ) {
    return { ok: false, errore: "Inserisci un valore valido." };
  }
  if (correnteA < 0 || tensioneV <= 0) {
    return {
      ok: false,
      errore:
        tensioneV <= 0
          ? "La tensione deve essere maggiore di zero."
          : "Controlla i valori inseriti.",
    };
  }
  if (cosPhi < 0 || cosPhi > 1) {
    return { ok: false, errore: "cosφ deve essere tra 0 e 1." };
  }
  return {
    ok: true,
    potenzaW: SQRT3 * tensioneV * correnteA * cosPhi,
    formula: "P = √3 × V × I × cosφ",
    cosPhiUsato: cosPhi,
  };
}

/**
 * Converte potenza in W da unità UI.
 * @param {number} valore
 * @param {'W'|'kW'} unita
 */
export function potenzaInWatt(valore, unita) {
  if (unita === "kW") return valore * 1000;
  return valore;
}

/**
 * @param {number} watt
 * @param {'W'|'kW'} unita
 */
export function wattInUnita(watt, unita) {
  if (unita === "kW") return watt / 1000;
  return watt;
}
