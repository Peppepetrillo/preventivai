/**
 * Catalogo Materiali — tipi, categorie, unità canoniche.
 * Sprint 13 Step 1: solo domain (niente repository/UI).
 * UX-6.1a: accessoriSuggeriti (relazioni soft, retrocompatibili).
 */

/**
 * @typedef {"elettrico"|"cavi"|"tubi"|"canalizzazioni"|"cassette"|"serie-civile"|"quadri"|"morsetti"|"illuminazione"|"rete-dati"|"tv-sat"|"videosorveglianza"|"allarme"|"domotica"|"fotovoltaico"|"generale"|"industriale"|"ev"|"automazione"} CategoriaMateriale
 */

/**
 * @typedef {"pz"|"m"|"h"|"kg"|"m²"|"m³"|"confezione"|"rotolo"|"kit"|"altro"} UnitaMateriale
 */

/**
 * Relazione soft verso un accessorio tipico (famiglia e/o variante target).
 * Almeno uno tra `varianteId` e `famigliaId` deve essere valorizzato.
 *
 * @typedef {Object} AccessorioSuggerito
 * @property {string=} varianteId
 * @property {string=} famigliaId
 * @property {number} quantitaPerUnita — moltiplicatore rispetto alla qty del materiale padre (default 1)
 * @property {boolean} obbligatorio — default false (suggerito, non imposto)
 * @property {string=} nota
 */

/**
 * @typedef {Object} VarianteMateriale
 * @property {string} id
 * @property {string} famigliaId
 * @property {string} etichetta
 * @property {Record<string, string|number>} attributi
 * @property {UnitaMateriale=} unita
 * @property {number=} prezzoIndicativo
 * @property {boolean} attiva
 * @property {AccessorioSuggerito[]=} accessoriSuggeriti
 */

/**
 * @typedef {Object} FamigliaMateriale
 * @property {string} id
 * @property {string} nome
 * @property {CategoriaMateriale} categoria
 * @property {UnitaMateriale} unitaDefault
 * @property {string} attributoChiave
 * @property {VarianteMateriale[]} varianti
 * @property {boolean} attiva
 * @property {boolean} personalizzata
 * @property {string=} descrizione
 * @property {AccessorioSuggerito[]=} accessoriSuggeriti
 * @property {string=} createdAt
 * @property {string=} updatedAt
 */

/**
 * @typedef {Object} RiferimentoMateriale
 * @property {string=} famigliaId
 * @property {string=} varianteId
 * @property {string} nome
 * @property {UnitaMateriale|string} unita
 * @property {number} quantita
 * @property {number=} prezzoUnitario
 * @property {string=} note
 */

export const CATEGORIA_MATERIALE = Object.freeze({
  ELETTRICO: "elettrico",
  CAVI: "cavi",
  TUBI: "tubi",
  CANALIZZAZIONI: "canalizzazioni",
  CASSETTE: "cassette",
  SERIE_CIVILE: "serie-civile",
  QUADRI: "quadri",
  MORSETTI: "morsetti",
  ILLUMINAZIONE: "illuminazione",
  RETE_DATI: "rete-dati",
  TV_SAT: "tv-sat",
  VIDEOSORVEGLIANZA: "videosorveglianza",
  ALLARME: "allarme",
  DOMOTICA: "domotica",
  FOTOVOLTAICO: "fotovoltaico",
  GENERALE: "generale",
  INDUSTRIALE: "industriale",
  EV: "ev",
  AUTOMAZIONE: "automazione",
});

/** @type {ReadonlyArray<CategoriaMateriale>} */
export const CATEGORIE_MATERIALE = Object.freeze(
  Object.values(CATEGORIA_MATERIALE)
);

/**
 * Categorie in griglia iPhone (senza `elettrico` legacy).
 * @type {ReadonlyArray<CategoriaMateriale>}
 */
