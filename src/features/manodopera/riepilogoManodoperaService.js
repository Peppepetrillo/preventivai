/**
 * Aggregazioni manodopera cross-cantiere (settimana / operaio / cantiere).
 * NON scrive in spese[] / economia — solo lettura e somma.
 */

import { leggiGiornateManodopera } from "./giornateManodoperaService";
import { nomeCompletoOperaio } from "./operaiDomain";
import {
  dataInIntervallo,
  fineSettimana,
  inizioSettimana,
} from "./settimanaUtils";

/**
 * @param {object[]} cantieri
 * @returns {object[]}
 */
export function raccogliGiornateManodopera(cantieri = []) {
  const out = [];
  for (const cantiere of cantieri || []) {
    if (!cantiere || cantiere.deletedAt) continue;
    for (const g of leggiGiornateManodopera(cantiere)) {
      out.push({
        ...g,
        cantiereId: String(g.cantiereId || cantiere.id),
        cantiereNome:
          String(cantiere.nome || cantiere.titolo || "").trim() ||
          "Cantiere",
        clienteNome: String(cantiere.cliente || cantiere.nomeCliente || "").trim(),
      });
    }
  }
  return out;
}

/**
 * @param {object[]} giornate
 * @param {{ da: Date, a: Date, operaioId?: string, cantiereId?: string }} filtri
 */
export function filtraGiornateManodopera(giornate, filtri = {}) {
  const da = filtri.da || inizioSettimana();
  const a = filtri.a || fineSettimana(da);
  return (giornate || []).filter((g) => {
    if (!dataInIntervallo(g.data, da, a)) return false;
    if (filtri.operaioId && String(g.operaioId) !== String(filtri.operaioId)) {
      return false;
    }
    if (filtri.cantiereId && String(g.cantiereId) !== String(filtri.cantiereId)) {
      return false;
    }
    return true;
  });
}

/**
 * @param {object[]} giornate
 */
export function aggregaTotaliManodopera(giornate = []) {
  const operai = new Set();
  const cantieri = new Set();
  let ore = 0;
  let costo = 0;
  let pagato = 0;
  let daPagare = 0;
  for (const g of giornate) {
    operai.add(String(g.operaioId));
    cantieri.add(String(g.cantiereId));
    ore += Number(g.ore) || 0;
    const c = Number(g.costo) || 0;
    costo += c;
    if (g.pagato) pagato += c;
    else daPagare += c;
  }
  return {
    operai: operai.size,
    cantieri: cantieri.size,
    giornate: giornate.length,
    ore,
    costo,
    pagato,
    daPagare,
  };
}

/**
 * @param {object[]} giornate
 * @param {object[]} operai
 */
export function aggregaPerOperaio(giornate = [], operai = []) {
  const mappa = new Map();
  for (const g of giornate) {
    const id = String(g.operaioId);
    if (!mappa.has(id)) {
      const anag = operai.find((o) => String(o.id) === id) || null;
      mappa.set(id, {
        operaioId: id,
        nome: nomeCompletoOperaio(anag) || "Operaio",
        ruolo: anag?.ruolo || "",
        giornate: 0,
        ore: 0,
        costo: 0,
        pagato: 0,
        daPagare: 0,
      });
    }
    const riga = mappa.get(id);
    riga.giornate += 1;
    riga.ore += Number(g.ore) || 0;
    const c = Number(g.costo) || 0;
    riga.costo += c;
    if (g.pagato) riga.pagato += c;
    else riga.daPagare += c;
  }
  return [...mappa.values()].sort((a, b) => a.nome.localeCompare(b.nome, "it"));
}

/**
 * @param {object[]} giornate
 */
export function aggregaPerCantiere(giornate = []) {
  const mappa = new Map();
  for (const g of giornate) {
    const id = String(g.cantiereId);
    if (!mappa.has(id)) {
      const cliente = g.clienteNome ? `${g.clienteNome} — ` : "";
      mappa.set(id, {
        cantiereId: id,
        nome: `${cliente}${g.cantiereNome || "Cantiere"}`.trim(),
        giornate: 0,
        ore: 0,
        costo: 0,
        pagato: 0,
        daPagare: 0,
      });
    }
    const riga = mappa.get(id);
    riga.giornate += 1;
    riga.ore += Number(g.ore) || 0;
    const c = Number(g.costo) || 0;
    riga.costo += c;
    if (g.pagato) riga.pagato += c;
    else riga.daPagare += c;
  }
  return [...mappa.values()].sort((a, b) => b.costo - a.costo);
}

/**
 * @param {object[]} cantieri
 * @param {object[]} operai
 * @param {{ da?: Date, a?: Date, operaioId?: string, cantiereId?: string }} filtri
 */
export function costruisciRiepilogoManodopera(cantieri, operai, filtri = {}) {
  const da = filtri.da || inizioSettimana();
  const a = filtri.a || fineSettimana(da);
  const tutte = raccogliGiornateManodopera(cantieri);
  const filtrate = filtraGiornateManodopera(tutte, {
    da,
    a,
    operaioId: filtri.operaioId,
    cantiereId: filtri.cantiereId,
  });
  return {
    da,
    a,
    totali: aggregaTotaliManodopera(filtrate),
    perOperaio: aggregaPerOperaio(filtrate, operai),
    perCantiere: aggregaPerCantiere(filtrate),
    giornate: filtrate,
  };
}
