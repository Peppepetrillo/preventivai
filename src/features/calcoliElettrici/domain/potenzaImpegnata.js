/**
 * Stima carico / potenza impegnata (pure, semplice).
 *
 * Somma potenze installate; se presente coefficiente di contemporaneità (0–1),
 * stima potenza contemporanea = totale × k.
 *
 * NON è potenza contrattuale consigliata.
 */

/**
 * @param {{
 *   carichiW: number[],
 *   coefficienteContemporaneita?: number|null,
 * }} input
 */
export function calcolaPotenzaImpegnata({
  carichiW,
  coefficienteContemporaneita = null,
}) {
  if (!Array.isArray(carichiW) || carichiW.length === 0) {
    return { ok: false, errore: "Inserisci almeno un carico." };
  }

  let totaleW = 0;
  for (const w of carichiW) {
    if (!Number.isFinite(w) || w < 0) {
      return { ok: false, errore: "Controlla i valori inseriti." };
    }
    totaleW += w;
  }

  const risultato = {
    ok: true,
    potenzaInstallataW: totaleW,
    potenzaInstallataKw: totaleW / 1000,
    formula: "P_tot = Σ P_i",
    avviso:
      "Stima del carico. Non è una potenza contrattuale consigliata.",
  };

  if (coefficienteContemporaneita != null && coefficienteContemporaneita !== "") {
    const k = Number(coefficienteContemporaneita);
    if (!Number.isFinite(k) || k < 0 || k > 1) {
      return {
        ok: false,
        errore: "Il coefficiente di contemporaneità deve essere tra 0 e 1.",
      };
    }
    risultato.coefficienteContemporaneita = k;
    risultato.potenzaContemporaneaW = totaleW * k;
    risultato.potenzaContemporaneaKw = (totaleW * k) / 1000;
    risultato.formula = "P_tot = Σ P_i; P_stimata = P_tot × k";
  }

  return risultato;
}
