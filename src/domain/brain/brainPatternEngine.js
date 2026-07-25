/**
 * Pattern Engine — riconoscimento statistico di comportamenti ricorrenti.
 * Modulo indipendente: non tocca Knowledge Engine né Conoscenze Personali.
 */

import {
  BRAIN_EXTRA_SUGGERIMENTI,
  BRAIN_PATTERN_SOGLIE,
  BRAIN_PATTERN_STATI,
  creaBrainPattern,
  fingerprintPattern,
  risolviFasciaMq,
} from "./brainPatternTypes";

/**
 * @param {object[]} osservazioni
 * @param {object=} soglie
 * @returns {{ patterns: object[] }}
 */
export function eseguiPatternEngine(
  osservazioni = [],
  soglie = BRAIN_PATTERN_SOGLIE
) {
  const minObs = soglie.MIN_OSSERVAZIONI ?? BRAIN_PATTERN_SOGLIE.MIN_OSSERVAZIONI;
  const minRip =
    soglie.MIN_RIPETIZIONE ?? BRAIN_PATTERN_SOGLIE.MIN_RIPETIZIONE;

  const elenco = Array.isArray(osservazioni) ? osservazioni : [];
  const gruppi = raggruppaOsservazioni(elenco);
  const patterns = [];

  Object.values(gruppi).forEach((gruppo) => {
    if (gruppo.items.length < minObs) return;

    const candidati = [
      ...individuaExtraRicorrenti(gruppo, minRip),
      ...individuaModificheRicorrenti(gruppo, minRip),
    ];

    candidati.forEach((candidato) => {
      patterns.push(
        creaBrainPattern({
          ...candidato,
          stato: BRAIN_PATTERN_STATI.NUOVO,
          fingerprint: fingerprintPattern(
            candidato.condizioni,
            candidato.suggerimento
          ),
        })
      );
    });
  });

  patterns.sort(
    (a, b) => b.osservazioni - a.osservazioni || b.affidabilita - a.affidabilita
  );

  return { patterns };
}

/**
 * Raggruppa per: tipoImmobile, fascia mq, livelli, livelloImpianto.
 * (extra analizzati dentro il gruppo per ripetitività)
 * @param {object[]} osservazioni
 */
export function raggruppaOsservazioni(osservazioni = []) {
  const gruppi = {};

  osservazioni.forEach((obs) => {
    const fascia = risolviFasciaMq(obs?.superficieMq);
    const chiave = [
      String(obs?.tipoImmobile || "nd"),
      fascia.id,
      String(obs?.livelli ?? "nd"),
      String(obs?.livelloImpianto || "nd"),
    ].join("|");

    if (!gruppi[chiave]) {
      gruppi[chiave] = {
        chiave,
        condizioniBase: {
          tipoImmobile: String(obs?.tipoImmobile || ""),
          fasciaMq: fascia.id,
          fasciaMqLabel: fascia.label,
          livelli: obs?.livelli ?? null,
          livelloImpianto: String(obs?.livelloImpianto || ""),
        },
        items: [],
      };
    }
    gruppi[chiave].items.push(obs);
  });

  return gruppi;
}

/**
 * Extra presenti in ≥ soglia delle osservazioni del gruppo.
 * @param {object} gruppo
 * @param {number} minRip
 */
export function individuaExtraRicorrenti(gruppo, minRip) {
  const items = gruppo.items || [];
  const n = items.length;
  if (n === 0) return [];

  const conteggi = {};
  items.forEach((obs) => {
    const extra = obs?.extra && typeof obs.extra === "object" ? obs.extra : {};
    Object.entries(extra).forEach(([chiave, valore]) => {
      if (!valore) return;
      if (!BRAIN_EXTRA_SUGGERIMENTI[chiave]) return;
      conteggi[chiave] = (conteggi[chiave] || 0) + 1;
    });
  });

  return Object.entries(conteggi)
    .map(([chiave, count]) => {
      const rip = count / n;
      if (rip < minRip) return null;
      const meta = BRAIN_EXTRA_SUGGERIMENTI[chiave];
      const condizioni = {
        ...gruppo.condizioniBase,
        extra: chiave,
        extraLabel: meta.label,
      };
      return {
        nome: componiNomePattern(condizioni),
        categoria: meta.categoria,
        condizioni,
        suggerimento: {
          tipo: "extra",
          chiave,
          testo: meta.testo,
        },
        osservazioni: count,
        affidabilita: arrotondaAffidabilita(rip),
      };
    })
    .filter(Boolean);
}

/**
 * Modifiche utente ripetute nel gruppo.
 * @param {object} gruppo
 * @param {number} minRip
 */
