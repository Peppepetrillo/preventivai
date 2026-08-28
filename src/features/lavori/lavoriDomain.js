import { routeCantiere, routeCantiereGiornate, routeCantiereGiornateFatto } from "../../app/routes";
import {
  leggiOrarioCantiere,
  saldoResiduoCantiere,
  telefonoCantiere,
} from "../agenda/agendaSelectors";
import {
  calcolaOreUomo,
  classeBadgeStatoGiornata,
  etichettaStatoGiornata,
  normalizzaStatoGiornata,
  parseDataProgrammazione,
  STATI_GIORNATA,
} from "../cantieri/services/programmazioneCantiereService";
import {
  formattaNomiOperai,
} from "../cantieri/services/registroGiornateService";
import { giornataProgrammataConsuntivoMancante } from "../agenda/giornataConsuntivoUi";
import { TIPO_LAVORO } from "./lavoriTypes";
import {
  classeBadgeStatoPianificazione,
  etichettaStatoPianificazione,
  glifoStatoPianificazione,
  leggiScheduling,
  parseDataScheduling,
  risolviStatoPianificazione,
} from "./schedulingDomain";

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
  )
    .trim()
    .toLowerCase();

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
  return leggiScheduling(record).estimatedDuration;
}

/**
 * Proietta un cantiere in un Lavoro normalizzato per agenda e home.
 * @param {object} cantiere
 */
export function creaLavoroDaCantiere(cantiere = {}) {
  const checklist = Array.isArray(cantiere.checklist) ? cantiere.checklist : [];
  const materiali = Array.isArray(cantiere.materiali) ? cantiere.materiali : [];
  const scheduling = leggiScheduling(cantiere);
  const statoAgenda = risolviStatoPianificazione(cantiere);
  const tipoLavoro = risolviTipoLavoro(cantiere);
  const durataStimata = scheduling.estimatedDuration;
  const dataParsed = parseDataScheduling(scheduling.scheduledDate);

  return {
    id: cantiere.id,
    kind: "lavoro",
    tipoLavoro,
    tipoLavoroLabel: etichettaTipoLavoro(tipoLavoro),
    titolo: cantiere.nome || cantiere.cliente || etichettaTipoLavoro(tipoLavoro),
    cliente: cantiere.cliente || "",
    indirizzo: cantiere.indirizzo || "",
    data: dataParsed,
    orario: scheduling.scheduledTime || leggiOrarioCantiere(cantiere),
    scheduledDate: scheduling.scheduledDate,
    scheduledTime: scheduling.scheduledTime,
    estimatedDuration: durataStimata,
    durataStimata,
    durataStimataLabel: formattaDurataStimata(durataStimata),
    startAt: scheduling.startAt,
    endAt: scheduling.endAt,
    reminderEnabled: scheduling.reminderEnabled,
    reminderMinutes: scheduling.reminderMinutes,
    priorita: cantiere.priorita || cantiere.extra?.priorita || "media",
    stato: statoAgenda,
    /** Alias retrocompat per confronti che usano ancora "programmato" */
    statoAgendaCompat:
      statoAgenda === "pianificato" ? "programmato" : statoAgenda,
    statoLabel: etichettaStatoPianificazione(statoAgenda),
    statoBadgeClass: classeBadgeStatoPianificazione(statoAgenda),
    statoGlifo: glifoStatoPianificazione(statoAgenda),
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
    urgente: Boolean(
      cantiere.urgente ||
        cantiere.extra?.urgente ||
        cantiere.priorita === "alta"
    ),
    cantiere,
  };
}

/**
 * Proietta una giornata programmata del cantiere in un Lavoro agenda (UX-7.3).
 * @param {object} cantiere
 * @param {object} giornata
 */
