/**
 * Giornate manodopera sul cantiere — costo / pagato.
 * Source of truth: cantiere.giornateManodopera[]
 *
 * Distinto da:
 * - programmazione[] (previsto)
 * - registroGiornate[] (consuntivo attività)
 * - spese[] (uscite economia — NON auto-generate da qui)
 */

import {
  formattaDataGiornataLunga,
  parseDataProgrammazione,
} from "../cantieri/services/programmazioneCantiereService";
import { suggerisciCostoGiornata } from "./operaiDomain";

export const TIPI_GIORNATA_MANODOPERA = Object.freeze({
  giornata: "giornata",
  ore: "ore",
});

function nuovoId() {
  return `gm-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function numeroNonNegativo(n, fallback = 0) {
  const v = Number(String(n ?? "").replace(",", "."));
  if (!Number.isFinite(v) || v < 0) return fallback;
  return v;
}

/**
 * @param {unknown} grezzo
 * @param {string|number=} cantiereId
 * @returns {object|null}
 */
export function normalizzaGiornataManodopera(grezzo, cantiereId) {
  if (!grezzo || typeof grezzo !== "object") return null;
  const data = String(grezzo.data || "").trim();
  if (!data || !parseDataProgrammazione(data)) return null;
  const operaioId = String(grezzo.operaioId || "").trim();
  if (!operaioId) return null;

  const tipo =
    grezzo.tipo === TIPI_GIORNATA_MANODOPERA.ore
      ? TIPI_GIORNATA_MANODOPERA.ore
      : TIPI_GIORNATA_MANODOPERA.giornata;

  let ore = grezzo.ore == null || grezzo.ore === ""
    ? null
    : numeroNonNegativo(grezzo.ore, null);
  if (ore === null && tipo === TIPI_GIORNATA_MANODOPERA.giornata) {
    ore = 8;
  }
  if (tipo === TIPI_GIORNATA_MANODOPERA.ore && (ore == null || ore <= 0)) {
    return null;
  }

  const costo = numeroNonNegativo(grezzo.costo, NaN);
  if (!Number.isFinite(costo)) return null;

  const ora = new Date().toISOString();
  return {
    id: String(grezzo.id || "").trim() || nuovoId(),
    cantiereId: String(
      cantiereId != null && String(cantiereId)
        ? cantiereId
        : grezzo.cantiereId || ""
    ),
    operaioId,
    data,
    ore,
    tipo,
    costo,
    pagato: Boolean(grezzo.pagato),
    createdAt: grezzo.createdAt || ora,
    updatedAt: grezzo.updatedAt || ora,
  };
}

/**
 * @param {object|null} cantiere
 * @returns {object[]}
 */
export function leggiGiornateManodopera(cantiere) {
  if (!cantiere || typeof cantiere !== "object") return [];
  const grezze = Array.isArray(cantiere.giornateManodopera)
    ? cantiere.giornateManodopera
    : [];
  return grezze
    .map((voce) => normalizzaGiornataManodopera(voce, cantiere.id))
    .filter(Boolean)
    .sort(confrontaGiornateManodopera);
}

function confrontaGiornateManodopera(a, b) {
  const ta = parseDataProgrammazione(a?.data)?.getTime() ?? 0;
  const tb = parseDataProgrammazione(b?.data)?.getTime() ?? 0;
  if (ta !== tb) return tb - ta;
  return String(b?.id || "").localeCompare(String(a?.id || ""));
}

/**
 * @param {object} input
 * @param {object|null} operaio
 * @returns {{ ok: true, giornata: object }|{ ok: false, errore: string }}
 */
export function validaGiornataManodopera(input = {}, operaio = null) {
  const data = String(input.data || "").trim();
  if (!data || !parseDataProgrammazione(data)) {
    return { ok: false, errore: "Seleziona una data valida." };
  }
  const operaioId = String(input.operaioId || operaio?.id || "").trim();
  if (!operaioId) {
    return { ok: false, errore: "Seleziona un operaio." };
  }

  const tipo =
    input.tipo === TIPI_GIORNATA_MANODOPERA.ore
      ? TIPI_GIORNATA_MANODOPERA.ore
      : TIPI_GIORNATA_MANODOPERA.giornata;

  const oreGrezze =
    input.ore === "" || input.ore == null ? null : Number(String(input.ore).replace(",", "."));
  if (tipo === TIPI_GIORNATA_MANODOPERA.ore) {
    if (!Number.isFinite(oreGrezze) || oreGrezze <= 0) {
      return { ok: false, errore: "Indica le ore lavorate." };
    }
  }

  let costo;
  if (input.costo !== "" && input.costo != null) {
    costo = Number(String(input.costo).replace(",", "."));
    if (!Number.isFinite(costo) || costo < 0) {
      return { ok: false, errore: "Costo non valido." };
    }
  } else {
    const suggerito = suggerisciCostoGiornata(operaio, {
      tipo,
      ore: oreGrezze ?? (tipo === "giornata" ? 8 : undefined),
    });
    if (!suggerito.ok) return suggerito;
    costo = suggerito.costo;
  }

  const giornata = normalizzaGiornataManodopera(
    {
      id: input.id,
      cantiereId: input.cantiereId,
      operaioId,
      data,
      ore: oreGrezze,
      tipo,
      costo,
      pagato: Boolean(input.pagato),
      createdAt: input.createdAt,
      updatedAt: new Date().toISOString(),
    },
    input.cantiereId
  );

  if (!giornata) {
    return { ok: false, errore: "Dati giornata non validi." };
  }
  return { ok: true, giornata };
}

/**
 * @param {object} cantiere
 * @param {object} giornata
 */
export function aggiungiGiornataManodopera(cantiere, giornata) {
  const lista = leggiGiornateManodopera(cantiere);
  if (lista.some((voce) => String(voce.id) === String(giornata.id))) {
    return aggiornaGiornataManodopera(cantiere, giornata.id, giornata);
  }
  return {
    ...cantiere,
    giornateManodopera: [...lista, giornata],
  };
}

/**
 * @param {object} cantiere
 * @param {string|number} giornataId
 * @param {object} patch
 */
export function aggiornaGiornataManodopera(cantiere, giornataId, patch) {
  const lista = leggiGiornateManodopera(cantiere);
  let trovato = false;
  const giornateManodopera = lista.map((voce) => {
    if (String(voce.id) !== String(giornataId)) return voce;
    trovato = true;
    return {
      ...voce,
      ...patch,
      id: voce.id,
      cantiereId: voce.cantiereId || String(cantiere.id),
      createdAt: voce.createdAt,
      updatedAt: new Date().toISOString(),
    };
  });
  if (!trovato) return cantiere;
  return { ...cantiere, giornateManodopera };
}

/**
 * @param {object} cantiere
 * @param {string|number} giornataId
 */
export function eliminaGiornataManodopera(cantiere, giornataId) {
  const lista = leggiGiornateManodopera(cantiere).filter(
    (voce) => String(voce.id) !== String(giornataId)
  );
  return { ...cantiere, giornateManodopera: lista };
}

/**
 * Toggle pagato con protezione doppio tap (idempotente sul valore target).
 * @param {object} cantiere
 * @param {string|number} giornataId
 * @param {boolean} pagato
 */
export function impostaPagatoGiornataManodopera(cantiere, giornataId, pagato) {
  return aggiornaGiornataManodopera(cantiere, giornataId, {
    pagato: Boolean(pagato),
  });
}

/**
 * Riepilogo manodopera di un cantiere (non entra in spese/economia).
 * @param {object|null} cantiere
 */
export function riepilogoManodoperaCantiere(cantiere) {
  const lista = leggiGiornateManodopera(cantiere);
  let ore = 0;
  let costo = 0;
  let pagato = 0;
  let daPagare = 0;
  for (const g of lista) {
    ore += Number(g.ore) || 0;
    const c = Number(g.costo) || 0;
    costo += c;
    if (g.pagato) pagato += c;
    else daPagare += c;
  }
  return {
    giornate: lista.length,
    ore,
    costo,
    pagato,
    daPagare,
  };
}

/**
 * Raggruppa per data (etichetta lunga).
 * @param {object[]} giornate
 */
export function raggruppaGiornatePerData(giornate) {
  const mappa = new Map();
  for (const g of giornate || []) {
    const chiave = g.data;
    if (!mappa.has(chiave)) {
      mappa.set(chiave, {
        data: chiave,
        etichetta: formattaDataGiornataLunga(chiave),
        voci: [],
      });
    }
    mappa.get(chiave).voci.push(g);
  }
  return [...mappa.values()];
}

export { formattaDataGiornataLunga, parseDataProgrammazione };
