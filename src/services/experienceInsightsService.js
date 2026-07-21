import { recuperaEsperienze } from "./experienceService";

const TIPO_LAVORO_SCONOSCIUTO = "non_specificato";
const PRECISIONE_DURATA = 1;

/**
 * Normalizza l'elenco esperienze in un array sicuro.
 * @param {unknown} esperienze
 * @returns {object[]}
 */
function normalizzaElenco(esperienze) {
  if (!Array.isArray(esperienze)) return [];
  return esperienze.filter((item) => item && typeof item === "object");
}

/**
 * Legge le esperienze dal servizio, con fallback sicuro.
 * @param {object[]=} esperienze
 * @returns {object[]}
 */
function risolviEsperienze(esperienze) {
  if (esperienze !== undefined) {
    return normalizzaElenco(esperienze);
  }

  try {
    return normalizzaElenco(recuperaEsperienze());
  } catch {
    return [];
  }
}

/**
 * Estrae un nome testo normalizzato (trim + lowercase per conteggio).
 * @param {unknown} valore
 * @returns {string}
 */
function normalizzaTesto(valore) {
  if (valore == null) return "";
  return String(valore).trim();
}

/**
 * Chiave di aggregazione case-insensitive, preservando il primo nome visto.
 * @param {Map<string, {nome: string, count: number}>} mappa
 * @param {string} nome
 */
function incrementaFrequenza(mappa, nome) {
  const etichetta = normalizzaTesto(nome);
  if (!etichetta) return;

  const chiave = etichetta.toLowerCase();
  const esistente = mappa.get(chiave);

  if (esistente) {
    esistente.count += 1;
    return;
  }

  mappa.set(chiave, { nome: etichetta, count: 1 });
}

/**
 * Converte una mappa frequenza in array ordinato per count desc.
 * @param {Map<string, {nome: string, count: number}>} mappa
 * @returns {{nome: string, count: number}[]}
 */
function mappaFrequenzeInArray(mappa) {
  return [...mappa.values()].sort(
    (a, b) => b.count - a.count || a.nome.localeCompare(b.nome, "it")
  );
}

/**
 * Restituisce una durata valida (numero finito > 0) oppure null.
 * @param {unknown} valore
 * @returns {number|null}
 */
function durataValida(valore) {
  const numero = Number(valore);
  if (!Number.isFinite(numero) || numero <= 0) return null;
  return numero;
}

/**
 * Arrotonda la durata media.
 * @param {number} somma
 * @param {number} conteggio
 * @returns {number}
 */
function mediaDurata(somma, conteggio) {
  if (conteggio <= 0) return 0;
  const media = somma / conteggio;
  return Number(media.toFixed(PRECISIONE_DURATA));
}

/**
 * Conta le attività da checklist e da attività aggiunte.
 * @param {object} esperienza
 * @returns {number}
 */
function contaAttivitaEsperienza(esperienza) {
  const checklist = Array.isArray(esperienza.checklistCompletata)
    ? esperienza.checklistCompletata.length
    : 0;
  const aggiunte = Array.isArray(esperienza.attivitaAggiunte)
    ? esperienza.attivitaAggiunte.length
    : 0;
  return checklist + aggiunte;
}

/**
 * Conta i materiali di un'esperienza.
 * @param {object} esperienza
 * @returns {number}
 */
function contaMaterialiEsperienza(esperienza) {
  return Array.isArray(esperienza.materiali) ? esperienza.materiali.length : 0;
}

/**
 * Statistiche aggregate sulle esperienze registrate.
 * @param {object[]=} esperienze Opzionale: elenco da analizzare (default: archivio)
 * @returns {{
 *   totaleEsperienze: number,
 *   totaleCantieriCompletati: number,
 *   durataMedia: number,
 *   totaleMaterialiUtilizzati: number,
 *   totaleAttivitaRegistrate: number
 * }}
 */
export function getStatisticheGenerali(esperienze) {
  const elenco = risolviEsperienze(esperienze);

  let sommaDurata = 0;
  let conteggioDurata = 0;
  let totaleMateriali = 0;
  let totaleAttivita = 0;

  for (const esperienza of elenco) {
    const durata = durataValida(esperienza.durataGiorni);
    if (durata != null) {
      sommaDurata += durata;
      conteggioDurata += 1;
    }

    totaleMateriali += contaMaterialiEsperienza(esperienza);
    totaleAttivita += contaAttivitaEsperienza(esperienza);
  }

  return {
    totaleEsperienze: elenco.length,
    totaleCantieriCompletati: elenco.length,
    durataMedia: mediaDurata(sommaDurata, conteggioDurata),
    totaleMaterialiUtilizzati: totaleMateriali,
    totaleAttivitaRegistrate: totaleAttivita,
  };
}

