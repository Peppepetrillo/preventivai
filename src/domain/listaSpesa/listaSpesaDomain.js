/**
 * Domain Lista Spesa / Acquisti (Sprint 13 Step 8.0).
 * Proiezione operativa: non modifica Distinta né Catalogo.
 */

import { normalizzaUnitaMateriale } from "../catalogoMateriali/materialiTypes";

/**
 * @typedef {'distinta'|'catalogo'|'cantiere'|'manuale'} OrigineVoceListaSpesa
 */

/**
 * @typedef {Object} VoceListaSpesa
 * @property {string} id
 * @property {string} nome
 * @property {number} quantita
 * @property {string} unita
 * @property {boolean} acquistato
 * @property {string=} lavoroId
 * @property {string=} cantiereId
 * @property {string=} famigliaId
 * @property {string=} varianteId
 * @property {string=} distintaVoceId
 * @property {string=} distintaId
 * @property {string=} cantiereMaterialeId
 * @property {OrigineVoceListaSpesa=} origine
 * @property {string=} note
 * @property {string=} titoloLavoro
 * @property {string=} cliente
 * @property {string=} data
 * @property {number=} prezzoUnitario
 * @property {boolean=} modificatoManualmente
 * @property {string} createdAt
 * @property {string} updatedAt
 */

function oraIso() {
  return new Date().toISOString();
}

/**
 * Chiave unità per confronto non distruttivo (cad↔pz, mq↔m²).
 * Non riscrive lo storage.
 * @param {string=} unita
 */
export function chiaveUnitaAcquisto(unita = "") {
  const n = normalizzaUnitaMateriale(unita);
  if (n === "pz" || String(unita || "").trim().toLowerCase() === "cad") {
    return "pz";
  }
  return String(n || "pz");
}

/**
 * @param {string=} a
 * @param {string=} b
 */
export function unitaAcquistoEquivalenti(a, b) {
  return chiaveUnitaAcquisto(a) === chiaveUnitaAcquisto(b);
}

/**
 * Unità in lettura/display (alias senza migrare lo store).
 * @param {string=} unita
 */
export function unitaAcquistoInLettura(unita = "") {
  return normalizzaUnitaMateriale(unita);
}

function nomeNormalizzato(nome = "") {
  return String(nome || "")
    .trim()
    .toLowerCase();
}

/**
 * @param {{
 *   nome: string,
 *   quantita?: number,
 *   unita?: string,
 *   lavoroId?: string,
 *   cantiereId?: string,
 *   famigliaId?: string,
 *   varianteId?: string,
 *   distintaVoceId?: string,
 *   distintaId?: string,
 *   cantiereMaterialeId?: string,
 *   origine?: OrigineVoceListaSpesa,
 *   note?: string,
 *   titoloLavoro?: string,
 *   cliente?: string,
 *   data?: string,
 *   prezzoUnitario?: number,
 *   acquistato?: boolean,
 *   modificatoManualmente?: boolean,
 * }} input
 * @returns {VoceListaSpesa}
 */
