/**
 * Costruisce la griglia mensile (lun–dom) con giorni del mese precedente/successivo.
 * @param {number} anno
 * @param {number} mese 0-based
 */
export function costruisciGrigliaCalendario(anno, mese) {
  const primoGiorno = new Date(anno, mese, 1);
  const ultimoGiorno = new Date(anno, mese + 1, 0);

  let offset = primoGiorno.getDay() - 1;
  if (offset < 0) offset = 6;

  const celle = [];

  for (let i = offset - 1; i >= 0; i -= 1) {
    const data = new Date(anno, mese, -i);
    celle.push({ data, meseCorrente: false });
  }

  for (let giorno = 1; giorno <= ultimoGiorno.getDate(); giorno += 1) {
    celle.push({ data: new Date(anno, mese, giorno), meseCorrente: true });
  }

  while (celle.length % 7 !== 0) {
    const ultima = celle[celle.length - 1].data;
    const data = new Date(ultima);
    data.setDate(data.getDate() + 1);
    celle.push({ data, meseCorrente: false });
  }

  return celle;
}

export function stessoGiorno(a, b) {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
