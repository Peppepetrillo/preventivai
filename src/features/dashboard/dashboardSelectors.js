import { calcolaAvanzamentoChecklist } from "../cantieri/cantieriDomain";
import {
  calcolaRimanenzaCantiere,
} from "../cantieri/services/pagamentiCantiereService";
import { ROUTES, routeCantiere, routeCantierePagamenti, routePreventiviLista, routePreventivo } from "../../app/routes";
import { FILTRI_PREVENTIVO } from "../preventivi/archivioPreventiviUtils";
import { selezionaDaComprare } from "../../domain/listaSpesa/acquistiSelectors";
import { formatEuro } from "../../utils/preventivi";
import { preparaAnteprimaGiornata } from "../agenda/giornataSelectors";

const PRIORITA_DA_FARE = {
  URGENTE: 1,
  INCASSO: 2,
  PREVENTIVO: 3,
  MATERIALE: 4,
  PROMEMORIA: 5,
};

export function selezionaCantieriAperti(cantieri = []) {
  return cantieri.filter((cantiere) => cantiere.stato !== "Completato");
}

export function selezionaPreventiviInAttesa(preventivi = []) {
  return preventivi.filter((preventivo) => preventivo.stato === "Inviato");
}

export function preparaCantieriOperativi(cantieri = []) {
  return selezionaCantieriAperti(cantieri).map((cantiere) => ({
    ...cantiere,
    avanzamento: calcolaAvanzamentoChecklist(cantiere.checklist || []),
  }));
}

/** @deprecated Preferisci creaFraseGiornata — mantenuto per compat test/UI legacy. */
export function creaMessaggioOperativo({ nome, cantieriAperti, preventiviInAttesa }) {
  const destinatario = nome ? ` ${nome}` : "";
  const cantieri =
    cantieriAperti === 1 ? "1 cantiere aperto" : `${cantieriAperti} cantieri aperti`;
  const preventivi =
    preventiviInAttesa === 1
      ? "1 preventivo in attesa"
      : `${preventiviInAttesa} preventivi in attesa`;

  return `Buongiorno${destinatario}. Hai ${cantieri} e ${preventivi}.`;
}

/**
 * Nome breve per saluto (prima parola di ditta / operatore).
 * Solo presentazione Home.
 */
export function nomeSalutoDaAzienda(datiAzienda = {}) {
  const grezzo = String(
    datiAzienda.nomeOperatore ||
      datiAzienda.referente ||
      datiAzienda.nomeDitta ||
      ""
  ).trim();
  if (!grezzo) return "";
  return grezzo.split(/\s+/)[0];
}