export function creaVoceListaSpesa({
  nome,
  quantita = 1,
  unita = "cad",
  lavoroId = "",
  cantiereId = "",
  famigliaId = "",
  varianteId = "",
  distintaVoceId = "",
  distintaId = "",
  cantiereMaterialeId = "",
  origine = "",
  note = "",
  titoloLavoro = "",
  cliente = "",
  data = "",
  prezzoUnitario,
  acquistato = false,
  modificatoManualmente = false,
} = {}) {
  const now = oraIso();
  /** @type {VoceListaSpesa} */
  const voce = {
    id: `spesa-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    nome: String(nome || "").trim(),
    quantita: Number(quantita) || 1,
    unita: String(unita || "cad").trim() || "cad",
    acquistato: Boolean(acquistato),
    lavoroId: lavoroId ? String(lavoroId) : "",
    cliente: String(cliente || "").trim(),
    data: String(data || "").trim(),
    createdAt: now,
    updatedAt: now,
  };

  const cantiere = cantiereId || lavoroId;
  if (cantiere) voce.cantiereId = String(cantiere);
  if (famigliaId) voce.famigliaId = String(famigliaId);
  if (varianteId) voce.varianteId = String(varianteId);
  if (distintaVoceId) voce.distintaVoceId = String(distintaVoceId);
  if (distintaId) voce.distintaId = String(distintaId);
  if (cantiereMaterialeId) voce.cantiereMaterialeId = String(cantiereMaterialeId);
  if (origine) voce.origine = /** @type {OrigineVoceListaSpesa} */ (String(origine));
  if (note) voce.note = String(note).trim();
  if (titoloLavoro) voce.titoloLavoro = String(titoloLavoro).trim();
  if (prezzoUnitario != null && prezzoUnitario !== "") {
    const prezzo = Number(prezzoUnitario);
    if (Number.isFinite(prezzo) && prezzo >= 0) {
      voce.prezzoUnitario = prezzo;
    }
  }
  if (modificatoManualmente) voce.modificatoManualmente = true;

  return voce;
}

/**
 * @param {VoceListaSpesa} voce
 * @param {Partial<VoceListaSpesa>} modifiche
 */
export function aggiornaVoceListaSpesa(voce, modifiche = {}) {
  return {
    ...voce,
    ...modifiche,
    nome:
      modifiche.nome != null ? String(modifiche.nome).trim() : voce.nome,
    updatedAt: oraIso(),
  };
}

function idMaterialeCantiere(materiale = {}) {
  return materiale.cantiereMaterialeId || materiale.id || "";
}

/**
 * Preferenza match:
 * 1. cantiereMaterialeId
 * 2. distintaVoceId (+ lavoroId)
 * 3. varianteId + lavoroId
 * 4. fallback nome + unità + lavoroId
 *
 * @param {VoceListaSpesa[]} elenco
 * @param {object} materiale
 * @param {string|number} lavoroId
 * @param {{ includiAcquistate?: boolean }=} opzioni
 * @returns {VoceListaSpesa|undefined}
 */
export function trovaVoceListaCollegata(
  elenco = [],
  materiale = {},
  lavoroId,
  { includiAcquistate = false } = {}
) {
  const lid = String(lavoroId || "");
  const candidati = elenco.filter(
    (voce) =>
      voce &&
      String(voce.lavoroId) === lid &&
      (includiAcquistate || !voce.acquistato)
  );

  const mid = String(idMaterialeCantiere(materiale) || "");
  if (mid) {
    const perId = candidati.find(
      (voce) =>
        voce.cantiereMaterialeId &&
        String(voce.cantiereMaterialeId) === mid
    );
    if (perId) return perId;
  }

  if (materiale.distintaVoceId) {
    const perDistinta = candidati.find(
      (voce) =>
        voce.distintaVoceId &&
        String(voce.distintaVoceId) === String(materiale.distintaVoceId)
    );
    if (perDistinta) return perDistinta;
  }

  if (materiale.varianteId) {
    const perVariante = candidati.find(
      (voce) =>
        voce.varianteId &&
        String(voce.varianteId) === String(materiale.varianteId)
    );
    if (perVariante) return perVariante;
  }

  const nome = nomeNormalizzato(materiale.nome);
  if (!nome) return undefined;

  return candidati.find(
    (voce) =>
      nomeNormalizzato(voce.nome) === nome &&
      unitaAcquistoEquivalenti(voce.unita, materiale.unita || "cad")
  );
}

/**
 * Collegamento affidabile per aggiornare qty.
 * Nessun fallback sempre-true.
 *
 * @param {VoceListaSpesa} voce
 * @param {object} materiale
 */
export function voceAncoraCollegataAllaSorgente(voce, materiale = {}) {
  if (!voce || !materiale) return false;

  if (voce.distintaVoceId && materiale.distintaVoceId) {
    return String(voce.distintaVoceId) === String(materiale.distintaVoceId);
  }

  if (voce.varianteId && materiale.varianteId) {
    return String(voce.varianteId) === String(materiale.varianteId);
  }

  const mid = String(idMaterialeCantiere(materiale) || "");
  if (voce.cantiereMaterialeId && mid) {
    return String(voce.cantiereMaterialeId) === mid;
  }

  return (
    nomeNormalizzato(voce.nome) === nomeNormalizzato(materiale.nome) &&
    unitaAcquistoEquivalenti(voce.unita, materiale.unita || voce.unita)
  );
}

/**
 * Collegamento "certo" per delete sicuro (non solo nome).
 * @param {VoceListaSpesa} voce
 * @param {object=} materiale
 */
export function collegamentoListaCerto(voce, materiale = {}) {
  if (!voce) return false;
  if (voce.cantiereMaterialeId) {
    if (!materiale || !idMaterialeCantiere(materiale)) return true;
    return String(voce.cantiereMaterialeId) === String(idMaterialeCantiere(materiale));
  }
  if (voce.distintaVoceId && materiale?.distintaVoceId) {
    return String(voce.distintaVoceId) === String(materiale.distintaVoceId);
  }
  if (voce.varianteId && materiale?.varianteId) {
    return String(voce.varianteId) === String(materiale.varianteId);
  }
  return false;
}

function risolviOrigine(materiale = {}) {
  if (materiale.origine) return String(materiale.origine);
  if (materiale.distintaVoceId || materiale.distintaId) return "distinta";
  if (materiale.famigliaId || materiale.varianteId) return "catalogo";
  return "cantiere";
}

function patchDaMateriale(materiale, cantiere) {
  /** @type {Partial<VoceListaSpesa>} */
  const patch = {
    quantita: Number(materiale.quantita) || 1,
    unita: materiale.unita || "cad",
    nome: materiale.nome,
    famigliaId: materiale.famigliaId,
    varianteId: materiale.varianteId,
    distintaVoceId: materiale.distintaVoceId,
    distintaId: materiale.distintaId,
    cantiereMaterialeId: String(idMaterialeCantiere(materiale) || ""),
    cantiereId: String(cantiere.id),
    lavoroId: String(cantiere.id),
    origine: /** @type {OrigineVoceListaSpesa} */ (risolviOrigine(materiale)),
    titoloLavoro: cantiere.nome || cantiere.titolo || "",
  };
  if (materiale.note) patch.note = String(materiale.note).trim();
  if (cantiere.cliente) patch.cliente = cantiere.cliente;
  return patch;
}

/**
 * Allinea acquistato lista ← materiale cantiere.
 * Non tocca Distinta/Catalogo.
 *
 * @param {VoceListaSpesa[]} elenco
 * @param {object} cantiere
 * @param {object} materiale
 */
export function allineaAcquistatoDaMaterialeCantiere(
  elenco = [],
  cantiere = {},
  materiale = {}
) {
  const voce = trovaVoceListaCollegata(elenco, materiale, cantiere.id, {
    includiAcquistate: true,
  });
  if (!voce) return [...elenco];

  const target = Boolean(materiale.acquistato);
  if (Boolean(voce.acquistato) === target) return [...elenco];

  return elenco.map((item) =>
    item.id === voce.id
      ? aggiornaVoceListaSpesa(item, { acquistato: target })
      : item
  );
}

/**
 * Policy delete: se collegamento certo e voce NON acquistata → rimuovi.
 * Se già acquistata → mantieni (storico acquisto).
 *
 * @param {VoceListaSpesa[]} elenco
 * @param {object} cantiere
 * @param {object} materialeEliminato
 */
export function rimuoviVoceListaPerMaterialeEliminato(
  elenco = [],
  cantiere = {},
  materialeEliminato = {}
) {
  const voce = trovaVoceListaCollegata(elenco, materialeEliminato, cantiere.id, {
    includiAcquistate: true,
  });
  if (!voce) return [...elenco];
  if (voce.acquistato) return [...elenco];
  if (!collegamentoListaCerto(voce, materialeEliminato)) return [...elenco];
  return elenco.filter((item) => item.id !== voce.id);
}

/**
 * Sync completa da cantiere: upsert da comprare, allinea acquistato,
 * rimuove ghost non acquistati con link certo.
 *
 * @param {VoceListaSpesa[]} elenco
 * @param {object} cantiere
 */
export function sincronizzaMaterialiDaCantiere(elenco = [], cantiere = {}) {
  const materiali = Array.isArray(cantiere.materiali) ? cantiere.materiali : [];
  let prossimo = [...elenco];
  const data =
    cantiere.dataIntervento ||
    cantiere.dataProgrammata ||
    new Date().toLocaleDateString("it-IT");
  const lavoroId = String(cantiere.id || "");

  const materialiAttiviIds = new Set();
  const materialiAttiviChiavi = new Set();

  for (const materiale of materiali) {
    if (!materiale?.nome) continue;
    const mid = String(idMaterialeCantiere(materiale) || "");
    if (mid) materialiAttiviIds.add(mid);
    if (materiale.distintaVoceId) {
      materialiAttiviChiavi.add(`dv:${materiale.distintaVoceId}`);
    }
    if (materiale.varianteId) {
      materialiAttiviChiavi.add(`var:${materiale.varianteId}`);
    }

    if (materiale.acquistato) {
      prossimo = allineaAcquistatoDaMaterialeCantiere(
        prossimo,
        cantiere,
        materiale
      );
      continue;
    }

    const esistente = trovaVoceListaCollegata(prossimo, materiale, cantiere.id, {
      includiAcquistate: true,
    });

    if (esistente) {
      if (esistente.modificatoManualmente) {
        if (esistente.acquistato) {
          prossimo = prossimo.map((voce) =>
            voce.id === esistente.id
              ? aggiornaVoceListaSpesa(voce, { acquistato: false })
              : voce
          );
        }
        continue;
      }

      if (voceAncoraCollegataAllaSorgente(esistente, materiale)) {
        const patch = patchDaMateriale(materiale, cantiere);
        patch.acquistato = false;
        prossimo = prossimo.map((voce) =>
          voce.id === esistente.id ? aggiornaVoceListaSpesa(voce, patch) : voce
        );
        continue;
      }
      // Match stale (es. stessa variante, distintaVoceId diversa): crea nuova;
      // il cleanup ghost rimuove la voce orfana non acquistata.
    }

    prossimo.push(
      creaVoceListaSpesa({
        ...patchDaMateriale(materiale, cantiere),
        cliente: cantiere.cliente || "",
        data,
        acquistato: false,
      })
    );
  }

  // Ghost: voci del lavoro non acquistate, link certo, materiale sparito
  prossimo = prossimo.filter((voce) => {
    if (String(voce.lavoroId) !== lavoroId) return true;
    if (voce.acquistato) return true;

    if (voce.cantiereMaterialeId) {
      return materialiAttiviIds.has(String(voce.cantiereMaterialeId));
    }
    if (voce.distintaVoceId) {
      return materialiAttiviChiavi.has(`dv:${voce.distintaVoceId}`);
    }
    if (voce.varianteId) {
      return materialiAttiviChiavi.has(`var:${voce.varianteId}`);
    }
    // legacy solo-nome: non eliminare automaticamente
    return true;
  });

  return prossimo;
}

/**
 * @param {VoceListaSpesa[]} elenco
 */
export function selezionaVociDaComprare(elenco = []) {
  return elenco.filter((voce) => voce && !voce.acquistato && voce.nome);
}