export function individuaModificheRicorrenti(gruppo, minRip) {
  const items = gruppo.items || [];
  const n = items.length;
  if (n === 0) return [];

  const conteggi = {};
  items.forEach((obs) => {
    estraiFirmeModifica(obs?.modificheUtente).forEach((firma) => {
      const key = JSON.stringify(firma);
      if (!conteggi[key]) {
        conteggi[key] = { count: 0, firma };
      }
      conteggi[key].count += 1;
    });
  });

  return Object.values(conteggi)
    .map(({ count, firma }) => {
      const rip = count / n;
      if (rip < minRip) return null;
      const condizioni = {
        ...gruppo.condizioniBase,
        modifica: firma.chiave,
      };
      return {
        nome: componiNomePattern(condizioni),
        categoria: "Modifica utente",
        condizioni,
        suggerimento: {
          tipo: "modifica",
          chiave: firma.chiave,
          valore: firma.valore,
          testo: firma.testo,
        },
        osservazioni: count,
        affidabilita: arrotondaAffidabilita(rip),
      };
    })
    .filter(Boolean);
}

/**
 * @param {object|object[]} modifiche
 * @returns {Array<{ chiave: string, valore: unknown, testo: string }>}
 */
export function estraiFirmeModifica(modifiche) {
  if (!modifiche) return [];

  if (Array.isArray(modifiche)) {
    return modifiche
      .map((voce) => {
        if (!voce || typeof voce !== "object") return null;
        const chiave = String(voce.campo || voce.chiave || "").trim();
        if (!chiave) return null;
        const valore = voce.a ?? voce.valore ?? voce.nuovo ?? null;
        return {
          chiave,
          valore,
          testo: `${chiave} → ${String(valore)}`,
        };
      })
      .filter(Boolean);
  }

  if (typeof modifiche !== "object") return [];

  // Oggetto vuoto / solo meta → nessuna modifica
  const chiavi = Object.keys(modifiche).filter((k) => !k.startsWith("_"));
  if (chiavi.length === 0) return [];

  if (modifiche.campo || modifiche.chiave) {
    const chiave = String(modifiche.campo || modifiche.chiave);
    const valore = modifiche.a ?? modifiche.valore ?? modifiche.nuovo ?? null;
    return [
      {
        chiave,
        valore,
        testo: `${chiave} → ${String(valore)}`,
      },
    ];
  }

  return chiavi
    .map((chiave) => {
      const valore = modifiche[chiave];
      if (valore === null || valore === undefined || valore === "") return null;
      if (typeof valore === "object") {
        const nested = valore.a ?? valore.valore ?? null;
        if (nested === null || nested === undefined) return null;
        return {
          chiave,
          valore: nested,
          testo: `${chiave} → ${String(nested)}`,
        };
      }
      return {
        chiave,
        valore,
        testo: `${chiave} → ${String(valore)}`,
      };
    })
    .filter(Boolean);
}

/**
 * @param {object} condizioni
 */
export function componiNomePattern(condizioni = {}) {
  const parti = [];
  if (condizioni.tipoImmobile) {
    parti.push(String(condizioni.tipoImmobile).toUpperCase());
  }
  if (condizioni.fasciaMqLabel) {
    parti.push(condizioni.fasciaMqLabel);
  }
  if (condizioni.extraLabel) {
    parti.push(String(condizioni.extraLabel).toUpperCase());
  } else if (condizioni.modifica) {
    parti.push(String(condizioni.modifica));
  }
  return parti.filter(Boolean).join(" · ") || "Pattern ricorrente";
}

/**
 * @param {number} ripetizione 0–1
 * @returns {number} 0–100
 */
export function arrotondaAffidabilita(ripetizione) {
  const pct = Math.round(Number(ripetizione) * 1000) / 10;
  return Math.min(100, Math.max(0, pct));
}

/**
 * Statistiche conteggio per stato.
 * @param {object[]} patterns
 */
export function calcolaStatistichePattern(patterns = []) {
  const elenco = Array.isArray(patterns) ? patterns : [];
  return {
    totale: elenco.length,
    nuovi: elenco.filter((p) => p.stato === BRAIN_PATTERN_STATI.NUOVO).length,
    proposti: elenco.filter((p) => p.stato === BRAIN_PATTERN_STATI.PROPOSTO)
      .length,
    accettati: elenco.filter((p) => p.stato === BRAIN_PATTERN_STATI.ACCETTATO)
      .length,
    rifiutati: elenco.filter((p) => p.stato === BRAIN_PATTERN_STATI.RIFIUTATO)
      .length,
  };
}
