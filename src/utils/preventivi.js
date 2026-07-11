export function formatEuro(valore) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(normalizzaNumero(valore));
}

export function creaNumeroPreventivo(progressivo) {
  const anno = new Date().getFullYear();
  const numero = Math.max(1, Math.trunc(normalizzaNumero(progressivo, 1)));
  return `PREV-${anno}-${String(numero).padStart(4, "0")}`;
}

export function creaProssimoNumeroPreventivo(archivio = []) {
  const anno = new Date().getFullYear();
  const prefisso = `PREV-${anno}-`;
  const ultimoProgressivo = archivio.reduce((massimo, preventivo) => {
    const numero = String(preventivo?.numero || "");

    if (!numero.startsWith(prefisso)) return massimo;

    const progressivo = normalizzaNumero(numero.slice(prefisso.length));
    return Math.max(massimo, progressivo);
  }, 0);

  return creaNumeroPreventivo(ultimoProgressivo + 1);
}

export function normalizzaNumero(valore, fallback = 0) {
  const numero = Number(valore);
  return Number.isFinite(numero) ? numero : fallback;
}

export function calcolaTotali(lavorazioni, sconto = 0, iva = 22) {
  const subtotale = lavorazioni.reduce(
    (acc, item) =>
      acc + normalizzaNumero(item.prezzo) * normalizzaNumero(item.quantita),
    0
  );

  const importoSconto = subtotale * (normalizzaNumero(sconto) / 100);
  const imponibile = Math.max(subtotale - importoSconto, 0);
  const importoIva = imponibile * (normalizzaNumero(iva) / 100);
  const totale = imponibile + importoIva;

  return {
    subtotale,
    importoSconto,
    imponibile,
    importoIva,
    totale,
  };
}

export function calcolaSaldo(totale, acconto = 0) {
  return Math.max(normalizzaNumero(totale) - normalizzaNumero(acconto), 0);
}
