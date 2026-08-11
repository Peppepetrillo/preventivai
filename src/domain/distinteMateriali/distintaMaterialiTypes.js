/**
 * Distinta Materiali — tipi e typedef (Sprint 13 Step 3).
 */

/**
 * @typedef {Object} DistintaCollegamenti
 * @property {string=} preventivoId
 * @property {string=} cantiereId
 * @property {string=} listaSpesaSyncAt
 */

/**
 * @typedef {Object} VoceDistintaMateriali
 * @property {string} id
 * @property {string=} famigliaId
 * @property {string=} varianteId
 * @property {string} nome — snapshot display (sempre presente)
 * @property {string} unita — snapshot unità (sempre presente)
 * @property {number} quantita
 * @property {number=} prezzoUnitario
 * @property {string=} note
 */

/**
 * @typedef {Object} DistintaMateriali
 * @property {string} id
 * @property {string} titolo
 * @property {string=} clienteId
 * @property {string=} clienteNome
 * @property {VoceDistintaMateriali[]} voci
 * @property {DistintaCollegamenti} collegamenti
 * @property {string=} note
 * @property {string} createdAt
 * @property {string} updatedAt
 */

export const DISTINTA_STORAGE_KEY = "preventivai.distinteMateriali";
