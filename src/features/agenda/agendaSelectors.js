import { selezionaDaComprareOggi } from "../../domain/listaSpesa/acquistiSelectors";
import {
  giornatePerGiorno,
  haProgrammazioneMultiGiorno,
} from "../cantieri/services/programmazioneCantiereService";
import { calcolaRimanenzaCantiere } from "../cantieri/services/pagamentiCantiereService";
import { registroPerGiorno } from "../cantieri/services/registroGiornateService";
import {
  creaLavoroDaCantiere,
  creaLavoroDaGiornataLavorativa,
  creaLavoroDaGiornataProgrammata,
} from "../lavori/lavoriDomain";

/** @typedef {"pianificato"|"programmato"|"in-corso"|"completato"|"rimandato"} StatoAgenda */

/**
 * Normalizza una data a mezzanotte locale.
 * @param {Date} data
 */
export function inizioGiornata(data) {
  const d = new Date(data);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Aggiunge giorni a una data.
 * @param {Date} data
 * @param {number} giorni
 */
export function aggiungiGiorni(data, giorni) {
  const d = new Date(data);
  d.setDate(d.getDate() + giorni);
  return inizioGiornata(d);
}

/**
 * Differenza in giorni tra due date (a - b).
 * @param {Date} a
 * @param {Date} b
 */
export function differenzaGiorni(a, b) {
  const ms = inizioGiornata(a).getTime() - inizioGiornata(b).getTime();
  return Math.round(ms / 86_400_000);
}

/**
 * Parse data italiana DD/MM/YYYY o ISO.
 * @param {string|number|Date|null|undefined} grezzo
 * @returns {Date|null}
 */
export function parseDataAgenda(grezzo) {
  if (!grezzo) return null;
  if (grezzo instanceof Date && !Number.isNaN(grezzo.getTime())) {
    return inizioGiornata(grezzo);
  }

  const testo = String(grezzo).trim();
  const matchIt = testo.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (matchIt) {
    const d = new Date(
      Number(matchIt[3]),
      Number(matchIt[2]) - 1,
      Number(matchIt[1])
    );
    return Number.isNaN(d.getTime()) ? null : inizioGiornata(d);
  }

  const iso = Date.parse(testo);
  if (Number.isFinite(iso)) return inizioGiornata(new Date(iso));
  return null;
}

/**
 * Legge la data programmata da un cantiere (campi già esistenti).
 * @param {object} cantiere
 */
export function leggiDataCantiere(cantiere = {}) {
  const grezzo =
    cantiere.scheduledDate ||
    cantiere.dataIntervento ||
    cantiere.dataProgrammata ||
    cantiere.dataAppuntamento ||
    cantiere.data ||
    cantiere.extra?.scheduledDate ||
    cantiere.extra?.dataIntervento ||
    cantiere.extra?.dataProgrammata ||
    cantiere.extra?.data ||
    null;
  return parseDataAgenda(grezzo);
}

/**
 * Legge l'orario da un cantiere.
 * @param {object} cantiere
 */
export function leggiOrarioCantiere(cantiere = {}) {
  return String(
    cantiere.scheduledTime ||
      cantiere.orario ||
      cantiere.ora ||
      cantiere.extra?.scheduledTime ||
      cantiere.extra?.orario ||
      cantiere.extra?.ora ||
      ""
  ).trim();
}

/**
 * Minuti dall'inizio giornata per ordinamento cronologico.
 * @param {string} orario
 */
export function minutiOrario(orario) {
  const match = String(orario).match(/^(\d{1,2}):(\d{2})/);
  if (!match) return 24 * 60;
  return Number(match[1]) * 60 + Number(match[2]);
}

/**
 * Mappa stato cantiere → stato agenda.
 * @param {string} stato
 * @returns {StatoAgenda}
 */
export function statoAgendaDaCantiere(stato) {
  if (stato === "Completato") return "completato";
  if (stato === "Rimandato") return "rimandato";
  if (stato === "In corso" || stato === "In pausa") return "in-corso";
  return "pianificato";
}

/**
 * Etichetta UI per stato agenda.
 * @param {StatoAgenda} stato
 */
export function etichettaStatoAgenda(stato) {
  if (stato === "completato") return "Completato";
  if (stato === "in-corso") return "In corso";
  if (stato === "rimandato") return "Rimandato";
  return "Pianificato";
}

/**
 * Classe badge DS per stato agenda.
 * @param {StatoAgenda} stato
 */
export function classeBadgeStatoAgenda(stato) {
  if (stato === "completato") return "ds-badge ds-badge-completato";
  if (stato === "in-corso") return "ds-badge ds-badge-in-corso";
  if (stato === "rimandato") return "ds-badge ds-badge-sospeso";
  return "ds-badge ds-badge-da-iniziare";
}

/**
 * Saldo residuo da incassare (allineato a pagamenti[] / UX-7.5).
 * @param {object} cantiere
 */
export function saldoResiduoCantiere(cantiere = {}) {
  return calcolaRimanenzaCantiere(cantiere);
}

/**
 * Telefono cliente da record cantiere.
 * @param {object} cantiere
 */
export function telefonoCantiere(cantiere = {}) {
  return String(
    cantiere.telefono ||
      cantiere.extra?.telefono ||
      cantiere.clienteTelefono ||
      ""
  ).trim();
}

/**
 * Trasforma un cantiere in intervento agenda (alias Lavoro).
 * @param {object} cantiere
 */
export function creaInterventoAgenda(cantiere = {}) {
  return creaLavoroDaCantiere(cantiere);
}

/**
 * Espande un cantiere in uno o più lavori agenda per il giorno.
 * Include programmazione (UX-7.3) e registro lavorativo (UX-7.4).
 * @param {object} cantiere
 * @param {Date} giorno
 */
export function espandiCantiereInLavoriGiorno(cantiere, giorno) {
  const registro = registroPerGiorno(cantiere, giorno).map((giornata) =>
    creaLavoroDaGiornataLavorativa(cantiere, giornata)
  );

  if (haProgrammazioneMultiGiorno(cantiere)) {
    const programmate = giornatePerGiorno(cantiere, giorno).map((giornata) =>
      creaLavoroDaGiornataProgrammata(cantiere, giornata)
    );
    return [...programmate, ...registro];
  }

  const dataProgrammata = leggiDataCantiere(cantiere);
  const giornoNorm = inizioGiornata(giorno);
  const items = [];

  if (dataProgrammata && dataProgrammata.getTime() === giornoNorm.getTime()) {
    items.push(creaInterventoAgenda(cantiere));
  } else if (!dataProgrammata && registro.length === 0) {
    // Cantiere aperto senza data (solo "oggi"): il filtro ha già validato.
    items.push(creaInterventoAgenda(cantiere));
  }

  return [...items, ...registro];
}

/**
 * Un cantiere compare nel giorno se ha programmazione, registro, data legacy o (oggi) aperto.
 * @param {object} cantiere
 * @param {Date} giorno
 * @param {Date} oggi
 */
export function cantiereAppartieneAlGiorno(cantiere, giorno, oggi) {
  if (registroPerGiorno(cantiere, giorno).length > 0) {
    return true;
  }

  if (haProgrammazioneMultiGiorno(cantiere)) {
    return giornatePerGiorno(cantiere, giorno).length > 0;
  }

  const dataProgrammata = leggiDataCantiere(cantiere);
  if (dataProgrammata) {
    return dataProgrammata.getTime() === inizioGiornata(giorno).getTime();
  }

  const diffOggi = differenzaGiorni(giorno, oggi);
  if (diffOggi !== 0) return false;

  const stato = cantiere.stato || "Da iniziare";
  return stato !== "Completato";
}

/**
 * Seleziona e ordina interventi per un giorno.
 * @param {object[]} cantieri
 * @param {Date} giorno
 * @param {Date} [oggi]
 */
export function selezionaInterventiGiorno(cantieri = [], giorno, oggi = new Date()) {
  const giornoNorm = inizioGiornata(giorno);
  const oggiNorm = inizioGiornata(oggi);

  return cantieri
    .filter((c) => c && cantiereAppartieneAlGiorno(c, giornoNorm, oggiNorm))
    .flatMap((c) => espandiCantiereInLavoriGiorno(c, giornoNorm))
    .sort((a, b) => {
      const diffOrario = minutiOrario(a.orario) - minutiOrario(b.orario);
      if (diffOrario !== 0) return diffOrario;
      const peso = (stato) => {
        if (stato === "in-corso") return 0;
        if (stato === "pianificato" || stato === "programmato") return 1;
        if (stato === "rimandato") return 2;
        return 3;
      };
      return peso(a.stato) - peso(b.stato);
    });
}

/**
 * Aggrega materiali da portare e da comprare per un insieme di interventi.
 * @param {ReturnType<typeof creaInterventoAgenda>[]} interventi
 */
export function aggregaMaterialiGiorno(interventi = []) {
  const daPortare = new Map();
  const mancanti = new Map();

  for (const intervento of interventi) {
    const materiali = intervento.cantiere?.materiali || [];
    for (const mat of materiali) {
      if (!mat?.nome) continue;
      const chiave = mat.nome.trim().toLowerCase();
      const quantita = Number(mat.quantita) || 0;
      const unita = mat.unita || "cad";

      if (mat.acquistato) {
        const esistente = daPortare.get(chiave) || {
          nome: mat.nome.trim(),
          quantita: 0,
          unita,
        };
        esistente.quantita += quantita;
        daPortare.set(chiave, esistente);
      } else {
        const esistente = mancanti.get(chiave) || {
          nome: mat.nome.trim(),
          quantita: 0,
          unita,
        };
        esistente.quantita += quantita;
        mancanti.set(chiave, esistente);
      }
    }
  }

  return {
    daPortare: [...daPortare.values()].sort((a, b) =>
      a.nome.localeCompare(b.nome, "it")
    ),
    mancanti: [...mancanti.values()].sort((a, b) =>
      a.nome.localeCompare(b.nome, "it")
    ),
  };
}

/**
 * Etichetta navigazione giorno.
 * @param {Date} giorno
 * @param {Date} oggi
 */
export function etichettaGiornoNav(giorno, oggi = new Date()) {
  const diff = differenzaGiorni(giorno, oggi);
  if (diff === 0) return "Oggi";
  if (diff === -1) return "Ieri";
  if (diff === 1) return "Domani";
  return giorno.toLocaleDateString("it-IT", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

/**
 * Titolo card preparazione per il giorno successivo.
 * @param {Date} giornoSelezionato
 * @param {Date} oggi
 */
export function etichettaPreparazione(giornoSelezionato, oggi = new Date()) {
  const diff = differenzaGiorni(giornoSelezionato, oggi);
  if (diff === 0) return "Domani hai";
  if (diff === -1) return "Oggi hai";
  return `${aggiungiGiorni(giornoSelezionato, 1).toLocaleDateString("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })} hai`;
}

/**
 * Riepilogo preparazione per il giorno successivo a quello selezionato.
 * "Mancano" allineato alla fonte Acquisti quando listaSpesa è fornita.
 *
 * @param {object[]} cantieri
 * @param {Date} giornoSelezionato
 * @param {Date} [oggi]
 * @param {{ listaSpesa?: object[] }=} extra
 */
export function preparaRiepilogoGiornoSuccessivo(
  cantieri = [],
  giornoSelezionato,
  oggi = new Date(),
  extra = {}
) {
  const giornoTarget = aggiungiGiorni(giornoSelezionato, 1);
  const interventi = selezionaInterventiGiorno(cantieri, giornoTarget, oggi);
  const materialiCantiere = aggregaMaterialiGiorno(interventi);
  const listaSpesa = Array.isArray(extra.listaSpesa) ? extra.listaSpesa : null;

  const mancanti = listaSpesa
    ? selezionaDaComprareOggi(listaSpesa, interventi).map((voce) => ({
        nome: voce.nome,
        quantita: voce.quantita,
        unita: voce.unita || "cad",
      }))
    : materialiCantiere.mancanti;

  return {
    giorno: giornoTarget,
    etichetta: etichettaPreparazione(giornoSelezionato, oggi),
    interventi: interventi.length,
    materiali: {
      daPortare: materialiCantiere.daPortare,
      mancanti,
    },
  };
}
