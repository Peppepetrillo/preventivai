/**
 * Domain Distinta Materiali — funzioni pure.
 * Entità autonoma: nessun ownership su preventivo/cantiere/lista spesa.
 */

import { creaRiferimentoMateriale } from "../catalogoMateriali/materialiCatalogDomain";
import {
  isUnitaCanonica,
  normalizzaUnitaMateriale,
} from "../catalogoMateriali/materialiTypes";

function oraIso() {
  return new Date().toISOString();
}

function idCasuale(prefisso) {
  return `${prefisso}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * @param {unknown} valore
 * @param {number} [fallback=1]
 * @returns {number}
 */
export function normalizzaQuantita(valore, fallback = 1) {
  const n = Number(valore);
  if (!Number.isFinite(n) || n <= 0) {
    const fb = Number(fallback);
    return Number.isFinite(fb) && fb > 0 ? fb : 1;
  }
  return n;
}

/**
 * @param {object=} grezzo
 * @returns {import("./distintaMaterialiTypes").DistintaCollegamenti}
 */
export function normalizzaCollegamenti(grezzo = {}) {
  const base =
    grezzo && typeof grezzo === "object" && !Array.isArray(grezzo)
      ? grezzo
      : {};

  /** @type {import("./distintaMaterialiTypes").DistintaCollegamenti} */
  const out = {};
  const preventivoId = String(base.preventivoId || "").trim();
  const cantiereId = String(base.cantiereId || "").trim();
  const listaSpesaSyncAt = String(base.listaSpesaSyncAt || "").trim();

  if (preventivoId) out.preventivoId = preventivoId;
  if (cantiereId) out.cantiereId = cantiereId;
  if (listaSpesaSyncAt) out.listaSpesaSyncAt = listaSpesaSyncAt;
  return out;
}

/**
 * Normalizza una voce: nome + unita sempre snapshot.
 * @param {object=} grezzo
 * @param {ReadonlyArray<object>=} catalogo
 * @returns {import("./distintaMaterialiTypes").VoceDistintaMateriali|null}
 */
export function normalizzaVoceDistinta(grezzo = {}, catalogo) {
  if (!grezzo || typeof grezzo !== "object") return null;

  const famigliaId = String(grezzo.famigliaId || "").trim();
  const varianteId = String(grezzo.varianteId || "").trim();
  const nomeGrezzo = String(grezzo.nome || "").trim();
  const unitaGrezza = String(grezzo.unita || "").trim();

  let nome = nomeGrezzo;
  let unita = unitaGrezza ? normalizzaUnitaMateriale(unitaGrezza) : "";
  let famigliaRisolta = famigliaId;
  let varianteRisolta = varianteId;

  // Se ci sono id catalogo e manca snapshot, prova a risolverli.
  if ((!nome || !unita) && (famigliaId || varianteId) && catalogo) {
    const rif = creaRiferimentoMateriale(
      {
        famigliaId: famigliaId || undefined,
        varianteId: varianteId || undefined,
        nome: nomeGrezzo || undefined,
        unita: unitaGrezza || undefined,
        quantita: grezzo.quantita,
      },
      catalogo
    );
    if (rif) {
      nome = nome || rif.nome;
      unita = unita || rif.unita;
      if (rif.famigliaId) famigliaRisolta = rif.famigliaId;
      if (rif.varianteId) varianteRisolta = rif.varianteId;
    }
  }

  if (!nome) return null;
  if (!unita) unita = "pz";
  else unita = normalizzaUnitaMateriale(unita);

  /** @type {import("./distintaMaterialiTypes").VoceDistintaMateriali} */
  const voce = {
    id: String(grezzo.id || "").trim() || idCasuale("voce"),
    nome,
    unita: String(unita),
    quantita: normalizzaQuantita(grezzo.quantita, 1),
  };

  if (famigliaRisolta) voce.famigliaId = famigliaRisolta;
  if (varianteRisolta) voce.varianteId = varianteRisolta;

  if (grezzo.prezzoUnitario != null && grezzo.prezzoUnitario !== "") {
    const prezzo = Number(grezzo.prezzoUnitario);
    if (Number.isFinite(prezzo) && prezzo >= 0) {
      voce.prezzoUnitario = prezzo;
    }
  }

  const note = String(grezzo.note || "").trim();
  if (note) voce.note = note;

  return voce;
}

/**
 * @param {object=} grezzo
 * @param {ReadonlyArray<object>=} catalogo
 * @returns {import("./distintaMaterialiTypes").DistintaMateriali|null}
 */
export function normalizzaDistinta(grezzo = {}, catalogo) {
  if (!grezzo || typeof grezzo !== "object") return null;

  const titolo = String(grezzo.titolo || "").trim();
  if (!titolo) return null;

  const now = oraIso();
  const vociGrezze = Array.isArray(grezzo.voci) ? grezzo.voci : [];
  /** @type {Map<string, import("./distintaMaterialiTypes").VoceDistintaMateriali>} */
  const vociById = new Map();
  for (const grezzoVoce of vociGrezze) {
    const voce = normalizzaVoceDistinta(grezzoVoce, catalogo);
    if (!voce) continue;
    if (vociById.has(voce.id)) continue;
    vociById.set(voce.id, voce);
  }

  /** @type {import("./distintaMaterialiTypes").DistintaMateriali} */
  const distinta = {
    id: String(grezzo.id || "").trim() || idCasuale("distinta"),
    titolo,
    voci: [...vociById.values()],
    collegamenti: normalizzaCollegamenti(grezzo.collegamenti),
    createdAt: String(grezzo.createdAt || now),
    updatedAt: String(grezzo.updatedAt || now),
  };

  const clienteId = String(grezzo.clienteId || "").trim();
  const clienteNome = String(grezzo.clienteNome || "").trim();
  const note = String(grezzo.note || "").trim();
  if (clienteId) distinta.clienteId = clienteId;
  if (clienteNome) distinta.clienteNome = clienteNome;
  if (note) distinta.note = note;

  return distinta;
}

/**
 * @param {unknown} elenco
 * @param {ReadonlyArray<object>=} catalogo
 * @returns {import("./distintaMaterialiTypes").DistintaMateriali[]}
 */
export function normalizzaElencoDistinte(elenco, catalogo) {
  if (!Array.isArray(elenco)) return [];
  /** @type {Map<string, import("./distintaMaterialiTypes").DistintaMateriali>} */
  const byId = new Map();
  for (const grezzo of elenco) {
    const distinta = normalizzaDistinta(grezzo, catalogo);
    if (!distinta) continue;
    if (byId.has(distinta.id)) continue;
    byId.set(distinta.id, distinta);
  }
  return [...byId.values()];
}

/**
 * @param {object=} input
 * @returns {import("./distintaMaterialiTypes").DistintaMateriali|null}
 */
export function creaDistinta(input = {}) {
  const now = oraIso();
  return normalizzaDistinta({
    id: input.id || idCasuale("distinta"),
    titolo: input.titolo,
    clienteId: input.clienteId,
    clienteNome: input.clienteNome,
    voci: Array.isArray(input.voci) ? input.voci : [],
    collegamenti: input.collegamenti || {},
    note: input.note,
    createdAt: now,
    updatedAt: now,
  });
}

/**
 * @param {import("./distintaMaterialiTypes").DistintaMateriali} distinta
 * @param {object} patch
 * @returns {import("./distintaMaterialiTypes").DistintaMateriali|null}
 */
export function aggiornaDistinta(distinta, patch = {}) {
  if (!distinta || typeof distinta !== "object") return null;
  return normalizzaDistinta({
    ...distinta,
    ...patch,
    id: distinta.id,
    createdAt: distinta.createdAt,
    updatedAt: oraIso(),
    voci: patch.voci != null ? patch.voci : distinta.voci,
    collegamenti:
      patch.collegamenti != null ? patch.collegamenti : distinta.collegamenti,
  });
}

/**
 * Aggiunge una voce (catalogo o libera). Snapshot nome/unità obbligatori.
 * @param {import("./distintaMaterialiTypes").DistintaMateriali} distinta
 * @param {object} inputVoce
 * @param {ReadonlyArray<object>=} catalogo
 */
export function aggiungiVoce(distinta, inputVoce = {}, catalogo) {
  if (!distinta) return null;

  let payload = { ...inputVoce };

  // Da catalogo: risolvi snapshot se mancante.
  if (
    catalogo &&
    (payload.varianteId || payload.famigliaId) &&
    (!payload.nome || !payload.unita)
  ) {
    const rif = creaRiferimentoMateriale(
      {
        famigliaId: payload.famigliaId,
        varianteId: payload.varianteId,
        nome: payload.nome,
        unita: payload.unita,
        quantita: payload.quantita,
        prezzoUnitario: payload.prezzoUnitario,
        note: payload.note,
      },
      catalogo
    );
    if (!rif) return null;
    payload = {
      ...payload,
      famigliaId: rif.famigliaId || payload.famigliaId,
      varianteId: rif.varianteId || payload.varianteId,
      nome: payload.nome || rif.nome,
      unita: payload.unita || rif.unita,
      quantita: payload.quantita ?? rif.quantita,
      prezzoUnitario:
        payload.prezzoUnitario != null
          ? payload.prezzoUnitario
          : rif.prezzoUnitario,
    };
  }

  const voce = normalizzaVoceDistinta(
    {
      ...payload,
      id: payload.id || idCasuale("voce"),
    },
    catalogo
  );
  if (!voce) return null;

  return aggiornaDistinta(distinta, {
    voci: [...(distinta.voci || []), voce],
  });
}

/**
 * @param {import("./distintaMaterialiTypes").DistintaMateriali} distinta
 * @param {string} voceId
 * @param {object} patch
 * @param {ReadonlyArray<object>=} catalogo
 */
export function modificaVoce(distinta, voceId, patch = {}, catalogo) {
  if (!distinta) return null;
  const id = String(voceId);
  const idx = (distinta.voci || []).findIndex((v) => v.id === id);
  if (idx < 0) return null;

  const corrente = distinta.voci[idx];
  const aggiornata = normalizzaVoceDistinta(
    {
      ...corrente,
      ...patch,
      id: corrente.id,
      // Snapshot: se patch non passa nome/unita, restano quelli esistenti.
      nome: patch.nome != null ? patch.nome : corrente.nome,
      unita: patch.unita != null ? patch.unita : corrente.unita,
    },
    catalogo
  );
  if (!aggiornata) return null;

  const voci = distinta.voci.map((v, i) => (i === idx ? aggiornata : v));
  return aggiornaDistinta(distinta, { voci });
}

/**
 * @param {import("./distintaMaterialiTypes").DistintaMateriali} distinta
 * @param {string} voceId
 */
export function rimuoviVoce(distinta, voceId) {
  if (!distinta) return null;
  const id = String(voceId);
  const voci = (distinta.voci || []).filter((v) => v.id !== id);
  if (voci.length === (distinta.voci || []).length) return null;
  return aggiornaDistinta(distinta, { voci });
}

/**
 * @param {import("./distintaMaterialiTypes").DistintaMateriali} distinta
 * @param {{ titolo?: string }=} opzioni
 */
export function duplicaDistinta(distinta, opzioni = {}) {
  if (!distinta) return null;
  const now = oraIso();
  const titoloBase = String(opzioni.titolo || `${distinta.titolo} (copia)`).trim();

  return normalizzaDistinta({
    id: idCasuale("distinta"),
    titolo: titoloBase,
    clienteId: distinta.clienteId,
    clienteNome: distinta.clienteNome,
    note: distinta.note,
    // Soft link NON copiati: la copia è autonoma.
    collegamenti: {},
    voci: (distinta.voci || []).map((voce) => ({
      ...voce,
      id: idCasuale("voce"),
    })),
    createdAt: now,
    updatedAt: now,
  });
}

/**
 * @param {import("./distintaMaterialiTypes").DistintaMateriali} distinta
 * @param {string} preventivoId
 */
export function collegaPreventivo(distinta, preventivoId) {
  const id = String(preventivoId || "").trim();
  if (!distinta || !id) return null;
  return aggiornaDistinta(distinta, {
    collegamenti: {
      ...normalizzaCollegamenti(distinta.collegamenti),
      preventivoId: id,
    },
  });
}

/**
 * @param {import("./distintaMaterialiTypes").DistintaMateriali} distinta
 */
export function scollegaPreventivo(distinta) {
  if (!distinta) return null;
  const collegamenti = { ...normalizzaCollegamenti(distinta.collegamenti) };
  delete collegamenti.preventivoId;
  return aggiornaDistinta(distinta, { collegamenti });
}

/**
 * @param {import("./distintaMaterialiTypes").DistintaMateriali} distinta
 * @param {string} cantiereId
 */
export function collegaCantiere(distinta, cantiereId) {
  const id = String(cantiereId || "").trim();
  if (!distinta || !id) return null;
  return aggiornaDistinta(distinta, {
    collegamenti: {
      ...normalizzaCollegamenti(distinta.collegamenti),
      cantiereId: id,
    },
  });
}

/**
 * @param {import("./distintaMaterialiTypes").DistintaMateriali} distinta
 */
export function scollegaCantiere(distinta) {
  if (!distinta) return null;
  const collegamenti = { ...normalizzaCollegamenti(distinta.collegamenti) };
  delete collegamenti.cantiereId;
  return aggiornaDistinta(distinta, { collegamenti });
}

/**
 * Totale economico se prezzo presente; altrimenti somma quantità.
 * @param {import("./distintaMaterialiTypes").DistintaMateriali|null|undefined} distinta
 * @returns {{ voci: number, quantitaTotale: number, importoTotale: number|null, haPrezzi: boolean }}
 */
export function calcolaTotaleMateriali(distinta) {
  const voci = Array.isArray(distinta?.voci) ? distinta.voci : [];
  let quantitaTotale = 0;
  let importoTotale = 0;
  let haPrezzi = false;

  for (const voce of voci) {
    const q = normalizzaQuantita(voce.quantita, 0);
    quantitaTotale += q;
    if (voce.prezzoUnitario != null && Number.isFinite(Number(voce.prezzoUnitario))) {
      haPrezzi = true;
      importoTotale += q * Number(voce.prezzoUnitario);
    }
  }

  return {
    voci: voci.length,
    quantitaTotale,
    importoTotale: haPrezzi ? importoTotale : null,
    haPrezzi,
  };
}

/**
 * @param {import("./distintaMaterialiTypes").DistintaMateriali|null|undefined} distinta
 * @returns {{ ok: boolean, errori: string[] }}
 */
export function validaDistinta(distinta) {
  /** @type {string[]} */
  const errori = [];
  if (!distinta || typeof distinta !== "object") {
    return { ok: false, errori: ["distinta assente"] };
  }

  if (!String(distinta.id || "").trim()) errori.push("id obbligatorio");
  if (!String(distinta.titolo || "").trim()) errori.push("titolo obbligatorio");
  if (!Array.isArray(distinta.voci)) errori.push("voci non valide");

  const ids = new Set();
  for (const voce of distinta.voci || []) {
    if (!voce?.id) {
      errori.push("voce senza id");
      continue;
    }
    if (ids.has(voce.id)) errori.push(`voce duplicata: ${voce.id}`);
    ids.add(voce.id);

    if (!String(voce.nome || "").trim()) {
      errori.push(`nome snapshot mancante su ${voce.id}`);
    }
    if (!String(voce.unita || "").trim()) {
      errori.push(`unita snapshot mancante su ${voce.id}`);
    } else if (!isUnitaCanonica(normalizzaUnitaMateriale(voce.unita))) {
      // Dopo normalizzazione deve essere canonica (alias ok).
      const n = normalizzaUnitaMateriale(voce.unita);
      if (!isUnitaCanonica(n)) {
        errori.push(`unita non canonica su ${voce.id}`);
      }
    }

    const q = Number(voce.quantita);
    if (!Number.isFinite(q) || q <= 0) {
      errori.push(`quantita non valida su ${voce.id}`);
    }

    if (voce.prezzoUnitario != null) {
      const p = Number(voce.prezzoUnitario);
      if (!Number.isFinite(p) || p < 0) {
        errori.push(`prezzoUnitario non valido su ${voce.id}`);
      }
    }
  }

  return { ok: errori.length === 0, errori };
}
