/**
 * Home Oggi — aggrega dati già presenti (nessuna nuova entità).
 * Solo calcolo: nessuna UI, nessun side-effect.
 */

import { ROUTES, routeCantiere, routePreventivo } from "../../app/routes";
import { selezionaDaComprare } from "../../domain/listaSpesa/acquistiSelectors";
import { preparaAnteprimaGiornata } from "../agenda/giornataSelectors";
import {
  creaFraseGiornata,
  formattaDataGiornata,
  nomeSalutoDaAzienda,
  salutoOrario,
  selezionaCantieriAperti,
  selezionaContinuaDoveHaiLasciato,
  selezionaPreventiviInAttesa,
} from "../dashboard/dashboardSelectors";
import { getDashboardAssistant } from "../../services/assistantService";

/**
 * @param {string|undefined|null} valore
 * @returns {Date|null}
 */
export function parseDataItaliana(valore) {
  const match = String(valore || "")
    .trim()
    .match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const d = new Date(
    Number(match[3]),
    Number(match[2]) - 1,
    Number(match[1]),
    0,
    0,
    0,
    0
  );
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * @param {string|undefined|null} data
 * @param {string|undefined|null} ora
 * @returns {Date|null}
 */
export function combinaDataOra(data, ora = "") {
  const base = parseDataItaliana(data);
  if (!base) return null;
  const [hh = "9", mm = "0"] = String(ora || "09:00").split(":");
  base.setHours(Number(hh) || 9, Number(mm) || 0, 0, 0);
  return base;
}

function inizioGiorno(data = new Date()) {
  return new Date(data.getFullYear(), data.getMonth(), data.getDate());
}

/**
 * Preventivi bozza ancora da inviare.
 * @param {object[]} preventivi
 */
export function selezionaPreventiviDaInviare(preventivi = []) {
  return (preventivi || []).filter((p) => p?.stato === "Bozza");
}

/**
 * Cantieri non completati con data pianificata già passata.
 * @param {object[]} cantieri
 * @param {Date=} oggi
 */
export function selezionaLavoriInRitardo(cantieri = [], oggi = new Date()) {
  const soglia = inizioGiorno(oggi).getTime();
  return (cantieri || []).filter((cantiere) => {
    if (!cantiere || cantiere.stato === "Completato") return false;
    const data =
      parseDataItaliana(cantiere.scheduledDate) ||
      parseDataItaliana(cantiere.extra?.scheduledDate) ||
      parseDataItaliana(cantiere.dataIntervento);
    if (!data) return false;
    return data.getTime() < soglia;
  });
}

/**
 * Promemoria attività imminenti (oggi / prossime 48h).
 * @param {object[]} attivita
 * @param {Date=} oggi
 * @param {number=} oreFinestra
 */
export function selezionaPromemoriaImminenti(
  attivita = [],
  oggi = new Date(),
  oreFinestra = 48
) {
  const now = oggi.getTime();
  const limite = now + oreFinestra * 60 * 60 * 1000;
  const inizioIeri = now - 2 * 60 * 60 * 1000;

  return (attivita || [])
    .filter((voce) => {
      if (!voce || voce.completata) return false;
      const isPromemoria =
        Boolean(voce.reminder) ||
        voce.categoria === "promemoria" ||
        voce.tipo === "promemoria";
      if (!isPromemoria) return false;

      const when = combinaDataOra(voce.data, voce.ora);
      if (!when) return true;
      const t = when.getTime();
      return t >= inizioIeri && t <= limite;
    })
    .sort((a, b) => {
      const ta = combinaDataOra(a.data, a.ora)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const tb = combinaDataOra(b.data, b.ora)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      return ta - tb;
    })
    .slice(0, 5);
}

/**
 * Card assistente Home (alta/media). Mai throw.
 * @param {object=} opzioni
 * @returns {object[]}
 */
export function selezionaAssistantCardsHome(opzioni = {}) {
  try {
    const payload = getDashboardAssistant(opzioni);
    return Array.isArray(payload?.cards) ? payload.cards.slice(0, 3) : [];
  } catch {
    return [];
  }
}

/**
 * Snapshot operativo per la Home Oggi.
 *
 * @param {{
 *   cantieri?: object[],
 *   preventivi?: object[],
 *   listaSpesa?: object[],
 *   attivita?: object[],
 *   datiAzienda?: object,
 *   ora?: Date,
 *   esperienze?: object[],
 * }} input
 */
export function calcolaOggi(input = {}) {
  const sorgente =
    input && typeof input === "object" && !Array.isArray(input) ? input : {};
  const {
    cantieri = [],
    preventivi = [],
    listaSpesa = [],
    attivita = [],
    datiAzienda = {},
    ora = new Date(),
    esperienze,
  } = sorgente;

  const cantieriSafe = Array.isArray(cantieri) ? cantieri : [];
  const preventiviSafe = Array.isArray(preventivi) ? preventivi : [];
  const listaSpesaSafe = Array.isArray(listaSpesa) ? listaSpesa : [];
  const attivitaSafe = Array.isArray(attivita) ? attivita : [];
  const datiAziendaSafe =
    datiAzienda && typeof datiAzienda === "object" ? datiAzienda : {};

  const cantieriAperti = selezionaCantieriAperti(cantieriSafe);
  const preventiviDaInviare = selezionaPreventiviDaInviare(preventiviSafe);
  const preventiviInAttesa = selezionaPreventiviInAttesa(preventiviSafe);
  const materialiDaAcquistare = selezionaDaComprare(listaSpesaSafe);
  const lavoriInRitardo = selezionaLavoriInRitardo(cantieriSafe, ora);
  const promemoria = selezionaPromemoriaImminenti(attivitaSafe, ora);
  const giornata = preparaAnteprimaGiornata(cantieriSafe, ora, 5, {
    attivita: attivitaSafe,
    listaSpesa: listaSpesaSafe,
  });
  const continua = selezionaContinuaDoveHaiLasciato({
    cantieri: cantieriSafe,
    preventivi: preventiviSafe,
  });
  const assistantCards = selezionaAssistantCardsHome(
    esperienze ? { esperienze } : {}
  );

  const riepilogo = [
    {
      id: "cantieri-aperti",
      etichetta: "Cantieri aperti",
      conteggio: cantieriAperti.length,
      link: ROUTES.cantieri,
    },
    {
      id: "preventivi-inviare",
      etichetta: "Da inviare",
      conteggio: preventiviDaInviare.length,
      link:
        preventiviDaInviare[0]?.id
          ? routePreventivo(preventiviDaInviare[0].id)
          : ROUTES.preventivi,
    },
    {
      id: "materiali",
      etichetta: "Da acquistare",
      conteggio: materialiDaAcquistare.length,
      link: ROUTES.acquisti,
    },
    {
      id: "ritardi",
      etichetta: "In ritardo",
      conteggio: lavoriInRitardo.length,
      link: lavoriInRitardo[0]?.id
        ? routeCantiere(lavoriInRitardo[0].id)
        : ROUTES.cantieri,
    },
    {
      id: "promemoria",
      etichetta: "Promemoria",
      conteggio: promemoria.length,
      link: ROUTES.agenda,
    },
  ];

  const haOperativita =
    cantieriAperti.length > 0 ||
    preventiviDaInviare.length > 0 ||
    materialiDaAcquistare.length > 0 ||
    lavoriInRitardo.length > 0 ||
    promemoria.length > 0 ||
    giornata.totaleLavori > 0;

  return {
    saluto: salutoOrario(ora),
    nome: nomeSalutoDaAzienda(datiAziendaSafe),
    dataLabel: formattaDataGiornata(ora),
    frase: creaFraseGiornata({
      interventiOggi: giornata.totaleLavori,
      preventiviInAttesa: preventiviInAttesa.length,
      haSaldoDaIncassare: false,
    }),
    riepilogo,
    cantieriAperti,
    preventiviDaInviare,
    materialiDaAcquistare,
    lavoriInRitardo,
    promemoria,
    assistantCards,
    giornata,
    continua,
    vuoto: !haOperativita,
  };
}
