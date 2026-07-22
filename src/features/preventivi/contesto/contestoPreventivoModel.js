/**
 * Contesto Preventivo — modello UX estendibile (Sprint 11C).
 *
 * Oggi: solo Serie civile.
 * Futuro (slot riservati, NON implementati):
 * - marca materiale
 * - livello impianto
 * - aliquota IVA / sconto globale / pagamento / garanzia
 *   (oggi IVA/sconto/pagamento restano in `condizioni`)
 *
 * Non influenza calcoli, PDF o sync.
 */

export const SERIE_CIVILE_DEFAULT_ID = "bticino-living-now";

export const SERIE_CIVILE_DEFAULT = {
  id: SERIE_CIVILE_DEFAULT_ID,
  nome: "BTicino Living Now",
  system: true,
};

/**
 * Slot futuri del contesto — documentazione strutturale per estensioni.
 * Non renderizzati finché non arriva uno sprint dedicato.
 */
export const CONTESTO_PREVENTIVO_SLOTS = Object.freeze([
  {
    id: "serieCivile",
    label: "Serie civile",
    stato: "attivo",
  },
  {
    id: "marcaMateriale",
    label: "Marca materiale",
    stato: "riservato",
  },
  {
    id: "livelloImpianto",
    label: "Livello impianto",
    stato: "riservato",
  },
  {
    id: "aliquotaIva",
    label: "Aliquota IVA",
    stato: "riservato",
  },
  {
    id: "scontoGlobale",
    label: "Sconto globale",
    stato: "riservato",
  },
  {
    id: "metodoPagamento",
    label: "Metodo di pagamento",
    stato: "riservato",
  },
  {
    id: "garanzia",
    label: "Garanzia",
    stato: "riservato",
  },
]);

/**
 * @param {object=} parziale
 * @returns {{
 *   serieCivileId: string,
 *   marcaMaterialeId: string|null,
 *   livelloImpianto: string|null,
 *   _version: number,
 * }}
 */
export function creaContestoPreventivo(parziale = {}) {
  const serieCivileId =
    String(parziale.serieCivileId || "").trim() || SERIE_CIVILE_DEFAULT_ID;

  return {
    serieCivileId,
    marcaMaterialeId: parziale.marcaMaterialeId ?? null,
    livelloImpianto: parziale.livelloImpianto ?? null,
    _version: 1,
  };
}

/**
 * @param {object} contesto
 * @param {object} patch
 */
export function aggiornaContestoPreventivo(contesto, patch = {}) {
  return creaContestoPreventivo({
    ...(contesto || {}),
    ...patch,
  });
}

/**
 * @param {string} nome
 * @returns {{ id: string, nome: string, system: boolean }}
 */
export function creaSerieCivile(nome) {
  const pulito = String(nome || "").trim();
  if (!pulito) {
    throw new Error("Inserisci il nome della serie civile.");
  }

  return {
    id: `serie-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    nome: pulito,
    system: false,
  };
}

/**
 * @param {Array<{ id: string, nome?: string, system?: boolean }>} elenco
 * @param {string} serieId
 * @param {string} nuovoNome
 */
export function rinominaSerieCivile(elenco, serieId, nuovoNome) {
  const pulito = String(nuovoNome || "").trim();
  if (!pulito) {
    throw new Error("Inserisci il nome della serie civile.");
  }

  return (elenco || []).map((serie) =>
    String(serie.id) === String(serieId)
      ? { ...serie, nome: pulito }
      : serie
  );
}

/**
 * Elimina solo se non di sistema e non in uso.
 * @param {Array<object>} elenco
 * @param {string} serieId
 * @param {{ serieCivileId?: string }=} contestoCorrente
 * @param {string[]=} idsInUsoSuPreventivi
 */
export function eliminaSerieCivile(
  elenco,
  serieId,
  contestoCorrente = {},
  idsInUsoSuPreventivi = []
) {
  const target = (elenco || []).find(
    (serie) => String(serie.id) === String(serieId)
  );
  if (!target) {
    throw new Error("Serie civile non trovata.");
  }
  if (target.system) {
    throw new Error("La serie predefinita non può essere eliminata.");
  }
  if (String(contestoCorrente?.serieCivileId) === String(serieId)) {
    throw new Error("Serie in uso sul preventivo corrente.");
  }
  if ((idsInUsoSuPreventivi || []).some((id) => String(id) === String(serieId))) {
    throw new Error("Serie in uso su altri preventivi.");
  }

  return (elenco || []).filter((serie) => String(serie.id) !== String(serieId));
}

/**
 * @param {Array<object>} elenco
 * @param {string} serieId
 */
export function trovaSerieCivile(elenco, serieId) {
  return (
    (elenco || []).find((serie) => String(serie.id) === String(serieId)) ||
    SERIE_CIVILE_DEFAULT
  );
}
