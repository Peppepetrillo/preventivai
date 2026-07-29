import {
  CATEGORIA_ATTIVITA,
  CATEGORIE_ATTIVITA,
  ETICHETTE_CATEGORIA_ATTIVITA,
  PRIORITA_ATTIVITA,
  STATI_ATTIVITA,
} from "./attivitaTypes";

function oraIso() {
  return new Date().toISOString();
}

function dataLocale(data = new Date()) {
  return data.toLocaleDateString("it-IT");
}

function normalizzaCategoria(valore) {
  const grezzo = String(valore || "").trim().toLowerCase();
  return CATEGORIE_ATTIVITA.includes(grezzo)
    ? grezzo
    : CATEGORIA_ATTIVITA.ALTRO;
}

function normalizzaPriorita(valore) {
  const grezzo = String(valore || "").trim().toLowerCase();
  return Object.values(PRIORITA_ATTIVITA).includes(grezzo)
    ? grezzo
    : PRIORITA_ATTIVITA.MEDIA;
}

function normalizzaStato(valore) {
  const grezzo = String(valore || "").trim().toLowerCase();
  return Object.values(STATI_ATTIVITA).includes(grezzo)
    ? grezzo
    : STATI_ATTIVITA.DA_FARE;
}

/**
 * @param {Partial<import("./attivitaTypes").Attivita> & { titolo: string }} input
 * @returns {import("./attivitaTypes").Attivita}
 */
export function creaAttivita({
  titolo,
  descrizione = "",
  categoria = CATEGORIA_ATTIVITA.ALTRO,
  priorita = PRIORITA_ATTIVITA.MEDIA,
  stato = STATI_ATTIVITA.DA_FARE,
  data = "",
  ora = "",
  clienteId = "",
  lavoroId = "",
  reminder = false,
  note = "",
} = {}) {
  const now = oraIso();
  return {
    id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    titolo: String(titolo || "").trim(),
    descrizione: String(descrizione || "").trim(),
    categoria: normalizzaCategoria(categoria),
    priorita: normalizzaPriorita(priorita),
    stato: normalizzaStato(stato),
    data: String(data || dataLocale()).trim(),
    ora: String(ora || "").trim(),
    clienteId: clienteId ? String(clienteId) : "",
    lavoroId: lavoroId ? String(lavoroId) : "",
    reminder: Boolean(reminder),
    note: String(note || "").trim(),
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * @param {import("./attivitaTypes").Attivita} attivita
 * @param {Partial<import("./attivitaTypes").Attivita>} modifiche
 */
export function aggiornaAttivita(attivita, modifiche = {}) {
  const prossimo = { ...attivita, ...modifiche, updatedAt: oraIso() };
  if (modifiche.titolo != null) prossimo.titolo = String(modifiche.titolo).trim();
  if (modifiche.descrizione != null) {
    prossimo.descrizione = String(modifiche.descrizione).trim();
  }
  if (modifiche.categoria != null) {
    prossimo.categoria = normalizzaCategoria(modifiche.categoria);
  }
  if (modifiche.priorita != null) {
    prossimo.priorita = normalizzaPriorita(modifiche.priorita);
  }
  if (modifiche.stato != null) {
    prossimo.stato = normalizzaStato(modifiche.stato);
  }
  if (modifiche.note != null) prossimo.note = String(modifiche.note).trim();
  if (modifiche.ora != null) prossimo.ora = String(modifiche.ora).trim();
  if (modifiche.data != null) prossimo.data = String(modifiche.data).trim();
  return prossimo;
}

/**
 * @param {import("./attivitaTypes").Attivita} attivita
 */
export function completaAttivita(attivita) {
  return aggiornaAttivita(attivita, { stato: STATI_ATTIVITA.COMPLETATA });
}

/**
 * @param {CategoriaAttivita} categoria
 */
export function etichettaCategoriaAttivita(categoria) {
  return (
    ETICHETTE_CATEGORIA_ATTIVITA[categoria] ||
    ETICHETTE_CATEGORIA_ATTIVITA[CATEGORIA_ATTIVITA.ALTRO]
  );
}

/**
 * Minuti dall'inizio giornata per ordinamento.
 * @param {string} ora
 */
export function minutiOraAttivita(ora = "") {
  const match = String(ora).match(/^(\d{1,2}):(\d{2})/);
  if (!match) return 24 * 60;
  return Number(match[1]) * 60 + Number(match[2]);
}

/**
 * @param {import("./attivitaTypes").Attivita[]} elenco
 */
export function ordinaAttivitaPerOra(elenco = []) {
  const pesoStato = {
    [STATI_ATTIVITA.IN_CORSO]: 0,
    [STATI_ATTIVITA.DA_FARE]: 1,
    [STATI_ATTIVITA.COMPLETATA]: 2,
  };
  return [...elenco].sort((a, b) => {
    const diffOra = minutiOraAttivita(a.ora) - minutiOraAttivita(b.ora);
    if (diffOra !== 0) return diffOra;
    return (pesoStato[a.stato] ?? 9) - (pesoStato[b.stato] ?? 9);
  });
}
