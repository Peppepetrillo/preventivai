import { routeCantiere } from "../../app/routes";
import {
  classeBadgeStatoAgenda,
  etichettaStatoAgenda,
  leggiDataCantiere,
  leggiOrarioCantiere,
  saldoResiduoCantiere,
  statoAgendaDaCantiere,
  telefonoCantiere,
} from "../agenda/agendaSelectors";
import { TIPO_LAVORO } from "./lavoriTypes";

const ETICHETTE_TIPO = {
  [TIPO_LAVORO.CANTIERE]: "Cantiere",
  [TIPO_LAVORO.INTERVENTO]: "Intervento",
  [TIPO_LAVORO.SOPRALLUOGO]: "Sopralluogo",
  [TIPO_LAVORO.MANUTENZIONE]: "Manutenzione",
};

/**
 * Risolve il tipo lavoro da un record cantiere (retrocompatibile).
 * @param {object} record
 * @returns {import("./lavoriTypes").TipoLavoro}
 */
export function risolviTipoLavoro(record = {}) {
  const grezzo = String(
    record.tipoLavoro || record.extra?.tipoLavoro || ""
  ).trim().toLowerCase();

  if (grezzo === TIPO_LAVORO.SOPRALLUOGO) return TIPO_LAVORO.SOPRALLUOGO;
  if (grezzo === TIPO_LAVORO.MANUTENZIONE) return TIPO_LAVORO.MANUTENZIONE;
  if (grezzo === TIPO_LAVORO.INTERVENTO || grezzo === "express") {
    return TIPO_LAVORO.INTERVENTO;
  }
  if (grezzo === TIPO_LAVORO.CANTIERE) return TIPO_LAVORO.CANTIERE;

  if (record.origine === "sopralluogo") return TIPO_LAVORO.SOPRALLUOGO;
  return TIPO_LAVORO.CANTIERE;
}

/**
 * @param {import("./lavoriTypes").TipoLavoro} tipo
 */
export function etichettaTipoLavoro(tipo) {
  return ETICHETTE_TIPO[tipo] || ETICHETTE_TIPO[TIPO_LAVORO.CANTIERE];
}

/**
 * Formatta la durata stimata in minuti per UI.
 * @param {number|string|null|undefined} minuti
 */
export function formattaDurataStimata(minuti) {
  const valore = Number(minuti);
  if (!Number.isFinite(valore) || valore <= 0) return "";
  if (valore < 60) return `${Math.round(valore)} min`;
  const ore = Math.floor(valore / 60);
  const resto = Math.round(valore % 60);
  if (resto === 0) return `${ore} h`;
  return `${ore} h ${resto} min`;
}

/**
 * Legge la durata stimata da un record cantiere.
 * @param {object} record
 */
export function leggiDurataStimata(record = {}) {
  const grezzo =
    record.durataStimata ??
    record.extra?.durataStimata ??
    record.durataMinuti ??
    record.extra?.durataMinuti ??
    null;
  const valore = Number(grezzo);
  return Number.isFinite(valore) && valore > 0 ? valore : null;
}

/**
 * Proietta un cantiere in un Lavoro normalizzato per agenda e home.
 * @param {object} cantiere
 */
export function creaLavoroDaCantiere(cantiere = {}) {
  const checklist = Array.isArray(cantiere.checklist) ? cantiere.checklist : [];
  const materiali = Array.isArray(cantiere.materiali) ? cantiere.materiali : [];
  const statoAgenda = statoAgendaDaCantiere(cantiere.stato);
  const tipoLavoro = risolviTipoLavoro(cantiere);
  const durataStimata = leggiDurataStimata(cantiere);

  return {
    id: cantiere.id,
    tipoLavoro,
    tipoLavoroLabel: etichettaTipoLavoro(tipoLavoro),
    titolo: cantiere.nome || cantiere.cliente || etichettaTipoLavoro(tipoLavoro),
    cliente: cantiere.cliente || "",
    indirizzo: cantiere.indirizzo || "",
    data: leggiDataCantiere(cantiere),
    orario: leggiOrarioCantiere(cantiere),
    durataStimata,
    durataStimataLabel: formattaDurataStimata(durataStimata),
    stato: statoAgenda,
    statoLabel: etichettaStatoAgenda(statoAgenda),
    statoBadgeClass: classeBadgeStatoAgenda(statoAgenda),
    statoCantiere: cantiere.stato || "Da iniziare",
    checklist: checklist
      .filter((voce) => voce && !voce.completata)
      .map((voce) => voce.testo)
      .slice(0, 4),
    materialiDaPortare: materiali
      .filter((m) => m && m.acquistato)
      .map((m) => ({
        nome: m.nome,
        quantita: Number(m.quantita) || 0,
        unita: m.unita || "cad",
      })),
    materialiDaComprare: materiali
      .filter((m) => m && !m.acquistato)
      .map((m) => ({
        nome: m.nome,
        quantita: Number(m.quantita) || 0,
        unita: m.unita || "cad",
      })),
    saldo: saldoResiduoCantiere(cantiere),
    telefono: telefonoCantiere(cantiere),
    link: routeCantiere(cantiere.id),
    urgente: Boolean(cantiere.urgente || cantiere.extra?.urgente),
    cantiere,
  };
}

/**
 * @param {ReturnType<typeof creaLavoroDaCantiere>[]} lavori
 */
export function calcolaOrePreviste(lavori = []) {
  const minuti = lavori.reduce(
    (acc, lavoro) => acc + (Number(lavoro.durataStimata) || 0),
    0
  );
  return {
    minuti,
    label: formattaDurataStimata(minuti) || "—",
  };
}
