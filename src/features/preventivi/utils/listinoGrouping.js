const ICONE_CATEGORIA = {
  Illuminazione: "💡",
  Impianto: "🔌",
  Quadro: "⚡",
  Assistenza: "🛠",
  "Bassa tensione": "📡",
  Materiali: "🧰",
};

export function iconaCategoria(nome) {
  return ICONE_CATEGORIA[nome] || "📋";
}

export function filtraListino(listino = [], ricerca = "") {
  const testo = ricerca.trim().toLowerCase();
  if (!testo) return listino;

  return listino.filter((voce) =>
    `${voce.nome} ${voce.categoria || ""}`.toLowerCase().includes(testo)
  );
}

export function raggruppaListinoPerCategoria(listino = []) {
  const gruppi = new Map();

  listino.forEach((voce) => {
    const categoria = voce.categoria?.trim() || "Altro";

    if (!gruppi.has(categoria)) {
      gruppi.set(categoria, []);
    }

    gruppi.get(categoria).push(voce);
  });

  return [...gruppi.entries()]
    .map(([nome, voci]) => ({
      nome,
      icona: iconaCategoria(nome),
      voci: [...voci].sort((a, b) => a.nome.localeCompare(b.nome, "it")),
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "it"));
}

export function creaStatoCategorieAperte(categorie = [], categorieAperte = []) {
  const stato = {};

  categorie.forEach((categoria) => {
    stato[categoria.nome] = categorieAperte.includes(categoria.nome);
  });

  if (categorieAperte.length > 0) {
    return stato;
  }

  if (categorie[0]) {
    return { [categorie[0].nome]: true };
  }

  return stato;
}

export function creaMappaQuantitaCarrello(lavorazioni = []) {
  const mappa = new Map();

  lavorazioni.forEach((item) => {
    mappa.set(item.nome, Number(item.quantita) || 0);
  });

  return mappa;
}

export function quantitaDaMappa(mappa, voce) {
  if (!mappa || !voce?.nome) return 0;
  return mappa.get(voce.nome) || 0;
}

export function quantitaVoceNelCarrello(lavorazioni = [], voce) {
  return quantitaDaMappa(creaMappaQuantitaCarrello(lavorazioni), voce);
}

export function calcolaNumeroVociCarrello(lavorazioni = []) {
  return lavorazioni.reduce(
    (acc, item) => acc + (Number(item.quantita) || 0),
    0
  );
}
