/**
 * Catalogo Materiali — tipi, categorie, unità canoniche.
 * Sprint 13 Step 1: solo domain (niente repository/UI).
 */

/**
 * @typedef {"elettrico"|"allarme"|"videosorveglianza"|"rete-dati"|"illuminazione"|"domotica"|"fotovoltaico"|"generale"} CategoriaMateriale
 */

/**
 * @typedef {"pz"|"m"|"h"|"kg"|"m²"|"m³"|"confezione"|"rotolo"|"kit"|"altro"} UnitaMateriale
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
  ALLARME: "allarme",
  VIDEOSORVEGLIANZA: "videosorveglianza",
  RETE_DATI: "rete-dati",
  ILLUMINAZIONE: "illuminazione",
  DOMOTICA: "domotica",
  FOTOVOLTAICO: "fotovoltaico",
  GENERALE: "generale",
});

/** @type {ReadonlyArray<CategoriaMateriale>} */
export const CATEGORIE_MATERIALE = Object.freeze(
  Object.values(CATEGORIA_MATERIALE)
);

export const ETICHETTE_CATEGORIA_MATERIALE = Object.freeze({
  [CATEGORIA_MATERIALE.ELETTRICO]: "Impianto elettrico",
  [CATEGORIA_MATERIALE.ALLARME]: "Allarme",
  [CATEGORIA_MATERIALE.VIDEOSORVEGLIANZA]: "Videosorveglianza",
  [CATEGORIA_MATERIALE.RETE_DATI]: "Rete dati",
  [CATEGORIA_MATERIALE.ILLUMINAZIONE]: "Illuminazione",
  [CATEGORIA_MATERIALE.DOMOTICA]: "Domotica",
  [CATEGORIA_MATERIALE.FOTOVOLTAICO]: "Fotovoltaico",
  [CATEGORIA_MATERIALE.GENERALE]: "Materiale generale",
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
