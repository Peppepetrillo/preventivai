/**
 * Utility UI — collega lavorazioni economiche alle spiegazioni Base Tecnica.
 * Non tocca pricing: legge solo metadati da conoscenzaProposta / schede.
 */

import { BASE_TECNICA_ORIGINE_TIPO } from "../../domain/baseTecnica";

const ETICHETTE_ORIGINE = Object.freeze({
  [BASE_TECNICA_ORIGINE_TIPO.NORMATIVA]: "Normativa",
  [BASE_TECNICA_ORIGINE_TIPO.BUONA_PRATICA]: "Buona pratica",
  [BASE_TECNICA_ORIGINE_TIPO.ESPERIENZA_PREVENTIVAI]: "Esperienza PreventivAI",
});

const ETICHETTE_AFFIDABILITA = Object.freeze({
  ALTO: "Alta",
  MEDIO: "Media",
  BASSO: "Bassa",
});

const ETICHETTE_CONDIZIONE = Object.freeze({
  cucina: "Cucina",
  climatizzazione: "Climatizzazione",
  citofono: "Citofono",
  videocitofono: "Videocitofono",
  impiantoTv: "Impianto TV",
  reteDati: "Rete dati",
  allarme: "Allarme",
  videosorveglianza: "Videosorveglianza",
  cancelloAutomatico: "Cancello automatico",
  predisposizioneFotovoltaico: "Predisposizione fotovoltaico",
  predisposizioneColonnina: "Colonnina ricarica",
  domotica: "Domotica",
  tipoImmobile: "Tipo immobile",
});

/**
 * @param {string} tipo
 * @returns {string}
 */
export function etichettaOrigine(tipo) {
  return ETICHETTE_ORIGINE[tipo] || tipo || "—";
}

/**
 * @param {string} livello
 * @returns {string}
 */
export function etichettaAffidabilita(livello) {
  return ETICHETTE_AFFIDABILITA[livello] || livello || "—";
}

/**
 * Costruisce le righe "Hai indicato:" dalle condizioni della scheda.
 * @param {object} condizioni
 * @param {object=} input
 * @returns {string[]}
 */
export function descriviIndicazioniUtente(condizioni = {}, input = {}) {
  const righe = [];
  if (!condizioni || typeof condizioni !== "object") return righe;

  for (const [chiave, valore] of Object.entries(condizioni)) {
    if (chiave === "mqMin" || chiave === "mqMax" || chiave === "livelliMin") {
      continue;
    }
    const label = ETICHETTE_CONDIZIONE[chiave] || chiave;
    if (typeof valore === "boolean") {
      righe.push(`${label} = ${valore ? "sì" : "no"}`);
    } else if (valore != null && valore !== "") {
      righe.push(`${label} = ${valore}`);
    }
  }

  if (condizioni.mqMin != null || condizioni.mqMax != null) {
    const mq = input.mq ?? input.superficieMq;
    if (mq != null) {
      righe.push(`Superficie = ${mq} mq`);
    } else if (condizioni.mqMin != null && condizioni.mqMax != null) {
      righe.push(`Superficie tra ${condizioni.mqMin} e ${condizioni.mqMax} mq`);
    } else if (condizioni.mqMin != null) {
      righe.push(`Superficie ≥ ${condizioni.mqMin} mq`);
    }
  }

  if (condizioni.livelliMin != null) {
    const livelli = input.livelli ?? input.numeroLivelli;
    if (livelli != null) {
      righe.push(`Livelli = ${livelli}`);
    } else {
      righe.push(`Livelli ≥ ${condizioni.livelliMin}`);
    }
  }

  return righe;
}

/**
 * Recupera la spiegazione BT per una lavorazione proposal, se presente.
 * Fonte: conoscenzaProposta.suggerimenti (metadati KE) + schedeTecniche.
 *
 * @param {object} lavorazione — riga economica (catalogoId)
 * @param {object} proposal — PreventivoProposal
 * @returns {object|null}
 */
export function risolviSpiegazioneLavorazione(lavorazione = {}, proposal = {}) {
  const catalogoId = lavorazione.catalogoId || lavorazione.id;
  if (!catalogoId) return null;

  const conoscenza = proposal.conoscenzaProposta || {};
  const suggerimenti = Array.isArray(conoscenza.suggerimenti)
    ? conoscenza.suggerimenti
    : [];
  const sug = suggerimenti.find(
    (s) => (s.catalogoId || s.id) === catalogoId && s.schedaTecnicaId
  );

  if (!sug?.schedaTecnicaId) return null;

  const schede = Array.isArray(conoscenza.schedeTecniche)
    ? conoscenza.schedeTecniche
    : Array.isArray(proposal.schedeTecniche)
      ? proposal.schedeTecniche
      : [];
  const scheda =
    schede.find((s) => s.id === sug.schedaTecnicaId) || null;

  const motivazione = sug.motivazione || scheda?.motivazione || null;
  const origine =
    sug.origineTecnica ||
    (sug.origine && typeof sug.origine === "object" && sug.origine.tipo
      ? sug.origine
      : null) ||
    scheda?.origine ||
    null;
  const verifiche =
    (Array.isArray(sug.verificheProfessionista) &&
      sug.verificheProfessionista.length > 0
      ? sug.verificheProfessionista
      : scheda?.verificheProfessionista) || [];
  const livelloAffidabilita =
    sug.livelloAffidabilita || scheda?.livelloAffidabilita || null;

  if (!motivazione && !origine && verifiche.length === 0) {
    return null;
  }

  return {
    catalogoId,
    quantita: lavorazione.quantita ?? sug.quantita ?? 1,
    schedaTecnicaId: sug.schedaTecnicaId,
    motivazione,
    origine,
    verificheProfessionista: [...verifiche],
    livelloAffidabilita,
    indicazioni: descriviIndicazioniUtente(
      scheda?.condizioni || {},
      proposal.input || conoscenza
    ),
    titoloScheda: scheda?.titolo || null,
  };
}
