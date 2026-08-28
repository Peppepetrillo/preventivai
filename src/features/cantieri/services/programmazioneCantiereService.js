/**
 * Programmazione multi-giornata cantiere (UX-7.3).
 * Source of truth: cantiere.programmazione[]
 * Agenda = sola proiezione (nessun secondo store).
 */

export const STATI_GIORNATA = Object.freeze({
  programmata: "programmata",
  inCorso: "in-corso",
  completata: "completata",
  annullata: "annullata",
});

export const ETICHETTE_STATO_GIORNATA = Object.freeze({
  [STATI_GIORNATA.programmata]: "Programmata",
  [STATI_GIORNATA.inCorso]: "In corso",
  [STATI_GIORNATA.completata]: "Completata",
  [STATI_GIORNATA.annullata]: "Annullata",
});

/**
 * @param {string|undefined} stato
 * @returns {string}
 */
export function normalizzaStatoGiornata(stato) {
  const grezzo = String(stato || "")
    .trim()
    .toLowerCase();
  if (grezzo === STATI_GIORNATA.inCorso || grezzo === "in corso") {
    return STATI_GIORNATA.inCorso;
  }
  if (grezzo === STATI_GIORNATA.completata || grezzo === "completato") {
    return STATI_GIORNATA.completata;
  }
  if (grezzo === STATI_GIORNATA.annullata || grezzo === "rimandato") {
    return STATI_GIORNATA.annullata;
  }
  if (grezzo === "pianificato" || grezzo === "programmato") {
    return STATI_GIORNATA.programmata;
  }
  return STATI_GIORNATA.programmata;
}

/**
 * @param {string} stato
 */
export function etichettaStatoGiornata(stato) {
  const norm = normalizzaStatoGiornata(stato);
  return ETICHETTE_STATO_GIORNATA[norm] || ETICHETTE_STATO_GIORNATA.programmata;
}

/**
 * @param {string} stato
 */
export function classeBadgeStatoGiornata(stato) {
  const norm = normalizzaStatoGiornata(stato);
  if (norm === STATI_GIORNATA.completata) return "ds-badge ds-badge-completato";
  if (norm === STATI_GIORNATA.inCorso) return "ds-badge ds-badge-in-corso";
  if (norm === STATI_GIORNATA.annullata) return "ds-badge ds-badge-sospeso";
  return "ds-badge ds-badge-da-iniziare";
}

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
 * @returns {object|null}
 */
export function normalizzaGiornataProgrammata(grezzo) {
  if (!grezzo || typeof grezzo !== "object") return null;
  const data = String(grezzo.data || "").trim();
  if (!data) return null;

  const operai = Math.max(1, Math.round(numeroNonNegativo(grezzo.operai, 1)));
  const orePreviste = numeroNonNegativo(grezzo.orePreviste, 0);
  const attivita = String(grezzo.attivita || "").trim();
  const note = String(grezzo.note || "").trim();
  const stato = normalizzaStatoGiornata(grezzo.stato);
  const id = String(grezzo.id || "").trim() || creaIdGiornata();

  /** @type {object} */
  const giornata = {
    id,
    data,
    operai,
    orePreviste,
    attivita,
    stato,
  };
  if (note) giornata.note = note;
  if (grezzo.oraInizio) giornata.oraInizio = String(grezzo.oraInizio).trim();

  return giornata;
}

/**
 * @returns {string}
 */