export const CATEGORIE_NAVIGAZIONE_MATERIALE = Object.freeze([
  CATEGORIA_MATERIALE.CAVI,
  CATEGORIA_MATERIALE.TUBI,
  CATEGORIA_MATERIALE.CANALIZZAZIONI,
  CATEGORIA_MATERIALE.CASSETTE,
  CATEGORIA_MATERIALE.SERIE_CIVILE,
  CATEGORIA_MATERIALE.QUADRI,
  CATEGORIA_MATERIALE.MORSETTI,
  CATEGORIA_MATERIALE.ILLUMINAZIONE,
  CATEGORIA_MATERIALE.RETE_DATI,
  CATEGORIA_MATERIALE.TV_SAT,
  CATEGORIA_MATERIALE.VIDEOSORVEGLIANZA,
  CATEGORIA_MATERIALE.ALLARME,
  CATEGORIA_MATERIALE.DOMOTICA,
  CATEGORIA_MATERIALE.FOTOVOLTAICO,
  CATEGORIA_MATERIALE.EV,
  CATEGORIA_MATERIALE.INDUSTRIALE,
  CATEGORIA_MATERIALE.AUTOMAZIONE,
  CATEGORIA_MATERIALE.GENERALE,
]);

export const ETICHETTE_CATEGORIA_MATERIALE = Object.freeze({
  [CATEGORIA_MATERIALE.ELETTRICO]: "Impianto elettrico",
  [CATEGORIA_MATERIALE.CAVI]: "Cavi e conduttori",
  [CATEGORIA_MATERIALE.TUBI]: "Corrugati e tubazioni",
  [CATEGORIA_MATERIALE.CANALIZZAZIONI]: "Canalizzazioni",
  [CATEGORIA_MATERIALE.CASSETTE]: "Scatole e cassette",
  [CATEGORIA_MATERIALE.SERIE_CIVILE]: "Serie civile",
  [CATEGORIA_MATERIALE.QUADRI]: "Quadri e protezioni",
  [CATEGORIA_MATERIALE.MORSETTI]: "Morsetti e connessioni",
  [CATEGORIA_MATERIALE.ILLUMINAZIONE]: "Illuminazione",
  [CATEGORIA_MATERIALE.RETE_DATI]: "Rete e dati",
  [CATEGORIA_MATERIALE.TV_SAT]: "TV / SAT",
  [CATEGORIA_MATERIALE.VIDEOSORVEGLIANZA]: "Videosorveglianza",
  [CATEGORIA_MATERIALE.ALLARME]: "Antintrusione",
  [CATEGORIA_MATERIALE.DOMOTICA]: "Domotica",
  [CATEGORIA_MATERIALE.FOTOVOLTAICO]: "Fotovoltaico",
  [CATEGORIA_MATERIALE.GENERALE]: "Consumo e fissaggio",
  [CATEGORIA_MATERIALE.INDUSTRIALE]: "Prese e spine industriali",
  [CATEGORIA_MATERIALE.EV]: "Ricarica EV",
  [CATEGORIA_MATERIALE.AUTOMAZIONE]: "Automazione",
});

export const UNITA_MATERIALE = Object.freeze({
  PZ: "pz",
  M: "m",
  H: "h",
  KG: "kg",
  MQ: "m²",
  MC: "m³",
  CONFEZIONE: "confezione",
  ROTOLO: "rotolo",
  KIT: "kit",
  ALTRO: "altro",
});

/** @type {ReadonlyArray<UnitaMateriale>} */
export const UNITA_MATERIALE_CANONICHE = Object.freeze(
  Object.values(UNITA_MATERIALE)
);

/**
 * Alias legacy → unità canoniche.
 * `cad` (vecchio default cantieri/listino) → `pz`
 * `mq` → `m²`
 */
export const UNITA_MATERIALE_ALIAS = Object.freeze({
  cad: UNITA_MATERIALE.PZ,
  CAD: UNITA_MATERIALE.PZ,
  pz: UNITA_MATERIALE.PZ,
  mq: UNITA_MATERIALE.MQ,
  MQ: UNITA_MATERIALE.MQ,
  m2: UNITA_MATERIALE.MQ,
  "m^2": UNITA_MATERIALE.MQ,
  m3: UNITA_MATERIALE.MC,
  "m^3": UNITA_MATERIALE.MC,
});

