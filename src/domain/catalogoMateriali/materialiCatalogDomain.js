/**
 * Domain Catalogo Materiali — indici, lookup, riferimenti, controlli seed.
 * Step 1: helper puri. Step 2: anche normalizzazione / CRUD in memoria.
 */

import { CATALOGO_MATERIALI_SEED } from "./materialiCatalogoSeed";
import {
  CATEGORIA_MATERIALE,
  isCategoriaMateriale,
  isUnitaCanonica,
  normalizzaAccessoriSuggeriti,
  normalizzaUnitaMateriale,
  UNITA_MATERIALE,
} from "./materialiTypes";

function oraIso() {
  return new Date().toISOString();
}

function idCasuale(prefisso) {
  return `${prefisso}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function slugDaTesto(testo = "") {
  return String(testo)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/×/g, "x")
    .replace(/[²°]/g, "")
    .replace(/[øØ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

/**
 * Copia profonda serializzabile del seed (rompe Object.freeze).
 * @returns {import("./materialiTypes").FamigliaMateriale[]}
 */
export function clonaSeedCatalogoMateriali() {
  return JSON.parse(JSON.stringify(CATALOGO_MATERIALI_SEED));
}

/**
 * @param {object=} grezzo
 * @returns {import("./materialiTypes").VarianteMateriale|null}
 */
export function normalizzaVarianteMateriale(grezzo = {}, famigliaId = "") {
  if (!grezzo || typeof grezzo !== "object") return null;
  const id = String(grezzo.id || "").trim();
  const etichetta = String(grezzo.etichetta || "").trim();
  if (!id || !etichetta) return null;

  const famiglia = String(grezzo.famigliaId || famigliaId || "").trim();
  if (!famiglia) return null;

  /** @type {Record<string, string|number>} */
  const attributi = {};
  if (grezzo.attributi && typeof grezzo.attributi === "object") {
    for (const [k, v] of Object.entries(grezzo.attributi)) {
      if (v == null) continue;
      attributi[String(k)] =
        typeof v === "number" && Number.isFinite(v) ? v : String(v);
    }
  }

  /** @type {import("./materialiTypes").VarianteMateriale} */
  const variante = {
    id,
    famigliaId: famiglia,
    etichetta,
    attributi,
    attiva: grezzo.attiva !== false,
  };

  if (grezzo.unita != null && String(grezzo.unita).trim()) {
    variante.unita = /** @type {any} */ (
      normalizzaUnitaMateriale(String(grezzo.unita))
    );
  }

  if (grezzo.prezzoIndicativo != null && grezzo.prezzoIndicativo !== "") {
    const prezzo = Number(grezzo.prezzoIndicativo);
    if (Number.isFinite(prezzo) && prezzo >= 0) {
      variante.prezzoIndicativo = prezzo;
    }
  }

  const accessori = normalizzaAccessoriSuggeriti(grezzo.accessoriSuggeriti);
  if (accessori.length > 0) {
    variante.accessoriSuggeriti = accessori;
  }

  return variante;
}

/**
 * @param {object=} grezzo
 * @returns {import("./materialiTypes").FamigliaMateriale|null}
 */
export function normalizzaFamigliaMateriale(grezzo = {}) {
  if (!grezzo || typeof grezzo !== "object") return null;

  const id = String(grezzo.id || "").trim();
  const nome = String(grezzo.nome || "").trim();
  if (!id || !nome) return null;

  const categoriaGrezza = String(grezzo.categoria || "").trim();
  const categoria = isCategoriaMateriale(categoriaGrezza)
    ? categoriaGrezza
    : CATEGORIA_MATERIALE.GENERALE;

  const unitaDefault = /** @type {any} */ (
    isUnitaCanonica(normalizzaUnitaMateriale(grezzo.unitaDefault))
      ? normalizzaUnitaMateriale(grezzo.unitaDefault)
      : UNITA_MATERIALE.PZ
  );

  const attributoChiave =
    String(grezzo.attributoChiave || "tipo").trim() || "tipo";

  const variantiGrezze = Array.isArray(grezzo.varianti) ? grezzo.varianti : [];
  const varianti = variantiGrezze
    .map((v) => normalizzaVarianteMateriale(v, id))
    .filter(Boolean);

  /** @type {import("./materialiTypes").FamigliaMateriale} */
  const famiglia = {
    id,
    nome,
    categoria: /** @type {any} */ (categoria),
    unitaDefault,
    attributoChiave,
    varianti,
    attiva: grezzo.attiva !== false,
    personalizzata: Boolean(grezzo.personalizzata),
  };

  const descrizione = String(grezzo.descrizione || "").trim();
  if (descrizione) famiglia.descrizione = descrizione;
  if (grezzo.createdAt) famiglia.createdAt = String(grezzo.createdAt);
  if (grezzo.updatedAt) famiglia.updatedAt = String(grezzo.updatedAt);

  const accessori = normalizzaAccessoriSuggeriti(grezzo.accessoriSuggeriti);
  if (accessori.length > 0) {
    famiglia.accessoriSuggeriti = accessori;
  }

  return famiglia;
}

/**
 * @param {unknown} elenco
 * @returns {import("./materialiTypes").FamigliaMateriale[]}
 */
export function normalizzaCatalogoMateriali(elenco) {
  if (!Array.isArray(elenco)) return [];
  /** @type {Map<string, import("./materialiTypes").FamigliaMateriale>} */
  const byId = new Map();
  for (const grezzo of elenco) {
    const famiglia = normalizzaFamigliaMateriale(grezzo);
    if (!famiglia) continue;
    if (byId.has(famiglia.id)) continue;
    byId.set(famiglia.id, famiglia);
  }
  return [...byId.values()];
}

/**
 * @param {unknown} elenco
 * @returns {boolean}
 */
export function isCatalogoMaterialiPopolato(elenco) {
  return Array.isArray(elenco) && elenco.length > 0;
}

/** @type {ReadonlyMap<string, import("./materialiTypes").FamigliaMateriale>} */
export const FAMIGLIE_BY_ID = Object.freeze(
  new Map(CATALOGO_MATERIALI_SEED.map((f) => [f.id, f]))
);

/** @type {ReadonlyMap<string, import("./materialiTypes").VarianteMateriale>} */
export const VARIANTI_BY_ID = (() => {
  /** @type {Map<string, import("./materialiTypes").VarianteMateriale>} */
  const map = new Map();
  for (const famiglia of CATALOGO_MATERIALI_SEED) {
    for (const variante of famiglia.varianti) {
      map.set(variante.id, variante);
    }
  }
  return Object.freeze(map);
})();

/**
 * @returns {ReadonlyArray<import("./materialiTypes").FamigliaMateriale>}
 */
export function elencaFamiglieMateriali() {
  return CATALOGO_MATERIALI_SEED;
}

/**
 * @param {string} id
 * @returns {import("./materialiTypes").FamigliaMateriale|null}
 */
export function trovaFamigliaMateriale(id) {
  if (!id) return null;
  return FAMIGLIE_BY_ID.get(String(id).trim()) || null;
}

/**
 * @param {string} id
 * @returns {import("./materialiTypes").VarianteMateriale|null}
 */
export function trovaVarianteMateriale(id) {
  if (!id) return null;
  return VARIANTI_BY_ID.get(String(id).trim()) || null;
}

/**
 * @param {string} id
 * @returns {boolean}
 */
export function isFamigliaMaterialeId(id) {
  return Boolean(trovaFamigliaMateriale(id));
}

/**
 * @param {string} id
 * @returns {boolean}
 */
export function isVarianteMaterialeId(id) {
  return Boolean(trovaVarianteMateriale(id));
}

/**
 * @param {ReadonlyArray<import("./materialiTypes").FamigliaMateriale>=} catalogo
 * @param {string=} categoria
 */
export function elencaFamigliePerCategoria(
  catalogo = CATALOGO_MATERIALI_SEED,
  categoria
) {
  const elenco = Array.isArray(catalogo) ? catalogo : CATALOGO_MATERIALI_SEED;
  if (!categoria) return elenco;
  const chiave = String(categoria).trim();
  return elenco.filter((f) => f.categoria === chiave);
}

/**
 * @param {ReadonlyArray<import("./materialiTypes").FamigliaMateriale>} catalogo
 * @param {string} query
 */
export function cercaFamiglieMateriali(catalogo = [], query = "") {
  const base = normalizzaCatalogoMateriali(catalogo);
  const q = String(query || "")
    .trim()
    .toLowerCase();
  if (!q) return base;

  return base.filter((famiglia) => {
    const blob = [
      famiglia.nome,
      famiglia.categoria,
      famiglia.descrizione,
      famiglia.attributoChiave,
      ...famiglia.varianti.map((v) => `${v.etichetta} ${v.id}`),
    ]
      .join(" ")
      .toLowerCase();
    return blob.includes(q);
  });
}

/**
 * @param {import("./materialiTypes").FamigliaMateriale|null|undefined} famiglia
 * @param {import("./materialiTypes").VarianteMateriale|null|undefined} variante
 * @param {string=} fallback
 */
export function nomeMaterialeDaCatalogo(famiglia, variante, fallback = "") {
  if (famiglia && variante) {
    return `${famiglia.nome} — ${variante.etichetta}`;
  }
  if (famiglia) return famiglia.nome;
  if (variante) return variante.etichetta;
  return String(fallback || "").trim();
}

/**
 * @param {Partial<import("./materialiTypes").RiferimentoMateriale> & object} input
 * @param {ReadonlyArray<import("./materialiTypes").FamigliaMateriale>=} catalogo
 * @returns {import("./materialiTypes").RiferimentoMateriale|null}
 */
export function creaRiferimentoMateriale(
  input = {},
  catalogo = CATALOGO_MATERIALI_SEED
) {
  if (!input || typeof input !== "object") return null;

  const elenco = normalizzaCatalogoMateriali(catalogo);
  const byFamiglia = new Map(elenco.map((f) => [f.id, f]));
  /** @type {Map<string, import("./materialiTypes").VarianteMateriale>} */
  const byVariante = new Map();
  for (const f of elenco) {
    for (const v of f.varianti) byVariante.set(v.id, v);
  }

  const varianteId = input.varianteId ? String(input.varianteId).trim() : "";
  const famigliaIdInput = input.famigliaId
    ? String(input.famigliaId).trim()
    : "";

  const variante = varianteId ? byVariante.get(varianteId) || null : null;
  const famigliaId = famigliaIdInput || variante?.famigliaId || "";
  const famiglia = famigliaId ? byFamiglia.get(famigliaId) || null : null;

  if (varianteId && !variante) return null;
  if (famigliaIdInput && !famiglia) return null;
  if (variante && famiglia && variante.famigliaId !== famiglia.id) return null;

  const nomeGrezzo = String(input.nome || "").trim();
  const nome =
    nomeGrezzo || nomeMaterialeDaCatalogo(famiglia, variante) || "";
  if (!nome) return null;

  const quantitaRaw = Number(input.quantita);
  const quantita =
    Number.isFinite(quantitaRaw) && quantitaRaw > 0 ? quantitaRaw : 1;

  const unitaSorgente =
    input.unita ||
    variante?.unita ||
    famiglia?.unitaDefault ||
    UNITA_MATERIALE.PZ;
  const unita = normalizzaUnitaMateriale(unitaSorgente);

  /** @type {import("./materialiTypes").RiferimentoMateriale} */
  const riferimento = { nome, unita, quantita };

  if (famiglia) riferimento.famigliaId = famiglia.id;
  if (variante) riferimento.varianteId = variante.id;

  if (input.prezzoUnitario != null && input.prezzoUnitario !== "") {
    const prezzo = Number(input.prezzoUnitario);
    if (Number.isFinite(prezzo) && prezzo >= 0) {
      riferimento.prezzoUnitario = prezzo;
    }
  }

  const note = String(input.note || "").trim();
  if (note) riferimento.note = note;

  return riferimento;
}

/**
 * @param {import("./materialiTypes").RiferimentoMateriale|null|undefined} riferimento
 * @param {ReadonlyArray<import("./materialiTypes").FamigliaMateriale>=} catalogo
 */
export function validaRiferimentoMateriale(
  riferimento,
  catalogo = CATALOGO_MATERIALI_SEED
) {
  /** @type {string[]} */
  const errori = [];
  if (!riferimento || typeof riferimento !== "object") {
    return { ok: false, errori: ["riferimento assente"] };
  }

  if (!String(riferimento.nome || "").trim()) {
    errori.push("nome obbligatorio");
  }

  const quantita = Number(riferimento.quantita);
  if (!Number.isFinite(quantita) || quantita <= 0) {
    errori.push("quantita non valida");
  }

  const unita = String(riferimento.unita || "").trim();
  if (!unita) {
    errori.push("unita obbligatoria");
  } else {
    const normalizzata = normalizzaUnitaMateriale(unita);
    if (!isUnitaCanonica(normalizzata)) {
      errori.push("unita non canonica");
    }
  }

  const elenco = normalizzaCatalogoMateriali(catalogo);
  const famiglie = new Set(elenco.map((f) => f.id));
  /** @type {Map<string, string>} */
  const varianteToFamiglia = new Map();
  for (const f of elenco) {
    for (const v of f.varianti) varianteToFamiglia.set(v.id, f.id);
  }

  if (riferimento.famigliaId && !famiglie.has(riferimento.famigliaId)) {
    errori.push("famigliaId sconosciuto");
  }

  if (riferimento.varianteId && !varianteToFamiglia.has(riferimento.varianteId)) {
    errori.push("varianteId sconosciuto");
  }

  if (riferimento.famigliaId && riferimento.varianteId) {
    const fid = varianteToFamiglia.get(riferimento.varianteId);
    if (fid && fid !== riferimento.famigliaId) {
      errori.push("variante non appartiene alla famiglia");
    }
  }

  if (riferimento.prezzoUnitario != null) {
    const prezzo = Number(riferimento.prezzoUnitario);
    if (!Number.isFinite(prezzo) || prezzo < 0) {
      errori.push("prezzoUnitario non valido");
    }
  }

  return { ok: errori.length === 0, errori };
}

/**
 * @param {ReadonlyArray<import("./materialiTypes").FamigliaMateriale>=} seed
 */
export function analizzaIntegritaSeed(seed = CATALOGO_MATERIALI_SEED) {
  /** @type {string[]} */
  const errori = [];
  /** @type {Set<string>} */
  const famiglieViste = new Set();
  /** @type {Set<string>} */
  const variantiViste = new Set();
  /** @type {Map<string, string>} */
  const varianteAFamiglia = new Map();
  /** @type {Record<string, number>} */
  const categorie = {};
  let totaleVarianti = 0;

  for (const famiglia of seed) {
    if (!famiglia?.id) {
      errori.push("famiglia senza id");
      continue;
    }
    if (famiglieViste.has(famiglia.id)) {
      errori.push(`famiglia duplicata: ${famiglia.id}`);
    }
    famiglieViste.add(famiglia.id);

    if (!String(famiglia.nome || "").trim()) {
      errori.push(`famiglia senza nome: ${famiglia.id}`);
    }
    if (!isCategoriaMateriale(famiglia.categoria)) {
      errori.push(`categoria non valida su ${famiglia.id}: ${famiglia.categoria}`);
    } else {
      categorie[famiglia.categoria] = (categorie[famiglia.categoria] || 0) + 1;
    }
    if (!isUnitaCanonica(famiglia.unitaDefault)) {
      errori.push(
        `unitaDefault non canonica su ${famiglia.id}: ${famiglia.unitaDefault}`
      );
    }
    if (!String(famiglia.attributoChiave || "").trim()) {
      errori.push(`attributoChiave mancante su ${famiglia.id}`);
    }
    if (!Array.isArray(famiglia.varianti) || famiglia.varianti.length === 0) {
      errori.push(`famiglia senza varianti: ${famiglia.id}`);
      continue;
    }

    /** @type {Set<string>} */
    const etichette = new Set();
    for (const variante of famiglia.varianti) {
      totaleVarianti += 1;
      if (!variante?.id) {
        errori.push(`variante senza id in ${famiglia.id}`);
        continue;
      }
      if (variantiViste.has(variante.id)) {
        errori.push(`variante duplicata: ${variante.id}`);
      }
      variantiViste.add(variante.id);
      varianteAFamiglia.set(variante.id, famiglia.id);
      if (variante.famigliaId !== famiglia.id) {
        errori.push(
          `variante ${variante.id} ha famigliaId ${variante.famigliaId} ≠ ${famiglia.id}`
        );
      }
      if (!String(variante.etichetta || "").trim()) {
        errori.push(`variante senza etichetta: ${variante.id}`);
      }
      const etichettaKey = String(variante.etichetta || "")
        .trim()
        .toLowerCase();
      if (etichette.has(etichettaKey)) {
        errori.push(
          `etichetta duplicata in ${famiglia.id}: ${variante.etichetta}`
        );
      }
      etichette.add(etichettaKey);
      if (variante.unita != null && !isUnitaCanonica(variante.unita)) {
        errori.push(
          `unita non canonica su variante ${variante.id}: ${variante.unita}`
        );
      }
    }
  }

  for (const famiglia of seed) {
    if (!famiglia?.id) continue;

    for (const accessorio of famiglia.accessoriSuggeriti || []) {
      validaAccessorioNelSeed(
        accessorio,
        `famiglia ${famiglia.id}`,
        famiglieViste,
        variantiViste,
        varianteAFamiglia,
        errori
      );
    }

    for (const variante of famiglia.varianti || []) {
      if (!variante?.id) continue;
      for (const accessorio of variante.accessoriSuggeriti || []) {
        validaAccessorioNelSeed(
          accessorio,
          `variante ${variante.id}`,
          famiglieViste,
          variantiViste,
          varianteAFamiglia,
          errori
        );
      }
    }
  }

  return {
    ok: errori.length === 0,
    errori,
    stats: {
      famiglie: famiglieViste.size,
      varianti: totaleVarianti,
      categorie,
    },
  };
}

/**
 * @param {import("./materialiTypes").AccessorioSuggerito} accessorio
 * @param {string} contesto
 * @param {Set<string>} famiglieViste
 * @param {Set<string>} variantiViste
 * @param {Map<string, string>} varianteAFamiglia
 * @param {string[]} errori
 */
function validaAccessorioNelSeed(
  accessorio,
  contesto,
  famiglieViste,
  variantiViste,
  varianteAFamiglia,
  errori
) {
  if (accessorio.varianteId && !variantiViste.has(accessorio.varianteId)) {
    errori.push(
      `accessorio orfano su ${contesto}: varianteId ${accessorio.varianteId}`
    );
  }
  if (accessorio.famigliaId && !famiglieViste.has(accessorio.famigliaId)) {
    errori.push(
      `accessorio orfano su ${contesto}: famigliaId ${accessorio.famigliaId}`
    );
  }
  if (
    accessorio.varianteId &&
    accessorio.famigliaId &&
    varianteAFamiglia.has(accessorio.varianteId)
  ) {
    const famigliaAttesa = varianteAFamiglia.get(accessorio.varianteId);
    if (String(famigliaAttesa) !== String(accessorio.famigliaId)) {
      errori.push(
        `accessorio incoerente su ${contesto}: variante ${accessorio.varianteId} non appartiene a ${accessorio.famigliaId}`
      );
    }
  }
}

/**
 * Unisce accessori di famiglia + variante (variante vince sui duplicati).
 * Nessuna UI: helper per 6.1c futura.
 *
 * @param {string} varianteId
 * @param {import("./materialiTypes").FamigliaMateriale[]=} catalogo
 * @returns {import("./materialiTypes").AccessorioSuggerito[]}
 */
export function elencaAccessoriSuggeritiPerVariante(
  varianteId,
  catalogo = null
) {
  const id = String(varianteId || "").trim();
  if (!id) return [];

  let famiglia = null;
  let variante = null;

  if (Array.isArray(catalogo) && catalogo.length > 0) {
    const elenco = normalizzaCatalogoMateriali(catalogo);
    for (const f of elenco) {
      const v = f.varianti.find((item) => item.id === id);
      if (v) {
        famiglia = f;
        variante = v;
        break;
      }
    }
  } else {
    variante = trovaVarianteMateriale(id);
    famiglia = variante
      ? trovaFamigliaMateriale(variante.famigliaId)
      : null;
  }

  if (!variante) return [];

  const dallaFamiglia = normalizzaAccessoriSuggeriti(
    famiglia?.accessoriSuggeriti
  );
  const dallaVariante = normalizzaAccessoriSuggeriti(
    variante.accessoriSuggeriti
  );

  /** @type {Map<string, import("./materialiTypes").AccessorioSuggerito>} */
  const mappa = new Map();
  for (const accessorio of [...dallaFamiglia, ...dallaVariante]) {
    const chiave = `${accessorio.varianteId || ""}|${accessorio.famigliaId || ""}`;
    mappa.set(chiave, accessorio);
  }
  return [...mappa.values()];
}

export function contaCatalogoMaterialiSeed() {
  const report = analizzaIntegritaSeed();
  return {
    famiglie: report.stats.famiglie,
    varianti: report.stats.varianti,
  };
}

/**
 * Factory famiglia personalizzata (in memoria).
 * @param {object} input
 */
export function creaFamigliaPersonalizzata(input = {}) {
  const nome = String(input.nome || "").trim();
  if (!nome) return null;

  const now = oraIso();
  const slug = slugDaTesto(nome) || "materiale";
  const id = String(input.id || "").trim() || idCasuale(`custom-${slug}`);

  return normalizzaFamigliaMateriale({
    id,
    nome,
    categoria: input.categoria,
    unitaDefault: input.unitaDefault,
    attributoChiave: input.attributoChiave || "tipo",
    descrizione: input.descrizione,
    personalizzata: true,
    attiva: input.attiva !== false,
    varianti: Array.isArray(input.varianti) ? input.varianti : [],
    accessoriSuggeriti: input.accessoriSuggeriti,
    createdAt: now,
    updatedAt: now,
  });
}

/**
 * Factory variante (anche su famiglia seed: personalizzata a livello variante
 * non ha flag dedicato — la famiglia resta non personalizzata se era seed).
 * @param {string} famigliaId
 * @param {object} input
 */
export function creaVarianteMateriale(famigliaId, input = {}) {
  const etichetta = String(input.etichetta || "").trim();
  if (!etichetta || !famigliaId) return null;

  const slug = slugDaTesto(etichetta) || "var";
  const id = String(input.id || "").trim() || idCasuale(`${famigliaId}-${slug}`);

  return normalizzaVarianteMateriale(
    {
      id,
      famigliaId,
      etichetta,
      attributi: input.attributi || { [String(input.attributoChiave || "tipo")]: etichetta },
      unita: input.unita,
      prezzoIndicativo: input.prezzoIndicativo,
      attiva: input.attiva !== false,
      accessoriSuggeriti: input.accessoriSuggeriti,
    },
    famigliaId
  );
}

/**
 * @param {import("./materialiTypes").FamigliaMateriale[]} catalogo
 * @param {import("./materialiTypes").FamigliaMateriale} famiglia
 */
export function aggiungiFamigliaAlCatalogo(catalogo, famiglia) {
  const base = normalizzaCatalogoMateriali(catalogo);
  if (!famiglia) return base;
  if (base.some((f) => f.id === famiglia.id)) return base;
  return [...base, famiglia];
}

/**
 * @param {import("./materialiTypes").FamigliaMateriale[]} catalogo
 * @param {string} famigliaId
 * @param {object} patch
 */
export function aggiornaFamigliaNelCatalogo(catalogo, famigliaId, patch = {}) {
  return normalizzaCatalogoMateriali(catalogo).map((famiglia) => {
    if (famiglia.id !== String(famigliaId)) return famiglia;
    return (
      normalizzaFamigliaMateriale({
        ...famiglia,
        ...patch,
        id: famiglia.id,
        personalizzata: famiglia.personalizzata,
        varianti:
          patch.varianti != null ? patch.varianti : famiglia.varianti,
        updatedAt: oraIso(),
      }) || famiglia
    );
  });
}

/**
 * Soft-delete: disattiva. Hard delete solo se personalizzata.
 * @param {import("./materialiTypes").FamigliaMateriale[]} catalogo
 * @param {string} famigliaId
 * @param {{ hard?: boolean }=} opzioni
 */
export function rimuoviFamigliaDalCatalogo(
  catalogo,
  famigliaId,
  { hard = false } = {}
) {
  const base = normalizzaCatalogoMateriali(catalogo);
  const target = base.find((f) => f.id === String(famigliaId));
  if (!target) return base;

  if (hard && target.personalizzata) {
    return base.filter((f) => f.id !== target.id);
  }

  return aggiornaFamigliaNelCatalogo(base, famigliaId, { attiva: false });
}

/**
 * @param {import("./materialiTypes").FamigliaMateriale[]} catalogo
 * @param {string} famigliaId
 * @param {import("./materialiTypes").VarianteMateriale} variante
 */
export function aggiungiVarianteAllaFamiglia(catalogo, famigliaId, variante) {
  if (!variante) return normalizzaCatalogoMateriali(catalogo);
  return normalizzaCatalogoMateriali(catalogo).map((famiglia) => {
    if (famiglia.id !== String(famigliaId)) return famiglia;
    if (famiglia.varianti.some((v) => v.id === variante.id)) return famiglia;
    return {
      ...famiglia,
      varianti: [...famiglia.varianti, { ...variante, famigliaId: famiglia.id }],
      updatedAt: oraIso(),
    };
  });
}

/**
 * @param {import("./materialiTypes").FamigliaMateriale[]} catalogo
 * @param {string} famigliaId
 * @param {string} varianteId
 * @param {object} patch
 */
export function aggiornaVarianteNelCatalogo(
  catalogo,
  famigliaId,
  varianteId,
  patch = {}
) {
  return normalizzaCatalogoMateriali(catalogo).map((famiglia) => {
    if (famiglia.id !== String(famigliaId)) return famiglia;
    return {
      ...famiglia,
      updatedAt: oraIso(),
      varianti: famiglia.varianti.map((variante) => {
        if (variante.id !== String(varianteId)) return variante;
        return (
          normalizzaVarianteMateriale(
            { ...variante, ...patch, id: variante.id, famigliaId: famiglia.id },
            famiglia.id
          ) || variante
        );
      }),
    };
  });
}

/**
 * Soft: disattiva. Hard: rimuove solo se famiglia personalizzata o esplicitamente richiesto.
 * @param {import("./materialiTypes").FamigliaMateriale[]} catalogo
 * @param {string} famigliaId
 * @param {string} varianteId
 * @param {{ hard?: boolean }=} opzioni
 */
export function rimuoviVarianteDalCatalogo(
  catalogo,
  famigliaId,
  varianteId,
  { hard = false } = {}
) {
  const base = normalizzaCatalogoMateriali(catalogo);
  return base.map((famiglia) => {
    if (famiglia.id !== String(famigliaId)) return famiglia;
    if (hard) {
      return {
        ...famiglia,
        updatedAt: oraIso(),
        varianti: famiglia.varianti.filter((v) => v.id !== String(varianteId)),
      };
    }
    return {
      ...famiglia,
      updatedAt: oraIso(),
      varianti: famiglia.varianti.map((v) =>
        v.id === String(varianteId) ? { ...v, attiva: false } : v
      ),
    };
  });
}