export function creaIdGiornata() {
  return `prog-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Ore uomo derivate (non persistite).
 * @param {{ orePreviste?: number, operai?: number }} giornata
 */
export function calcolaOreUomo(giornata = {}) {
  const ore = numeroNonNegativo(giornata.orePreviste, 0);
  const operai = Math.max(1, Math.round(numeroNonNegativo(giornata.operai, 1)));
  return ore * operai;
}

/**
 * @param {object} cantiere
 * @returns {object[]}
 */
export function leggiProgrammazione(cantiere = {}) {
  const grezze = Array.isArray(cantiere.programmazione)
    ? cantiere.programmazione
    : [];
  return grezze
    .map(normalizzaGiornataProgrammata)
    .filter(Boolean)
    .sort(confrontaGiornatePerData);
}

/**
 * @param {object} a
 * @param {object} b
 */
export function confrontaGiornatePerData(a, b) {
  const ta = parseDataProgrammazione(a?.data)?.getTime() ?? 0;
  const tb = parseDataProgrammazione(b?.data)?.getTime() ?? 0;
  if (ta !== tb) return ta - tb;
  return String(a?.id || "").localeCompare(String(b?.id || ""));
}

/**
 * @param {string|null|undefined} grezzo
 * @returns {Date|null}
 */
export function parseDataProgrammazione(grezzo) {
  if (!grezzo) return null;
  if (grezzo instanceof Date && !Number.isNaN(grezzo.getTime())) {
    const d = new Date(grezzo);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  const testo = String(grezzo).trim();
  const matchIt = testo.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (matchIt) {
    const d = new Date(
      Number(matchIt[3]),
      Number(matchIt[2]) - 1,
      Number(matchIt[1])
    );
    if (Number.isNaN(d.getTime())) return null;
    d.setHours(0, 0, 0, 0);
    return d;
  }
  const iso = Date.parse(testo);
  if (!Number.isFinite(iso)) return null;
  const d = new Date(iso);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * @param {object} cantiere
 * @param {object} input
 * @returns {object} cantiere aggiornato
 */
export function aggiungiGiornataProgrammata(cantiere, input = {}) {
  const giornata = normalizzaGiornataProgrammata({
    ...input,
    id: input.id || creaIdGiornata(),
    stato: input.stato || STATI_GIORNATA.programmata,
  });
  if (!giornata) {
    throw new Error("Giornata non valida: data obbligatoria.");
  }
  const programmazione = [...leggiProgrammazione(cantiere), giornata].sort(
    confrontaGiornatePerData
  );
  return {
    ...cantiere,
    programmazione,
  };
}

/**
 * @param {object} cantiere
 * @param {string} giornataId
 * @param {object} modifiche
 */
export function aggiornaGiornataProgrammata(cantiere, giornataId, modifiche = {}) {
  const id = String(giornataId || "");
  const programmazione = leggiProgrammazione(cantiere).map((g) => {
    if (String(g.id) !== id) return g;
    return (
      normalizzaGiornataProgrammata({
        ...g,
        ...modifiche,
        id: g.id,
      }) || g
    );
  });
  return {
    ...cantiere,
    programmazione: programmazione.sort(confrontaGiornatePerData),
  };
}

/**
 * @param {object} cantiere
 * @param {string} giornataId
 */
export function eliminaGiornataProgrammata(cantiere, giornataId) {
  const id = String(giornataId || "");
  return {
    ...cantiere,
    programmazione: leggiProgrammazione(cantiere).filter(
      (g) => String(g.id) !== id
    ),
  };
}

/**
 * True se il cantiere usa programmazione multi-giorno (Agenda ignora dataIntervento).
 * @param {object} cantiere
 */
export function haProgrammazioneMultiGiorno(cantiere = {}) {
  return leggiProgrammazione(cantiere).length > 0;
}

/**
 * Giornate non annullate per un giorno calendario.
 * @param {object} cantiere
 * @param {Date} giorno
 */
export function giornatePerGiorno(cantiere, giorno) {
  const target = parseDataProgrammazione(giorno);
  if (!target) return [];
  const t = target.getTime();
  return leggiProgrammazione(cantiere).filter((g) => {
    if (normalizzaStatoGiornata(g.stato) === STATI_GIORNATA.annullata) {
      return false;
    }
    const d = parseDataProgrammazione(g.data);
    return d && d.getTime() === t;
  });
}

/**
 * Formatta data DD/MM/YYYY per UI lunga.
 * @param {string} dataIt
 */
export function formattaDataGiornataLunga(dataIt) {
  const d = parseDataProgrammazione(dataIt);
  if (!d) return String(dataIt || "—");
  return d.toLocaleDateString("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