/**
 * @param {string} categoria
 * @returns {boolean}
 */
export function isCategoriaMateriale(categoria) {
  return CATEGORIE_MATERIALE.includes(
    /** @type {CategoriaMateriale} */ (String(categoria || "").trim())
  );
}

/**
 * @param {string} unita
 * @returns {boolean}
 */
export function isUnitaCanonica(unita) {
  return UNITA_MATERIALE_CANONICHE.includes(
    /** @type {UnitaMateriale} */ (String(unita || "").trim())
  );
}

/**
 * Normalizza unità legacy/canoniche.
 * @param {string} unita
 * @returns {UnitaMateriale|string}
 */
export function normalizzaUnitaMateriale(unita = "") {
  const grezzo = String(unita || "").trim();
  if (!grezzo) return UNITA_MATERIALE.PZ;

  if (UNITA_MATERIALE_ALIAS[grezzo] != null) {
    return UNITA_MATERIALE_ALIAS[grezzo];
  }

  const lower = grezzo.toLowerCase();
  if (UNITA_MATERIALE_ALIAS[lower] != null) {
    return UNITA_MATERIALE_ALIAS[lower];
  }

  if (isUnitaCanonica(grezzo)) return grezzo;
  return grezzo;
}

/**
 * Normalizza una relazione accessorio. Null se invalida.
 * Retrocompatibile: campi assenti o array corrotti → ignorati a monte.
 *
 * @param {unknown} grezzo
 * @returns {AccessorioSuggerito|null}
 */
export function normalizzaAccessorioSuggerito(grezzo) {
  if (!grezzo || typeof grezzo !== "object") return null;

  const raw = /** @type {Record<string, unknown>} */ (grezzo);
  const varianteId = String(raw.varianteId || "").trim() || undefined;
  const famigliaId = String(raw.famigliaId || "").trim() || undefined;

  if (!varianteId && !famigliaId) return null;

  const quantitaRaw = Number(raw.quantitaPerUnita);
  const quantitaPerUnita =
    Number.isFinite(quantitaRaw) && quantitaRaw > 0 ? quantitaRaw : 1;

  /** @type {AccessorioSuggerito} */
  const accessorio = {
    quantitaPerUnita,
    obbligatorio: Boolean(raw.obbligatorio),
  };

  if (varianteId) accessorio.varianteId = varianteId;
  if (famigliaId) accessorio.famigliaId = famigliaId;

  const nota = String(raw.nota || "").trim();
  if (nota) accessorio.nota = nota;

  return accessorio;
}

/**
 * @param {unknown} elenco
 * @returns {AccessorioSuggerito[]}
 */
export function normalizzaAccessoriSuggeriti(elenco) {
  if (!Array.isArray(elenco) || elenco.length === 0) return [];

  /** @type {AccessorioSuggerito[]} */
  const risultato = [];
  /** @type {Set<string>} */
  const visti = new Set();

  for (const grezzo of elenco) {
    const accessorio = normalizzaAccessorioSuggerito(grezzo);
    if (!accessorio) continue;

    const chiave = `${accessorio.varianteId || ""}|${accessorio.famigliaId || ""}`;
    if (visti.has(chiave)) continue;
    visti.add(chiave);
    risultato.push(accessorio);
  }

  return risultato;
}

/**
 * Quantità suggerita accessorio = qty padre × quantitaPerUnita.
 * @param {number} quantitaPadre
 * @param {AccessorioSuggerito|object} accessorio
 * @returns {number}
 */
export function calcolaQuantitaAccessorioSuggerito(
  quantitaPadre,
  accessorio = {}
) {
  const padre = Number(quantitaPadre);
  const qtyPadre = Number.isFinite(padre) && padre > 0 ? padre : 0;
  const fattore = Number(accessorio?.quantitaPerUnita);
  const moltiplicatore =
    Number.isFinite(fattore) && fattore > 0 ? fattore : 1;
  const grezzo = qtyPadre * moltiplicatore;
  if (grezzo <= 0) return 0;
  return Math.max(1, Math.round(grezzo * 1000) / 1000);
}
