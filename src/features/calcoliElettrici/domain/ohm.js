/**
 * Legge di Ohm — V = I × R (pure).
 */

/**
 * Calcola il valore mancante tra V, I, R.
 * Esattamente uno dei tre deve essere null/undefined.
 *
 * @param {{ tensione?: number|null, corrente?: number|null, resistenza?: number|null }} input
 * @returns {{ ok: true, tensione: number, corrente: number, resistenza: number, formula: string, calcolato: 'tensione'|'corrente'|'resistenza' }|{ ok: false, errore: string }}
 */
export function calcolaLeggeOhm({ tensione, corrente, resistenza }) {
  const hasV = tensione != null && Number.isFinite(tensione);
  const hasI = corrente != null && Number.isFinite(corrente);
  const hasR = resistenza != null && Number.isFinite(resistenza);
  const count = [hasV, hasI, hasR].filter(Boolean).length;

  if (count !== 2) {
    return {
      ok: false,
      errore: "Lascia vuoto un solo valore da calcolare.",
    };
  }

  if (hasV && tensione < 0) {
    return { ok: false, errore: "Controlla i valori inseriti." };
  }
  if (hasI && corrente < 0) {
    return { ok: false, errore: "Controlla i valori inseriti." };
  }
  if (hasR && resistenza < 0) {
    return { ok: false, errore: "Controlla i valori inseriti." };
  }

  if (!hasV) {
    if (corrente === 0 || resistenza === 0) {
      // V = 0 is valid mathematically if I or R is 0
    }
    const v = corrente * resistenza;
    return {
      ok: true,
      tensione: v,
      corrente,
      resistenza,
      formula: "V = I × R",
      calcolato: "tensione",
    };
  }

  if (!hasI) {
    if (resistenza === 0) {
      return { ok: false, errore: "Non è possibile dividere per zero." };
    }
    const i = tensione / resistenza;
    return {
      ok: true,
      tensione,
      corrente: i,
      resistenza,
      formula: "I = V / R",
      calcolato: "corrente",
    };
  }

  // !hasR
  if (corrente === 0) {
    return { ok: false, errore: "Non è possibile dividere per zero." };
  }
  const r = tensione / corrente;
  return {
    ok: true,
    tensione,
    corrente,
    resistenza: r,
    formula: "R = V / I",
    calcolato: "resistenza",
  };
}
