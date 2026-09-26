/**
 * Conversioni unità elettriche / geometriche (pure, esatte).
 */

/** Fattori verso unità base (W, A, V, Ω, m, mm²). */
const UNITA = Object.freeze({
  W: { famiglia: "potenza", versoBase: 1 },
  kW: { famiglia: "potenza", versoBase: 1000 },
  A: { famiglia: "corrente", versoBase: 1 },
  mA: { famiglia: "corrente", versoBase: 0.001 },
  V: { famiglia: "tensione", versoBase: 1 },
  mV: { famiglia: "tensione", versoBase: 0.001 },
  kV: { famiglia: "tensione", versoBase: 1000 },
  "Ω": { famiglia: "resistenza", versoBase: 1 },
  kΩ: { famiglia: "resistenza", versoBase: 1000 },
  mΩ: { famiglia: "resistenza", versoBase: 0.001 },
  m: { famiglia: "lunghezza", versoBase: 1 },
  cm: { famiglia: "lunghezza", versoBase: 0.01 },
  mm: { famiglia: "lunghezza", versoBase: 0.001 },
  "mm²": { famiglia: "sezione", versoBase: 1 },
  "cm²": { famiglia: "sezione", versoBase: 100 },
});

export const UNITA_CONVERSIONE = Object.freeze(Object.keys(UNITA));

/**
 * @param {string} da
 * @param {string} a
 */
export function famiglieCompatibili(da, a) {
  const uDa = UNITA[da];
  const uA = UNITA[a];
  if (!uDa || !uA) return false;
  return uDa.famiglia === uA.famiglia;
}

/**
 * @param {{ valore: number, da: string, a: string }} input
 */
export function convertiUnita({ valore, da, a }) {
  if (!Number.isFinite(valore)) {
    return { ok: false, errore: "Inserisci un valore valido." };
  }
  if (valore < 0) {
    return { ok: false, errore: "Controlla i valori inseriti." };
  }
  const uDa = UNITA[da];
  const uA = UNITA[a];
  if (!uDa || !uA) {
    return { ok: false, errore: "Controlla i valori inseriti." };
  }
  if (uDa.famiglia !== uA.famiglia) {
    return {
      ok: false,
      errore: "Le unità devono appartenere alla stessa grandezza.",
    };
  }

  const inBase = valore * uDa.versoBase;
  const risultato = inBase / uA.versoBase;

  if (!Number.isFinite(risultato)) {
    return { ok: false, errore: "Controlla i valori inseriti." };
  }

  return {
    ok: true,
    valore: risultato,
    da,
    a,
    formula: `${da} → ${a}`,
  };
}

/**
 * Scambia unità sorgente/destinazione.
 * @param {string} da
 * @param {string} a
 */
export function invertiUnita(da, a) {
  return { da: a, a: da };
}
