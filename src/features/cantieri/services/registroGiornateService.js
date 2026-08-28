/**
 * Registro giornate lavorative (UX-7.4) — consuntivo reale.
 * Source of truth: cantiere.registroGiornate[]
 * Distinto da programmazione[] (piano) e diario[] (event log).
 */

import {
  formattaDataGiornataLunga,
  parseDataProgrammazione,
} from "./programmazioneCantiereService";

/**
 * @param {unknown} n
 * @param {number} fallback
 */
function numeroNonNegativo(n, fallback = 0) {
  const v = Number(n);
  if (!Number.isFinite(v) || v < 0) return fallback;
  return v;
}

/**
 * @param {unknown} grezzo
 * @returns {string[]}
 */
export function normalizzaNomiOperai(grezzo) {
  if (Array.isArray(grezzo)) {
    return grezzo
      .map((n) => String(n || "").trim())
      .filter(Boolean);
  }
  const testo = String(grezzo || "").trim();
  if (!testo) return [];
  return testo
    .split(/[,+;/]| e /i)
    .map((n) => n.trim())
    .filter(Boolean);
}

/**
 * @param {string[]} operai
 */
export function formattaNomiOperai(operai = []) {
  const nomi = normalizzaNomiOperai(operai);
  if (nomi.length === 0) return "";
  if (nomi.length === 1) return nomi[0];
  if (nomi.length === 2) return `${nomi[0]} + ${nomi[1]}`;
  return `${nomi.slice(0, -1).join(", ")} + ${nomi[nomi.length - 1]}`;
}

/**
 * @returns {string}
 */
export function creaIdRegistroGiornata() {
  return `reg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * @param {unknown} grezzo
 * @param {string|number=} cantiereId
 * @returns {object|null}
 */
export function normalizzaGiornataLavorativa(grezzo, cantiereId) {
  if (!grezzo || typeof grezzo !== "object") return null;
  const data = String(grezzo.data || "").trim();
  if (!data) return null;

  const operai = normalizzaNomiOperai(grezzo.operai);
  const oreLavorate = numeroNonNegativo(grezzo.oreLavorate, 0);
  const attivita = String(grezzo.attivita || "").trim();
  const note = String(grezzo.note || "").trim();
  const id = String(grezzo.id || "").trim() || creaIdRegistroGiornata();

  /** @type {object} */
  const giornata = {
    id,
    data,
    operai,
    oreLavorate,
    attivita,
  };

  if (cantiereId != null && String(cantiereId)) {
    giornata.cantiereId = String(cantiereId);
  } else if (grezzo.cantiereId != null) {
    giornata.cantiereId = String(grezzo.cantiereId);
  }

  if (note) giornata.note = note;
  if (grezzo.giornataProgrammataId) {
    giornata.giornataProgrammataId = String(grezzo.giornataProgrammataId);
  }

  return giornata;
}

/**
 * @param {object} a
 * @param {object} b
 */
export function confrontaGiornateLavorative(a, b) {
  const ta = parseDataProgrammazione(a?.data)?.getTime() ?? 0;
  const tb = parseDataProgrammazione(b?.data)?.getTime() ?? 0;
  if (ta !== tb) return ta - tb;
  return String(a?.id || "").localeCompare(String(b?.id || ""));
}

/**
 * @param {object} cantiere
 * @returns {object[]}
 */
export function leggiRegistroGiornate(cantiere = {}) {
  const grezze = Array.isArray(cantiere.registroGiornate)
    ? cantiere.registroGiornate
    : [];
  return grezze
    .map((g) => normalizzaGiornataLavorativa(g, cantiere.id))
    .filter(Boolean)
    .sort(confrontaGiornateLavorative);
}

/**
 * @param {object} cantiere
 * @param {Date|string} giorno
 */
export function registroPerGiorno(cantiere, giorno) {
  const target = parseDataProgrammazione(giorno);
  if (!target) return [];
  const t = target.getTime();
  return leggiRegistroGiornate(cantiere).filter((g) => {
    const d = parseDataProgrammazione(g.data);
    return d && d.getTime() === t;
  });
}

/**
 * @param {object} cantiere
 * @param {object} input
 */
export function aggiungiGiornataLavorativa(cantiere, input = {}) {
  const giornata = normalizzaGiornataLavorativa(
    {
      ...input,
      id: input.id || creaIdRegistroGiornata(),
    },
    cantiere?.id
  );
  if (!giornata) {
    throw new Error("Giornata lavorativa non valida: data obbligatoria.");
  }
  const registroGiornate = [
    ...leggiRegistroGiornate(cantiere),
    giornata,
  ].sort(confrontaGiornateLavorative);
  return { ...cantiere, registroGiornate };
}

/**
 * @param {object} cantiere
 * @param {string} giornataId
 * @param {object} modifiche
 */
export function aggiornaGiornataLavorativa(cantiere, giornataId, modifiche = {}) {
  const id = String(giornataId || "");
  const registroGiornate = leggiRegistroGiornate(cantiere).map((g) => {
    if (String(g.id) !== id) return g;
    return (
      normalizzaGiornataLavorativa(
        { ...g, ...modifiche, id: g.id },
        cantiere?.id
      ) || g
    );
  });
  return {
    ...cantiere,
    registroGiornate: registroGiornate.sort(confrontaGiornateLavorative),
  };
}

/**
 * @param {object} cantiere
 * @param {string} giornataId
 */
export function eliminaGiornataLavorativa(cantiere, giornataId) {
  const id = String(giornataId || "");
  return {
    ...cantiere,
    registroGiornate: leggiRegistroGiornate(cantiere).filter(
      (g) => String(g.id) !== id
    ),
  };
}

/**
 * @param {object} cantiere
 */
export function riepilogoRegistroCantiere(cantiere = {}) {
  const giornate = leggiRegistroGiornate(cantiere);
  const totaleOre = giornate.reduce(
    (acc, g) => acc + (Number(g.oreLavorate) || 0),
    0
  );
  return {
    giornateLavorate: giornate.length,
    totaleOreLavorate: totaleOre,
  };
}

export { formattaDataGiornataLunga, parseDataProgrammazione };
