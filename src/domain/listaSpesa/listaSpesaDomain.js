/**
 * @typedef {Object} VoceListaSpesa
 * @property {string} id
 * @property {string} nome
 * @property {number} quantita
 * @property {string} unita
 * @property {boolean} acquistato
 * @property {string=} lavoroId
 * @property {string=} cliente
 * @property {string=} data
 * @property {string} createdAt
 * @property {string} updatedAt
 */

function oraIso() {
  return new Date().toISOString();
}

/**
 * @param {{ nome: string, quantita?: number, unita?: string, lavoroId?: string, cliente?: string, data?: string, acquistato?: boolean }} input
 * @returns {VoceListaSpesa}
 */
export function creaVoceListaSpesa({
  nome,
  quantita = 1,
  unita = "cad",
  lavoroId = "",
  cliente = "",
  data = "",
  acquistato = false,
} = {}) {
  const now = oraIso();
  return {
    id: `spesa-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    nome: String(nome || "").trim(),
    quantita: Number(quantita) || 1,
    unita: String(unita || "cad").trim() || "cad",
    acquistato: Boolean(acquistato),
    lavoroId: lavoroId ? String(lavoroId) : "",
    cliente: String(cliente || "").trim(),
    data: String(data || "").trim(),
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * @param {VoceListaSpesa} voce
 * @param {Partial<VoceListaSpesa>} modifiche
 */
export function aggiornaVoceListaSpesa(voce, modifiche = {}) {
  return {
    ...voce,
    ...modifiche,
    nome:
      modifiche.nome != null ? String(modifiche.nome).trim() : voce.nome,
    updatedAt: oraIso(),
  };
}

/**
 * Aggiunge al carrello i materiali non acquistati di un lavoro/cantiere.
 * Evita duplicati per nome+lavoroId.
 * @param {VoceListaSpesa[]} elenco
 * @param {object} cantiere
 */
export function sincronizzaMaterialiDaCantiere(elenco = [], cantiere = {}) {
  const materiali = Array.isArray(cantiere.materiali) ? cantiere.materiali : [];
  const daComprare = materiali.filter((m) => m && m.nome && !m.acquistato);
  let prossimo = [...elenco];

  for (const materiale of daComprare) {
    const chiave = `${String(cantiere.id)}:${String(materiale.nome).trim().toLowerCase()}`;
    const esiste = prossimo.some(
      (voce) =>
        !voce.acquistato &&
        String(voce.lavoroId) === String(cantiere.id) &&
        String(voce.nome).trim().toLowerCase() ===
          String(materiale.nome).trim().toLowerCase()
    );
    if (esiste) continue;
    void chiave;
    prossimo.push(
      creaVoceListaSpesa({
        nome: materiale.nome,
        quantita: Number(materiale.quantita) || 1,
        unita: materiale.unita || "cad",
        lavoroId: cantiere.id,
        cliente: cantiere.cliente || "",
        data:
          cantiere.dataIntervento ||
          cantiere.dataProgrammata ||
          new Date().toLocaleDateString("it-IT"),
      })
    );
  }

  return prossimo;
}

/**
 * @param {VoceListaSpesa[]} elenco
 */
export function selezionaVociDaComprare(elenco = []) {
  return elenco.filter((voce) => voce && !voce.acquistato && voce.nome);
}