export function formattaDataGiornata(data = new Date()) {
  const testo = data.toLocaleDateString("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return testo.charAt(0).toUpperCase() + testo.slice(1);
}

export function salutoOrario(data = new Date()) {
  const ora = data.getHours();
  if (ora < 12) return "Buongiorno";
  if (ora < 18) return "Buon pomeriggio";
  return "Buonasera";
}

/**
 * Interventi della giornata — delega alla logica agenda unificata.
 * @deprecated Preferisci preparaAnteprimaGiornata / preparaRiepilogoGiornata.
 */
export function selezionaInterventiOggi(cantieri = [], limite = 5) {
  return preparaAnteprimaGiornata(cantieri, new Date(), limite).lavori.map(
    (lavoro) => ({
      id: lavoro.id,
      cliente: lavoro.cliente || lavoro.titolo || "Cliente non indicato",
      indirizzo: lavoro.indirizzo || "",
      nome: lavoro.titolo || "",
      orario: lavoro.orario || "",
      tipoLavoro: lavoro.tipoLavoro,
      link: lavoro.link,
    })
  );
}

function haMaterialeDaComprare(cantieri = []) {
  return cantieri.some((cantiere) =>
    (cantiere.materiali || []).some((m) => m && !m.acquistato)
  );
}

function primoCantiereConMateriale(cantieri = []) {
  return cantieri.find((cantiere) =>
    (cantiere.materiali || []).some((m) => m && !m.acquistato)
  );
}

function preventiviDaInviare(preventivi = []) {
  return preventivi.filter((p) => p.stato === "Bozza");
}

function haPagamentoDaRegistrare(cantieri = []) {
  return cantieri.some((cantiere) => {
    if (cantiere.stato === "Completato") return false;
    return calcolaRimanenzaCantiere(cantiere) > 0;
  });
}

/**
 * Alert operativi — massimo 3, solo utilità immediata.
 */
export function selezionaAttenzioni({
  cantieri = [],
  preventivi = [],
  massimo = 3,
} = {}) {
  const aperti = selezionaCantieriAperti(cantieri);
  const bozze = preventiviDaInviare(preventivi);
  const items = [];

  if (haMaterialeDaComprare(aperti)) {
    const target = primoCantiereConMateriale(aperti);
    items.push({
      id: "materiale",
      testo: "Materiale da comprare",
      link: target?.id ? routeCantiere(target.id) : ROUTES.cantieri,
    });
  }

  if (bozze.length > 0) {
    items.push({
      id: "preventivi-inviare",
      testo:
        bozze.length === 1
          ? "Preventivo da inviare"
          : `${bozze.length} preventivi da inviare`,
      link: routePreventiviLista({ filtro: FILTRI_PREVENTIVO.BOZZE }),
    });
  }

  if (haPagamentoDaRegistrare(aperti)) {
    const saldi = selezionaSaldiDaIncassare(aperti);
    const target = saldi[0]?.cantiere;
    items.push({
      id: "pagamenti",
      testo: "Pagamenti da registrare",
      link: target?.id
        ? routeCantierePagamenti(target.id)
        : ROUTES.cantieri,
    });
  }

  if (aperti.length > 0) {
    items.push({
      id: "cantieri-aperti",
      testo:
        aperti.length === 1
          ? "Cantiere non completato"
          : `${aperti.length} cantieri non completati`,
      link: ROUTES.cantieri,
    });
  }

  return items.slice(0, massimo);
}

/**
 * Cantieri con rimanenza da incassare (UX-7.5), ordinati per importo decrescente.
 * @param {object[]} cantieri
 */
export function selezionaSaldiDaIncassare(cantieri = []) {
  return (cantieri || [])
    .filter((c) => c && c.stato !== "Completato")
    .map((cantiere) => ({
      cantiere,
      rimanenza: calcolaRimanenzaCantiere(cantiere),
    }))
    .filter((voce) => voce.rimanenza > 0)
    .sort((a, b) => b.rimanenza - a.rimanenza);
}

/**
 * Voci "Da fare" per la Home — massimo 3, priorità operativa.
 * @param {{
 *   cantieri?: object[],
 *   preventivi?: object[],
 *   listaSpesa?: object[],
 *   lavoriInRitardo?: object[],
 *   urgenze?: object[],
 *   promemoria?: object[],
 *   massimo?: number,
 * }} opzioni
 */
export function selezionaDaFareHome({
  cantieri = [],
  preventivi = [],
  listaSpesa = [],
  lavoriInRitardo = [],
  urgenze = [],
  promemoria = [],
  massimo = 3,
} = {}) {
  const candidati = [];

  for (const cantiere of lavoriInRitardo) {
    candidati.push({
      id: `ritardo-${cantiere.id}`,
      priorita: PRIORITA_DA_FARE.URGENTE,
      titolo: cantiere.cliente || cantiere.nome || "Cantiere",
      sottotitolo: "Lavoro in ritardo",
      link: routeCantiere(cantiere.id),
      testId: "home-da-fare-ritardo",
    });
  }

  for (const urgenza of urgenze) {
    candidati.push({
      id: `urgenza-${urgenza.id}`,
      priorita: PRIORITA_DA_FARE.URGENTE,
      titolo: urgenza.titolo || "Urgente",
      sottotitolo: "Da sistemare oggi",
      link: ROUTES.agenda,
      testId: "home-da-fare-urgente",
    });
  }

  for (const { cantiere, rimanenza } of selezionaSaldiDaIncassare(cantieri)) {
    candidati.push({
      id: `incasso-${cantiere.id}`,
      priorita: PRIORITA_DA_FARE.INCASSO,
      importoLabel: formatEuro(rimanenza),
      titolo: cantiere.cliente || cantiere.nome || "Cantiere",
      sottotitolo: "Resta da incassare",
      link: routeCantierePagamenti(cantiere.id),
      testId: "home-da-fare-incasso",
    });
  }

  const bozze = (preventivi || []).filter((p) => p?.stato === "Bozza");
  for (const preventivo of bozze) {
    const cliente = String(preventivo.cliente || preventivo.numero || "").trim();
    candidati.push({
      id: `preventivo-${preventivo.id}`,
      priorita: PRIORITA_DA_FARE.PREVENTIVO,
      titolo: cliente ? `Preventivo ${cliente}` : "Preventivo da inviare",
      sottotitolo: "Da inviare",
      link: routePreventivo(preventivo.id),
      testId: "home-da-fare-preventivo",
    });
  }

  const materiali = selezionaDaComprare(listaSpesa);
  if (materiali.length > 0) {
    candidati.push({
      id: "materiali",
      priorita: PRIORITA_DA_FARE.MATERIALE,
      titolo:
        materiali.length === 1
          ? materiali[0].nome
          : `${materiali.length} materiali`,
      sottotitolo: "Da comprare",
      link: ROUTES.acquisti,
      testId: "home-da-fare-acquisti",
    });
  }

  for (const voce of promemoria) {
    candidati.push({
      id: `promemoria-${voce.id}`,
      priorita: PRIORITA_DA_FARE.PROMEMORIA,
      titolo: voce.titolo || "Promemoria",
      sottotitolo: [voce.data, voce.ora].filter(Boolean).join(" · ") || "Promemoria",
      link: ROUTES.agenda,
      testId: "home-da-fare-promemoria",
    });
  }

  const visti = new Set();
  return candidati
    .filter((voce) => {
      if (visti.has(voce.id)) return false;
      visti.add(voce.id);
      return true;
    })
    .sort((a, b) => a.priorita - b.priorita)
    .slice(0, massimo);
}

function formattaUltimaAttivitaRelativa(record = {}, ora = new Date()) {
  const t = timestampRecord(record);
  if (!t) return "";
  const inizioOggi = new Date(ora.getFullYear(), ora.getMonth(), ora.getDate()).getTime();
  const inizioRecord = new Date(
    new Date(t).getFullYear(),
    new Date(t).getMonth(),
    new Date(t).getDate()
  ).getTime();
  const diffGiorni = Math.round((inizioOggi - inizioRecord) / (24 * 60 * 60 * 1000));
  if (diffGiorni <= 0) return "Ultima attività: oggi";
  if (diffGiorni === 1) return "Ultima attività: ieri";
  return `Ultima attività: ${diffGiorni} giorni fa`;
}

function timestampRecord(record = {}) {
  const grezzo =
    record.aggiornatoIl ||
    record.aggiornato ||
    record.data ||
    record.dataCreazione ||
    record.creatoIl ||
    "";
  const match = String(grezzo).match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (match) {
    return new Date(
      Number(match[3]),
      Number(match[2]) - 1,
      Number(match[1])
    ).getTime();
  }
  const iso = Date.parse(String(grezzo));
  return Number.isFinite(iso) ? iso : 0;
}

/**
 * Ultimo lavoro toccato (preventivo o cantiere) per ripresa rapida.
 */
export function selezionaContinuaDoveHaiLasciato({
  cantieri = [],
  preventivi = [],
  ora = new Date(),
} = {}) {
  const candidati = [
    ...cantieri.map((item) => ({
      tipo: "cantiere",
      item,
      t: timestampRecord(item),
      etichetta: "Cantiere",
      titolo: item.cliente || item.nome || "Cantiere",
      dettaglio: item.nome || item.indirizzo || "",
      link: routeCantiere(item.id),
    })),
    ...preventivi.map((item) => ({
      tipo: "preventivo",
      item,
      t: timestampRecord(item),
      etichetta: "Preventivo",
      titolo: item.cliente || item.numero || "Preventivo",
      dettaglio: item.numero || item.stato || "",
      link: routePreventivo(item.id),
    })),
  ];

  if (candidati.length === 0) return null;

  candidati.sort((a, b) => {
    if (b.t !== a.t) return b.t - a.t;
    return String(b.item.id).localeCompare(String(a.item.id), "it");
  });

  const top = candidati[0];
  const dettaglioTempo = formattaUltimaAttivitaRelativa(top.item, ora);
  return {
    tipo: top.tipo,
    etichetta: top.etichetta,
    titolo: top.titolo,
    dettaglio: dettaglioTempo || top.dettaglio,
    link: top.link,
  };
}

/**
 * Frase dinamica sotto la data — una sola, priorità operativa.
 */
export function creaFraseGiornata({
  lavoriOggi = 0,
  interventiOggi = 0,
  urgenti = 0,
} = {}) {
  const totaleLavori = lavoriOggi || interventiOggi;
  if (totaleLavori > 0) {
    return totaleLavori === 1
      ? "Hai 1 lavoro oggi"
      : `Hai ${totaleLavori} lavori oggi`;
  }
  if (urgenti > 0) {
    return urgenti === 1
      ? "Hai 1 cosa da sistemare"
      : `Hai ${urgenti} cose da sistemare`;
  }
  return "Oggi non hai lavori programmati";
}
