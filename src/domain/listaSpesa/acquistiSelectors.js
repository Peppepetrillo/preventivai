/**
 * Selectors Acquisti — fonte unica per Home / Agenda / futura UI (Step 8.1).
 * Aggregati = view model, mai persistiti.
 */

import {
  chiaveUnitaAcquisto,
  selezionaVociDaComprare,
  unitaAcquistoInLettura,
} from "./listaSpesaDomain";

function nomeNormalizzato(nome = "") {
  return String(nome || "")
    .trim()
    .toLowerCase();
}

/**
 * Chiave aggregazione:
 * 1. varianteId + unità
 * 2. famigliaId + nome + unità
 * 3. nome + unità
 *
 * @param {import("./listaSpesaDomain").VoceListaSpesa} voce
 */
export function chiaveAggregazioneAcquisto(voce = {}) {
  const unita = chiaveUnitaAcquisto(voce.unita);
  if (voce.varianteId) {
    return `var:${voce.varianteId}|${unita}`;
  }
  const nome = nomeNormalizzato(voce.nome);
  if (voce.famigliaId) {
    return `fam:${voce.famigliaId}|${nome}|${unita}`;
  }
  return `nome:${nome}|${unita}`;
}

/**
 * @param {import("./listaSpesaDomain").VoceListaSpesa[]} voci
 */
export function selezionaDaComprare(voci = []) {
  return selezionaVociDaComprare(voci);
}

/**
 * @param {import("./listaSpesaDomain").VoceListaSpesa[]} voci
 * @param {string|number} lavoroId
 */
export function selezionaDaComprarePerLavoro(voci = [], lavoroId) {
  const lid = String(lavoroId || "");
  return selezionaDaComprare(voci).filter(
    (voce) => String(voce.lavoroId) === lid
  );
}

/**
 * Aggrega voci da comprare preservando provenance (voci originali).
 * Non somma unità diverse.
 *
 * @param {import("./listaSpesaDomain").VoceListaSpesa[]} voci
 * @returns {Array<{
 *   chiave: string,
 *   nome: string,
 *   unita: string,
 *   quantitaTotale: number,
 *   voci: import("./listaSpesaDomain").VoceListaSpesa[],
 *   idsVoci: string[],
 * }>}
 */
export function aggregaVociAcquisto(voci = []) {
  const daComprare = selezionaDaComprare(voci);
  /** @type {Map<string, any>} */
  const mappa = new Map();

  for (const voce of daComprare) {
    if (!voce?.nome) continue;
    const chiave = chiaveAggregazioneAcquisto(voce);
    const esistente = mappa.get(chiave);
    if (!esistente) {
      mappa.set(chiave, {
        chiave,
        nome: voce.nome,
        unita: unitaAcquistoInLettura(voce.unita) || voce.unita || "pz",
        quantitaTotale: Number(voce.quantita) || 0,
        voci: [voce],
        idsVoci: [voce.id],
        famigliaId: voce.famigliaId,
        varianteId: voce.varianteId,
      });
      continue;
    }
    esistente.quantitaTotale += Number(voce.quantita) || 0;
    esistente.voci.push(voce);
    esistente.idsVoci.push(voce.id);
  }

  return [...mappa.values()].sort((a, b) =>
    a.nome.localeCompare(b.nome, "it")
  );
}

/** Alias esplicito per vista globale. */
export function selezionaAcquistiAggregati(voci = []) {
  return aggregaVociAcquisto(voci);
}

/**
 * Raggruppa per lavoro/cantiere.
 *
 * @param {import("./listaSpesaDomain").VoceListaSpesa[]} voci
 * @param {{ cantieri?: object[] }=} opzioni
 */
export function raggruppaAcquistiPerLavoro(voci = [], { cantieri = [] } = {}) {
  const daComprare = selezionaDaComprare(voci);
  const cantieriById = new Map(
    (cantieri || []).map((c) => [String(c.id), c])
  );
  /** @type {Map<string, any>} */
  const gruppi = new Map();

  for (const voce of daComprare) {
    const lid = String(voce.lavoroId || voce.cantiereId || "senza-lavoro");
    if (!gruppi.has(lid)) {
      const cantiere = cantieriById.get(lid);
      gruppi.set(lid, {
        lavoroId: lid === "senza-lavoro" ? "" : lid,
        cliente:
          voce.cliente ||
          cantiere?.cliente ||
          "",
        titoloLavoro:
          voce.titoloLavoro ||
          cantiere?.nome ||
          "Lavoro",
        voci: [],
      });
    }
    gruppi.get(lid).voci.push(voce);
  }

  return [...gruppi.values()]
    .map((g) => ({
      ...g,
      voci: [...g.voci].sort((a, b) => a.nome.localeCompare(b.nome, "it")),
    }))
    .sort((a, b) => {
      const ca = `${a.cliente} ${a.titoloLavoro}`.trim();
      const cb = `${b.cliente} ${b.titoloLavoro}`.trim();
      return ca.localeCompare(cb, "it");
    });
}