export function creaLavoroDaGiornataProgrammata(cantiere = {}, giornata = {}) {
  const base = creaLavoroDaCantiere(cantiere);
  const statoGiornata = normalizzaStatoGiornata(giornata.stato);
  const statoAgenda =
    statoGiornata === "completata"
      ? "completato"
      : statoGiornata === "in-corso"
        ? "in-corso"
        : statoGiornata === "annullata"
          ? "rimandato"
          : "pianificato";
  const orePreviste = Number(giornata.orePreviste) || 0;
  const minuti = orePreviste > 0 ? Math.round(orePreviste * 60) : 0;
  const dataParsed = parseDataProgrammazione(giornata.data);
  const operai = Math.max(1, Math.round(Number(giornata.operai) || 1));
  const attivita = String(giornata.attivita || "").trim();
  const oreUomo = calcolaOreUomo(giornata);
  const consuntivoMancante = giornataProgrammataConsuntivoMancante(
    cantiere,
    giornata
  );

  return {
    ...base,
    id: `${cantiere.id}:${giornata.id}`,
    cantiereId: cantiere.id,
    giornataId: giornata.id,
    kind: "lavoro-giornata",
    tipoLavoroLabel: "Previsto",
    data: dataParsed,
    scheduledDate: giornata.data,
    dataIntervento: giornata.data,
    orario: String(giornata.oraInizio || "").trim(),
    scheduledTime: String(giornata.oraInizio || "").trim(),
    estimatedDuration: minuti || null,
    durataStimata: minuti || null,
    durataStimataLabel: formattaDurataStimata(minuti) || (orePreviste > 0 ? `${orePreviste} h` : ""),
    orePreviste,
    oreUomo,
    operai,
    attivitaGiornata: attivita,
    stato: statoAgenda,
    statoAgendaCompat: statoAgenda === "pianificato" ? "programmato" : statoAgenda,
    consuntivoMancante,
    statoLabel:
      statoGiornata === STATI_GIORNATA.completata
        ? consuntivoMancante
          ? "Consuntivo da registrare"
          : "Fatta"
        : etichettaStatoGiornata(statoGiornata),
    statoBadgeClass:
      consuntivoMancante
        ? "ds-badge ds-badge-sospeso"
        : classeBadgeStatoGiornata(statoGiornata),
    statoGlifo: statoGiornata === "completata" ? "●" : "○",
    sottotitoloProgrammazione: [
      attivita,
      operai > 0 ? `${operai} ${operai === 1 ? "operaio" : "operai"}` : "",
    ]
      .filter(Boolean)
      .join(" · "),
    link: routeCantiereGiornate(cantiere.id),
    giornata,
  };
}

/**
 * Proietta una giornata lavorativa (consuntivo) in un item Agenda (UX-7.4).
 * @param {object} cantiere
 * @param {object} giornata
 */
export function creaLavoroDaGiornataLavorativa(cantiere = {}, giornata = {}) {
  const base = creaLavoroDaCantiere(cantiere);
  const oreLavorate = Number(giornata.oreLavorate) || 0;
  const minuti = oreLavorate > 0 ? Math.round(oreLavorate * 60) : 0;
  const dataParsed = parseDataProgrammazione(giornata.data);
  const nomi = formattaNomiOperai(giornata.operai);
  const attivita = String(giornata.attivita || "").trim();

  return {
    ...base,
    id: `reg-${cantiere.id}-${giornata.id}`,
    cantiereId: cantiere.id,
    registroId: giornata.id,
    kind: "giornata-lavorativa",
    tipoLavoroLabel: "Consuntivo",
    data: dataParsed,
    scheduledDate: giornata.data,
    dataIntervento: giornata.data,
    orario: "",
    scheduledTime: "",
    estimatedDuration: minuti || null,
    durataStimata: minuti || null,
    durataStimataLabel:
      formattaDurataStimata(minuti) ||
      (oreLavorate > 0 ? `${oreLavorate} h` : ""),
    oreLavorate,
    orePreviste: oreLavorate,
    operaiNomi: Array.isArray(giornata.operai) ? giornata.operai : [],
    attivitaGiornata: attivita,
    noteGiornata: String(giornata.note || "").trim(),
    stato: "completato",
    statoAgendaCompat: "completato",
    statoLabel: "Consuntivo registrato",
    statoBadgeClass: "ds-badge ds-badge-completato",
    statoGlifo: "●",
    sottotitoloProgrammazione: [nomi, oreLavorate > 0 ? `${oreLavorate}h` : "", attivita]
      .filter(Boolean)
      .join(" · "),
    link: routeCantiereGiornateFatto(cantiere.id),
    giornata,
  };
}

/**
 * @param {ReturnType<typeof creaLavoroDaCantiere>[]} lavori
 */
export function calcolaOrePreviste(lavori = []) {
  const minuti = lavori.reduce((acc, lavoro) => {
    if (lavoro?.kind === "giornata-lavorativa" && lavoro?.oreLavorate != null) {
      return acc + Number(lavoro.oreLavorate) * 60;
    }
    if (lavoro?.orePreviste != null && Number(lavoro.orePreviste) > 0) {
      return acc + Number(lavoro.orePreviste) * 60;
    }
    return acc + (Number(lavoro.durataStimata) || 0);
  }, 0);
  return {
    minuti,
    label: formattaDurataStimata(minuti) || "—",
  };
}
