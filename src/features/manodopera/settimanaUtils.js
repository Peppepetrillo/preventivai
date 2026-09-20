/**
 * Utilità settimana (lun→dom) per riepilogo manodopera.
 */

import { parseDataProgrammazione } from "../cantieri/services/programmazioneCantiereService";

/**
 * Lunedì 00:00 della settimana che contiene `riferimento`.
 * @param {Date=} riferimento
 * @returns {Date}
 */
export function inizioSettimana(riferimento = new Date()) {
  const d = new Date(riferimento);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0 dom … 6 sab
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

/**
 * @param {Date} lunedi
 * @returns {Date}
 */
export function fineSettimana(lunedi) {
  const d = new Date(lunedi);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 6);
  return d;
}

/**
 * @param {Date} lunedi
 * @param {number} delta
 */
export function spostaSettimana(lunedi, delta) {
  const d = new Date(lunedi);
  d.setDate(d.getDate() + delta * 7);
  return inizioSettimana(d);
}

/**
 * @param {Date} data
 */
export function formattaDataIt(data) {
  const d = data instanceof Date ? data : new Date(data);
  const gg = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const aa = d.getFullYear();
  return `${gg}/${mm}/${aa}`;
}

/**
 * @param {Date} lunedi
 * @param {Date=} domenica
 */
export function etichettaIntervalloSettimana(lunedi, domenica = fineSettimana(lunedi)) {
  const mesi = [
    "gennaio",
    "febbraio",
    "marzo",
    "aprile",
    "maggio",
    "giugno",
    "luglio",
    "agosto",
    "settembre",
    "ottobre",
    "novembre",
    "dicembre",
  ];
  const stessoMese = lunedi.getMonth() === domenica.getMonth();
  const stessoAnno = lunedi.getFullYear() === domenica.getFullYear();
  if (stessoMese && stessoAnno) {
    return `${lunedi.getDate()}–${domenica.getDate()} ${mesi[lunedi.getMonth()]}`;
  }
  if (stessoAnno) {
    return `${lunedi.getDate()} ${mesi[lunedi.getMonth()]} – ${domenica.getDate()} ${mesi[domenica.getMonth()]}`;
  }
  return `${lunedi.getDate()} ${mesi[lunedi.getMonth()]} ${lunedi.getFullYear()} – ${domenica.getDate()} ${mesi[domenica.getMonth()]} ${domenica.getFullYear()}`;
}

/**
 * @param {string} dataIt
 * @param {Date} da
 * @param {Date} a
 */
export function dataInIntervallo(dataIt, da, a) {
  const d = parseDataProgrammazione(dataIt);
  if (!d) return false;
  const t = d.getTime();
  const start = new Date(da);
  start.setHours(0, 0, 0, 0);
  const end = new Date(a);
  end.setHours(23, 59, 59, 999);
  return t >= start.getTime() && t <= end.getTime();
}