function materialeCopertoDaLista(mat, lavoroId, covered) {
  const lid = String(lavoroId);
  if (mat.id && covered.has(`cm:${lid}:${mat.id}`)) return true;
  if (mat.distintaVoceId && covered.has(`dv:${lid}:${mat.distintaVoceId}`)) {
    return true;
  }
  if (mat.varianteId && covered.has(`var:${lid}:${mat.varianteId}`)) {
    return true;
  }
  const nome = nomeNormalizzato(mat.nome);
  const unita = chiaveUnitaAcquisto(mat.unita);
  return covered.has(`nome:${lid}:${nome}|${unita}`);
}

/**
 * Da comprare per i lavori di un giorno — lista come fonte primaria,
 * gap-fill da materiali cantiere non ancora in lista (legacy).
 *
 * @param {import("./listaSpesaDomain").VoceListaSpesa[]} listaSpesa
 * @param {object[]} lavoriGiorno — interventi/lavori con .id e .cantiere?
 * @returns {Array<{ nome: string, quantita: number, unita: string, fonte: string, id?: string, lavoroId?: string, varianteId?: string, distintaVoceId?: string, idsVoci?: string[] }>}
 */
export function selezionaDaComprareOggi(listaSpesa = [], lavoriGiorno = []) {
  const lavoroIds = new Set(
    (lavoriGiorno || []).map((l) => String(l.id)).filter(Boolean)
  );

  const daLista = selezionaDaComprare(listaSpesa).filter((voce) =>
    lavoroIds.has(String(voce.lavoroId || ""))
  );

  const covered = new Set();
  for (const voce of daLista) {
    const lid = String(voce.lavoroId || "");
    if (voce.cantiereMaterialeId) {
      covered.add(`cm:${lid}:${voce.cantiereMaterialeId}`);
    }
    if (voce.distintaVoceId) covered.add(`dv:${lid}:${voce.distintaVoceId}`);
    if (voce.varianteId) covered.add(`var:${lid}:${voce.varianteId}`);
    covered.add(
      `nome:${lid}:${nomeNormalizzato(voce.nome)}|${chiaveUnitaAcquisto(voce.unita)}`
    );
  }

  /** @type {Map<string, any>} */
  const display = new Map();

  // Aggrega solo le voci lista del giorno (anti doppio conteggio)
  for (const agg of aggregaVociAcquisto(daLista)) {
    display.set(agg.chiave, {
      nome: agg.nome,
      quantita: agg.quantitaTotale,
      unita: agg.unita,
      fonte: "lista",
      varianteId: agg.varianteId,
      famigliaId: agg.famigliaId,
      idsVoci: agg.idsVoci,
      voci: agg.voci,
    });
  }

  // Gap-fill legacy cantiere → non già in lista
  for (const lavoro of lavoriGiorno || []) {
    const materiali = lavoro.cantiere?.materiali || [];
    for (const mat of materiali) {
      if (!mat?.nome || mat.acquistato) continue;
      if (materialeCopertoDaLista(mat, lavoro.id, covered)) continue;

      const fake = {
        nome: mat.nome,
        unita: mat.unita || "cad",
        varianteId: mat.varianteId,
        famigliaId: mat.famigliaId,
      };
      const chiave = chiaveAggregazioneAcquisto(fake);
      if (display.has(chiave)) {
        const esistente = display.get(chiave);
        esistente.quantita += Number(mat.quantita) || 0;
        continue;
      }
      display.set(chiave, {
        nome: mat.nome,
        quantita: Number(mat.quantita) || 0,
        unita: unitaAcquistoInLettura(mat.unita) || mat.unita || "cad",
        fonte: "lavoro",
        lavoroId: String(lavoro.id),
        varianteId: mat.varianteId,
        distintaVoceId: mat.distintaVoceId,
      });
    }
  }

  // Voci lista senza lavoro del giorno (es. spesa libera) — escluse dalla vista "oggi"
  return [...display.values()].sort((a, b) =>
    a.nome.localeCompare(b.nome, "it")
  );
}
