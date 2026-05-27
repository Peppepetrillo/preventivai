export function formatEuro(valore) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(Number(valore || 0));
}

export function creaNumeroPreventivo(progressivo) {
  const anno = new Date().getFullYear();
  return `PREV-${anno}-${String(progressivo).padStart(4, "0")}`;
}

export function calcolaTotali(lavorazioni, sconto = 0, iva = 22) {
  const subtotale = lavorazioni.reduce(
    (acc, item) =>
      acc + Number(item.prezzo || 0) * Number(item.quantita || 0),
    0
  );

  const importoSconto = subtotale * (Number(sconto || 0) / 100);
  const imponibile = Math.max(subtotale - importoSconto, 0);
  const importoIva = imponibile * (Number(iva || 0) / 100);
  const totale = imponibile + importoIva;

  return {
    subtotale,
    importoSconto,
    imponibile,
    importoIva,
    totale,
  };
}
