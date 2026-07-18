import { calcolaSaldo, normalizzaNumero } from "../../utils/preventivi";

export const STATI_INCASSO = {
  daIncassare: "Da incassare",
  parziale: "Parziale",
  saldato: "Saldato",
};

export function leggiIncassato(preventivo) {
  return normalizzaNumero(preventivo?.incassato ?? preventivo?.acconto);
}

export function calcolaDaIncassare(preventivo) {
  return calcolaSaldo(preventivo?.totale, leggiIncassato(preventivo));
}

export function calcolaStatoIncasso(preventivo) {
  const totale = normalizzaNumero(preventivo?.totale);
  const incassato = leggiIncassato(preventivo);

  if (totale > 0 && incassato >= totale) return STATI_INCASSO.saldato;
  if (incassato > 0) return STATI_INCASSO.parziale;
  return STATI_INCASSO.daIncassare;
}

export function normalizzaPreventivoIncasso(preventivo) {
  const totale = normalizzaNumero(preventivo?.totale);
  const incassato = Math.min(leggiIncassato(preventivo), totale);

  return {
    ...preventivo,
    incassato,
    statoIncasso: calcolaStatoIncasso({
      ...preventivo,
      incassato,
    }),
  };
}

export function registraIncasso(preventivo, importo) {
  const totale = normalizzaNumero(preventivo?.totale);
  const incassato = Math.min(leggiIncassato(preventivo) + normalizzaNumero(importo), totale);
  const dataUltimoIncasso = new Date().toLocaleDateString("it-IT");

  return {
    ...preventivo,
    incassato,
    dataUltimoIncasso,
    statoIncasso: calcolaStatoIncasso({
      ...preventivo,
      incassato,
    }),
  };
}

export function segnaPreventivoSaldato(preventivo) {
  const totale = normalizzaNumero(preventivo?.totale);

  return {
    ...preventivo,
    incassato: totale,
    dataUltimoIncasso: new Date().toLocaleDateString("it-IT"),
    statoIncasso: STATI_INCASSO.saldato,
  };
}

export function riepilogaIncassi(preventivi = []) {
  return preventivi.reduce(
    (riepilogo, preventivo) => {
      const preventivoNormalizzato = normalizzaPreventivoIncasso(preventivo);
      const daIncassare = calcolaDaIncassare(preventivoNormalizzato);

      return {
        daIncassare: riepilogo.daIncassare + daIncassare,
        incassato: riepilogo.incassato + leggiIncassato(preventivoNormalizzato),
        saldati:
          riepilogo.saldati +
          (preventivoNormalizzato.statoIncasso === STATI_INCASSO.saldato ? 1 : 0),
      };
    },
    {
      daIncassare: 0,
      incassato: 0,
      saldati: 0,
    }
  );
}
