/**
 * Coverage Base Tecnica → Catalogo → Listino.
 * Report automatico gap (nessun pricing: solo stato di allineamento).
 */

import { CATALOGO_BY_ID } from "../catalogo/catalogoLavorazioni";
import { isCatalogoId } from "../catalogo/catalogoTypes";
import { listinoBase } from "../../data/listinoBase";
import { selezionaVociAttive } from "../../features/listino/listinoCatalogDomain";
import { BASE_TECNICA_SCHEDE } from "./baseTecnicaData";

export const STATO_COVERAGE = Object.freeze({
  OK: "OK",
  MANCANTE_CATALOGO: "MANCANTE_CATALOGO",
  MANCANTE_LISTINO: "MANCANTE_LISTINO",
});

/**
 * @param {object[]} listino
 * @returns {Set<string>}
 */
function indiciListinoAttivi(listino = listinoBase) {
  const attive = selezionaVociAttive(listino);
  return new Set(attive.map((v) => String(v.id)));
}

/**
 * Stato di un singolo catalogoId rispetto a Catalogo + Listino.
 * @param {string} catalogoId
 * @param {object[]=} listino
 * @returns {"OK"|"MANCANTE_CATALOGO"|"MANCANTE_LISTINO"}
 */
export function statoCoverageCatalogoId(catalogoId, listino = listinoBase) {
  if (!catalogoId || !isCatalogoId(catalogoId)) {
    return STATO_COVERAGE.MANCANTE_CATALOGO;
  }
  const voce = CATALOGO_BY_ID[catalogoId];
  const chiave = voce?.chiaveListino;
  if (!chiave) {
    return STATO_COVERAGE.MANCANTE_LISTINO;
  }
  const listinoIds = indiciListinoAttivi(listino);
  if (!listinoIds.has(String(chiave))) {
    return STATO_COVERAGE.MANCANTE_LISTINO;
  }
  return STATO_COVERAGE.OK;
}

/**
 * Report automatico: ogni catalogoId referenziato dalla Base Tecnica.
 * @param {{ listino?: object[] }=} opzioni
 * @returns {Array<{
 *   categoria: string,
 *   schedaTecnicaId: string,
 *   catalogoId: string,
 *   stato: string,
 * }>}
 */
export function reportCoverageBaseTecnica(opzioni = {}) {
  const listino = opzioni.listino ?? listinoBase;
  const report = [];

  for (const scheda of BASE_TECNICA_SCHEDE) {
    const ids = scheda.catalogoIds || [];
    if (ids.length === 0) {
      report.push({
        categoria: scheda.categoria,
        schedaTecnicaId: scheda.id,
        catalogoId: null,
        stato: STATO_COVERAGE.OK,
        nota: "scheda senza catalogoIds",
      });
      continue;
    }
    for (const catalogoId of ids) {
      report.push({
        categoria: scheda.categoria,
        schedaTecnicaId: scheda.id,
        catalogoId,
        stato: statoCoverageCatalogoId(catalogoId, listino),
      });
    }
  }

  return report;
}

/**
 * Riepilogo aggregato del gap report.
 * @param {ReturnType<typeof reportCoverageBaseTecnica>} report
 */
export function riepilogoCoverage(report = reportCoverageBaseTecnica()) {
  const conteggi = {
    OK: 0,
    MANCANTE_CATALOGO: 0,
    MANCANTE_LISTINO: 0,
  };
  for (const riga of report) {
    if (conteggi[riga.stato] != null) conteggi[riga.stato] += 1;
  }
  return {
    totale: report.length,
    ...conteggi,
    gap: report.filter((r) => r.stato !== STATO_COVERAGE.OK),
  };
}

/**
 * Validazione struttuale schede Base Tecnica (spiegabilità).
 * @returns {Array<{ schedaTecnicaId: string, errori: string[] }>}
 */
export function validaSchedeBaseTecnica() {
  const risultati = [];
  for (const scheda of BASE_TECNICA_SCHEDE) {
    const errori = [];
    if (!scheda.motivazione) errori.push("motivazione assente");
    if (!scheda.origine?.tipo) errori.push("origine.tipo assente");
    if (
      !Array.isArray(scheda.verificheProfessionista) ||
      scheda.verificheProfessionista.length === 0
    ) {
      errori.push("verificheProfessionista assenti");
    }
    if (!scheda.livelloAffidabilita) {
      errori.push("livelloAffidabilita assente");
    }
    for (const id of scheda.catalogoIds || []) {
      if (!isCatalogoId(id)) {
        errori.push(`catalogoId non valido: ${id}`);
      }
    }
    if (errori.length > 0) {
      risultati.push({ schedaTecnicaId: scheda.id, errori });
    }
  }
  return risultati;
}
