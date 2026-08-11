/**
 * @typedef {Object} VoceListaSpesa
 * @property {string} id
 * @property {string} nome
 * @property {number} quantita
 * @property {string} unita
 * @property {boolean} acquistato
 * @property {string=} lavoroId
 * @property {string=} cantiereId
 * @property {string=} famigliaId
 * @property {string=} varianteId
 * @property {string=} distintaVoceId
 * @property {string=} cliente
 * @property {string=} data
 * @property {boolean=} modificatoManualmente
 * @property {string} createdAt
 * @property {string} updatedAt
 */

function oraIso() {
  return new Date().toISOString();
}

/**
 * @param {{
 *   nome: string,
 *   quantita?: number,
 *   unita?: string,
 *   lavoroId?: string,
 *   cantiereId?: string,
 *   famigliaId?: string,
 *   varianteId?: string,
 *   distintaVoceId?: string,
 *   cliente?: string,
 *   data?: string,
 *   acquistato?: boolean,
 *   modificatoManualmente?: boolean,
 * }} input
 * @returns {VoceListaSpesa}
 */
export function creaVoceListaSpesa({
  nome,
  quantita = 1,
  unita = "cad",
  lavoroId = "",
  cantiereId = "",
  famigliaId = "",
  varianteId = "",
  distintaVoceId = "",
  cliente = "",
  data = "",
  acquistato = false,
  modificatoManualmente = false,
} = {}) {
  const now = oraIso();
  /** @type {VoceListaSpesa} */
  const voce = {
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

  const cantiere = cantiereId || lavoroId;
  if (cantiere) voce.cantiereId = String(cantiere);
  if (famigliaId) voce.famigliaId = String(famigliaId);
  if (varianteId) voce.varianteId = String(varianteId);
  if (distintaVoceId) voce.distintaVoceId = String(distintaVoceId);
  if (modificatoManualmente) voce.modificatoManualmente = true;

  return voce;
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
 * Preferenza dedup:
 * 1. varianteId + lavoroId
 * 2. distintaVoceId + lavoroId
 * 3. fallback nome + lavoroId
 *
 * @param {VoceListaSpesa[]} elenco
 * @param {object} materiale
 * @param {string|number} lavoroId
 * @returns {VoceListaSpesa|undefined}
 */
export function trovaVoceListaCollegata(elenco = [], materiale = {}, lavoroId) {
  const lid = String(lavoroId || "");
  const nonAcquistate = elenco.filter(
    (voce) => voce && !voce.acquistato && String(voce.lavoroId) === lid
  );

  if (materiale.varianteId) {
    const perVariante = nonAcquistate.find(
      (voce) =>
        voce.varianteId &&
        String(voce.varianteId) === String(materiale.varianteId)
    );
    if (perVariante) return perVariante;
  }

  if (materiale.distintaVoceId) {
    const perDistinta = nonAcquistate.find(
      (voce) =>
        voce.distintaVoceId &&
        String(voce.distintaVoceId) === String(materiale.distintaVoceId)
    );
    if (perDistinta) return perDistinta;
  }

  const nome = String(materiale.nome || "")
    .trim()
    .toLowerCase();
  if (!nome) return undefined;

  return nonAcquistate.find(
    (voce) => String(voce.nome).trim().toLowerCase() === nome
  );
}

/**
 * Aggiunge/aggiorna nel carrello i materiali non acquistati di un lavoro/cantiere.
 * Idempotente: sync ripetuto non crea duplicati; aggiorna quantità se ancora collegata.
 *
 * @param {VoceListaSpesa[]} elenco
 * @param {object} cantiere
 */
export function sincronizzaMaterialiDaCantiere(elenco = [], cantiere = {}) {
  const materiali = Array.isArray(cantiere.materiali) ? cantiere.materiali : [];
  const daComprare = materiali.filter((m) => m && m.nome && !m.acquistato);
  let prossimo = [...elenco];
  const data =
    cantiere.dataIntervento ||
    cantiere.dataProgrammata ||
    new Date().toLocaleDateString("it-IT");

  for (const materiale of daComprare) {
    const esistente = trovaVoceListaCollegata(
      prossimo,
      materiale,
      cantiere.id
    );

    if (esistente) {
      // Non sovrascrivere modifiche manuali sulla lista spesa.
      if (esistente.modificatoManualmente) continue;

      const ancoraCollegata =
        (materiale.distintaVoceId &&
          esistente.distintaVoceId &&
          String(esistente.distintaVoceId) ===
            String(materiale.distintaVoceId)) ||
        (materiale.varianteId &&
          esistente.varianteId &&
          String(esistente.varianteId) === String(materiale.varianteId)) ||
        // legacy / catalogo senza id: aggiorna se match per nome+lavoro
        true;

      if (!ancoraCollegata) continue;

      prossimo = prossimo.map((voce) => {
        if (voce.id !== esistente.id) return voce;
        return aggiornaVoceListaSpesa(voce, {
          quantita: Number(materiale.quantita) || voce.quantita,
          unita: materiale.unita || voce.unita,
          nome: materiale.nome || voce.nome,
          famigliaId: materiale.famigliaId || voce.famigliaId,
          varianteId: materiale.varianteId || voce.varianteId,
          distintaVoceId: materiale.distintaVoceId || voce.distintaVoceId,
          cantiereId: String(cantiere.id),
          lavoroId: String(cantiere.id),
        });
      });
      continue;
    }

    prossimo.push(
      creaVoceListaSpesa({
        nome: materiale.nome,
        quantita: Number(materiale.quantita) || 1,
        unita: materiale.unita || "cad",
        lavoroId: cantiere.id,
        cantiereId: cantiere.id,
        famigliaId: materiale.famigliaId,
        varianteId: materiale.varianteId,
        distintaVoceId: materiale.distintaVoceId,
        cliente: cantiere.cliente || "",
        data,
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
