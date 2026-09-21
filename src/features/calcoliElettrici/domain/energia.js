/**
 * Consumo / energia — E = P × t (pure).
 */

/**
 * Converte potenza in W.
 * @param {number} valore
 * @param {'W'|'kW'} unita
 */
export function potenzaAWatt(valore, unita) {
  if (unita === "kW") return valore * 1000;
  return valore;
}

/**
 * Converte tempo in ore.
 * @param {number} valore
 * @param {'ore'|'giorni'} unita
 */
export function tempoInOre(valore, unita) {
  if (unita === "giorni") return valore * 24;
  return valore;
}

/**
 * @param {{
 *   potenza: number,
 *   unitaPotenza: 'W'|'kW',
 *   tempo: number,
 *   unitaTempo: 'ore'|'giorni',
 *   costoPerKwh?: number|null,
 * }} input
 */
export function calcolaEnergia({
  potenza,
  unitaPotenza,
  tempo,
  unitaTempo,
  costoPerKwh = null,
}) {
  if (
    !Number.isFinite(potenza) ||
    !Number.isFinite(tempo) ||
    (unitaPotenza !== "W" && unitaPotenza !== "kW") ||
    (unitaTempo !== "ore" && unitaTempo !== "giorni")
  ) {
    return { ok: false, errore: "Inserisci un valore valido." };
  }
  if (potenza < 0 || tempo < 0) {
    return { ok: false, errore: "Controlla i valori inseriti." };
  }

  const potenzaW = potenzaAWatt(potenza, unitaPotenza);
  const ore = tempoInOre(tempo, unitaTempo);
  const energiaWh = potenzaW * ore;
  const energiaKwh = energiaWh / 1000;

  if (!Number.isFinite(energiaWh)) {
    return { ok: false, errore: "Controlla i valori inseriti." };
  }

  const risultato = {
    ok: true,
    energiaWh,
    energiaKwh,
    formula: "E = P × t",
    parametri: {
      potenzaW,
      ore,
      unitaPotenza,
      unitaTempo,
    },
  };

  if (costoPerKwh != null) {
    if (!Number.isFinite(costoPerKwh) || costoPerKwh < 0) {
      return { ok: false, errore: "Inserisci un valore valido." };
    }
    risultato.stimaCostoEuro = energiaKwh * costoPerKwh;
    risultato.costoPerKwh = costoPerKwh;
    risultato.avvisoCosto =
      "Stima costo. Non è il costo reale della bolletta.";
  }

  return risultato;
}
