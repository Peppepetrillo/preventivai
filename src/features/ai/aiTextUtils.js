/**
 * Utilità testo per classificazione / similarità (puro).
 */

/**
 * @param {string} testo
 * @returns {string}
 */
export function normalizzaTestoAi(testo = "") {
  return String(testo || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * @param {string} testo
 * @returns {string[]}
 */
export function tokenizzaAi(testo = "") {
  return normalizzaTestoAi(testo)
    .split(" ")
    .filter((t) => t.length > 2);
}

/**
 * Unisce campi testuali del lavoro in un blob ricercabile.
 * @param {object} lavoro
 * @returns {string}
 */
export function testoLavoroAi(lavoro = {}) {
  const parti = [
    lavoro.titolo,
    lavoro.nome,
    lavoro.descrizione,
    lavoro.tipoLavoro,
    lavoro.tipologiaImpianto,
    lavoro.categoria,
    ...(Array.isArray(lavoro.paroleChiave) ? lavoro.paroleChiave : []),
    ...(Array.isArray(lavoro.lavorazioni)
      ? lavoro.lavorazioni.map((v) => `${v?.nome || ""} ${v?.categoria || ""}`)
      : []),
    ...(Array.isArray(lavoro.materiali)
      ? lavoro.materiali.map((m) => m?.nome || m || "")
      : []),
  ];
  return normalizzaTestoAi(parti.filter(Boolean).join(" "));
}