/**
 * Tipi di lavoro ordinati per frequenza decrescente.
 * @param {object[]=} esperienze
 * @returns {{tipo: string, count: number}[]}
 */
export function getTipiLavoroFrequenti(esperienze) {
  const elenco = risolviEsperienze(esperienze);
  const mappa = new Map();

  for (const esperienza of elenco) {
    const tipo =
      normalizzaTesto(esperienza.tipoLavoro) || TIPO_LAVORO_SCONOSCIUTO;
    const chiave = tipo.toLowerCase();
    const esistente = mappa.get(chiave);

    if (esistente) {
      esistente.count += 1;
    } else {
      mappa.set(chiave, { tipo, count: 1 });
    }
  }

  return [...mappa.values()].sort(
    (a, b) => b.count - a.count || a.tipo.localeCompare(b.tipo, "it")
  );
}

/**
 * Attività più frequenti (checklist + attività aggiunte).
 * @param {object[]=} esperienze
 * @returns {{nome: string, count: number}[]}
 */
export function getAttivitaFrequenti(esperienze) {
  const elenco = risolviEsperienze(esperienze);
  const mappa = new Map();

  for (const esperienza of elenco) {
    const checklist = Array.isArray(esperienza.checklistCompletata)
      ? esperienza.checklistCompletata
      : [];

    for (const voce of checklist) {
      if (!voce || typeof voce !== "object") continue;
      incrementaFrequenza(mappa, voce.testo ?? voce.nome);
    }

    const aggiunte = Array.isArray(esperienza.attivitaAggiunte)
      ? esperienza.attivitaAggiunte
      : [];

    for (const attivita of aggiunte) {
      if (attivita && typeof attivita === "object") {
        incrementaFrequenza(mappa, attivita.testo ?? attivita.nome);
      } else {
        incrementaFrequenza(mappa, attivita);
      }
    }
  }

  return mappaFrequenzeInArray(mappa);
}

/**
 * Materiali più frequenti nelle esperienze.
 * @param {object[]=} esperienze
 * @returns {{nome: string, count: number}[]}
 */
export function getMaterialiFrequenti(esperienze) {
  const elenco = risolviEsperienze(esperienze);
  const mappa = new Map();

  for (const esperienza of elenco) {
    const materiali = Array.isArray(esperienza.materiali)
      ? esperienza.materiali
      : [];

    for (const materiale of materiali) {
      if (!materiale || typeof materiale !== "object") continue;
      incrementaFrequenza(mappa, materiale.nome);
    }
  }

  return mappaFrequenzeInArray(mappa);
}

/**
 * Durata media dei lavori raggruppata per tipologia.
 * @param {object[]=} esperienze
 * @returns {{tipo: string, durataMedia: number}[]}
 */
export function getDurataMediaPerTipo(esperienze) {
  const elenco = risolviEsperienze(esperienze);
  /** @type {Map<string, {tipo: string, somma: number, conteggio: number}>} */
  const mappa = new Map();

  for (const esperienza of elenco) {
    const durata = durataValida(esperienza.durataGiorni);
    if (durata == null) continue;

    const tipo =
      normalizzaTesto(esperienza.tipoLavoro) || TIPO_LAVORO_SCONOSCIUTO;
    const chiave = tipo.toLowerCase();
    const esistente = mappa.get(chiave);

    if (esistente) {
      esistente.somma += durata;
      esistente.conteggio += 1;
    } else {
      mappa.set(chiave, { tipo, somma: durata, conteggio: 1 });
    }
  }

  return [...mappa.values()]
    .map(({ tipo, somma, conteggio }) => ({
      tipo,
      durataMedia: mediaDurata(somma, conteggio),
    }))
    .sort(
      (a, b) =>
        b.durataMedia - a.durataMedia || a.tipo.localeCompare(b.tipo, "it")
    );
}

/**
 * Punto di ingresso aggregato per Sprint successivi (Suggestion Engine, Dashboard).
 * @param {object[]=} esperienze
 * @returns {{
 *   statistiche: ReturnType<typeof getStatisticheGenerali>,
 *   tipiLavoro: ReturnType<typeof getTipiLavoroFrequenti>,
 *   attivita: ReturnType<typeof getAttivitaFrequenti>,
 *   materiali: ReturnType<typeof getMaterialiFrequenti>,
 *   durataMedia: ReturnType<typeof getDurataMediaPerTipo>
 * }}
 */
export function getInsights(esperienze) {
  const elenco = risolviEsperienze(esperienze);

  return {
    statistiche: getStatisticheGenerali(elenco),
    tipiLavoro: getTipiLavoroFrequenti(elenco),
    attivita: getAttivitaFrequenti(elenco),
    materiali: getMaterialiFrequenti(elenco),
    durataMedia: getDurataMediaPerTipo(elenco),
  };
}
