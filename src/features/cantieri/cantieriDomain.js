import { creaEventoCantiereCreato } from "../diario/events/cantiereCreato";
import { calcolaTotaleCantiere } from "../../domain/varianti";
import { calcolaSaldo, normalizzaNumero } from "../../utils/preventivi";

export const STATI_CANTIERE = [
  "Da iniziare",
  "Da avviare",
  "In corso",
  "In pausa",
  "Rimandato",
  "Completato",
];

/** Origine cantiere: da preventivo oppure lavoro diretto (UX-6.5). */
export const ORIGINE_CANTIERE = Object.freeze({
  PREVENTIVO: "preventivo",
  DIRETTO: "diretto",
});

/**
 * Tipi intervento per lavori diretti (separati da tipoLavoro agenda).
 */
export const TIPI_INTERVENTO = Object.freeze([
  "Riparazione",
  "Manutenzione",
  "Modifica impianto",
  "Installazione",
  "Ricerca guasto",
  "Sopralluogo/intervento",
  "Altro",
]);

/**
 * @param {object=} cantiere
 * @returns {boolean}
 */
export function isCantiereDiretto(cantiere = {}) {
  return String(cantiere?.origine || "") === ORIGINE_CANTIERE.DIRETTO;
}

/**
 * Totale lavoro diretto (prezzo deciso dall'elettricista).
 * @param {object=} cantiere
 */
export function leggiTotaleLavoroDiretto(cantiere = {}) {
  const grezzo = Number(cantiere?.totaleLavoro);
  if (!Number.isFinite(grezzo) || grezzo < 0) return 0;
  return grezzo;
}

/**
 * Acconto / incassato (pagamenti[] SoT se presente, altrimenti catena legacy).
 * @param {object=} cantiere
 */
export function leggiAccontoCantiere(cantiere = {}) {
  if (Array.isArray(cantiere?.pagamenti)) {
    return cantiere.pagamenti.reduce((acc, grezzo) => {
      const importo = normalizzaNumero(grezzo?.importo);
      return acc + (importo > 0 ? importo : 0);
    }, 0);
  }
  return normalizzaNumero(
    cantiere?.incassato ??
      cantiere?.extra?.incassato ??
      cantiere?.acconto ??
      cantiere?.extra?.acconto ??
      0
  );
}

/**
 * Saldo / rimanenza.
 * Totale: diretto → totaleLavoro; preventivo → totaleOverride oppure preventivo+varianti.
 * @param {object=} cantiere
 * @param {number=} totaleOverride
 */
export function calcolaSaldoCantiere(cantiere = {}, totaleOverride) {
  let totale;
  if (totaleOverride != null && Number.isFinite(Number(totaleOverride))) {
    totale = Math.max(Number(totaleOverride), 0);
  } else if (isCantiereDiretto(cantiere)) {
    totale = leggiTotaleLavoroDiretto(cantiere);
  } else {
    totale = Math.max(
      Number(calcolaTotaleCantiere(cantiere).totaleAggiornato) || 0,
      0
    );
  }
  return calcolaSaldo(totale, leggiAccontoCantiere(cantiere));
}

/**
 * @param {string=} tipo
 */
export function etichettaTipoIntervento(tipo) {
  const valore = String(tipo || "").trim();
  if (TIPI_INTERVENTO.includes(valore)) return valore;
  return valore || "Intervento";
}

/**
 * Creazione manuale = lavoro diretto (UX-6.5).
 * @param {{
 *   nome?: string,
 *   cliente?: string,
 *   indirizzo?: string,
 *   tipoIntervento?: string,
 *   descrizioneIntervento?: string,
 *   totaleLavoro?: number|string,
 *   note?: string,
 * }} input
 */
export function creaCantiere({
  nome,
  cliente,
  clienteId,
  indirizzo,
  tipoIntervento = "",
  descrizioneIntervento = "",
  totaleLavoro = 0,
  note = "",
} = {}) {
  const descrizione = String(descrizioneIntervento || "").trim();
  const tipo = String(tipoIntervento || "").trim();
  const totale = Math.max(normalizzaNumero(totaleLavoro), 0);

  const cantiere = {
    id: new Date().getTime(),
    nome: String(nome || "").trim(),
    cliente: String(cliente || "").trim(),
    indirizzo: String(indirizzo || "").trim(),
    stato: "Da iniziare",
    tipoLavoro: "cantiere",
    origine: ORIGINE_CANTIERE.DIRETTO,
    tipoIntervento: tipo || "Altro",
    descrizioneIntervento: descrizione,
    descrizione,
    totaleLavoro: totale,
    incassato: 0,
    acconto: 0,
    pagamenti: [],
    spese: [],
    checklist: [],
    materiali: [],
    foto: [],
    note: String(note || "").trim(),
    preventivoOriginaleTotale: 0,
    varianti: [],
    creatoIl: new Date().toLocaleDateString("it-IT"),
    aggiornatoIl: new Date().toLocaleDateString("it-IT"),
    ...(clienteId != null && clienteId !== "" ? { clienteId } : {}),
  };
  return {
    ...cantiere,
    diario: [creaEventoCantiereCreato(cantiere)],
  };
}

export function creaCantiereDaPreventivo(
  preventivo,
  { clienteId = null, indirizzo = "", dataAccettazione } = {}
) {
  const dataCreazione = new Date().toLocaleDateString("it-IT");
  const dataAccettazioneFinale = dataAccettazione || dataCreazione;
  const riferimento = preventivo.numero || `PREV-${preventivo.id}`;
  const lavorazioni = preventivo.lavorazioni || [];
  const notePreventivo = String(preventivo.note || "").trim();
  const descrizione = String(
    preventivo.descrizione || preventivo.note || ""
  ).trim();
  const extra =
    preventivo.extra && typeof preventivo.extra === "object"
      ? { ...preventivo.extra }
      : {};
  const totalePreventivo = Number(preventivo.totale);
  const preventivoOriginaleTotale = Number.isFinite(totalePreventivo)
    ? totalePreventivo
    : lavorazioni.reduce(
        (acc, item) =>
          acc + (Number(item.prezzo) || 0) * (Number(item.quantita) || 0),
        0
      );

  const allegatiSorgente = [
    ...(Array.isArray(preventivo.allegati) ? preventivo.allegati : []),
    ...(Array.isArray(preventivo.foto) ? preventivo.foto : []),
    ...(Array.isArray(extra.allegati) ? extra.allegati : []),
    ...(Array.isArray(extra.foto) ? extra.foto : []),
  ];
  const fotoDaAllegati = allegatiSorgente
    .filter((voce) => voce && (voce.src || voce.url || voce.miniatura))
    .map((voce, index) => ({
      id: voce.id || `${preventivo.id}-all-${index}`,
      nome: voce.nome || voce.name || `Allegato ${index + 1}`,
      src: voce.src || voce.url || "",
      miniatura: voce.miniatura || voce.src || voce.url || "",
      aggiuntaIl: dataCreazione,
      daPreventivo: true,
    }));

  const cantiere = {
    id: new Date().getTime(),
    nome: `Cantiere ${riferimento}`,
    cliente: String(preventivo.cliente || "").trim(),
    indirizzo: String(indirizzo || preventivo.indirizzo || "").trim(),
    descrizione,
    stato: "Da iniziare",
    tipoLavoro: "cantiere",
    preventivoId: preventivo.id,
    preventivoNumero: riferimento,
    preventivoImporto: preventivoOriginaleTotale,
    clienteId,
    dataCreazione,
    dataAccettazione: dataAccettazioneFinale,
    origine: "preventivo",
    lavorazioniOrigine: lavorazioni.map((lavorazione) => ({ ...lavorazione })),
    extra,
    ...(preventivo.tipologiaImpianto
      ? { tipologiaImpianto: preventivo.tipologiaImpianto }
      : {}),
    checklist: lavorazioni.map((lavorazione, index) => ({
      id: `${preventivo.id}-check-${index}`,
      testo: `Eseguire ${lavorazione.nome}`,
      completata: false,
    })),
    materiali: [],
    foto: fotoDaAllegati,
    allegati: allegatiSorgente.map((voce) => ({ ...voce })),
    note: notePreventivo || `Creato dal preventivo ${riferimento}.`,
    preventivoOriginaleTotale,
    varianti: [],
    incassato: 0,
    acconto: 0,
    pagamenti: [],
    spese: [],
    creatoIl: dataCreazione,
    aggiornatoIl: dataCreazione,
  };
  return {
    ...cantiere,
    diario: [creaEventoCantiereCreato(cantiere)],
  };
}

export function aggiornaCantiere(cantiere, modifiche) {
  return {
    ...cantiere,
    ...modifiche,
    aggiornatoIl: new Date().toLocaleDateString("it-IT"),
  };
}

export function creaVoceChecklist(testo) {
  return {
    id: new Date().getTime(),
    testo: testo.trim(),
    completata: false,
  };
}

export function creaMateriale({
  nome,
  quantita,
  unita,
  famigliaId,
  varianteId,
  distintaId,
  distintaVoceId,
  note,
  origine,
  prezzoUnitario,
  modificatoManualmente,
  distintaOrfana,
} = {}) {
  const materiale = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    nome: String(nome || "").trim(),
    quantita: Number(quantita) || 0,
    unita: String(unita || "cad").trim() || "cad",
  };

  if (famigliaId) materiale.famigliaId = String(famigliaId);
  if (varianteId) materiale.varianteId = String(varianteId);
  if (distintaId) materiale.distintaId = String(distintaId);
  if (distintaVoceId) materiale.distintaVoceId = String(distintaVoceId);
  if (note) materiale.note = String(note).trim();
  if (origine) materiale.origine = String(origine);
  if (prezzoUnitario != null && Number.isFinite(Number(prezzoUnitario))) {
    materiale.prezzoUnitario = Number(prezzoUnitario);
  }
  if (modificatoManualmente) materiale.modificatoManualmente = true;
  if (distintaOrfana) materiale.distintaOrfana = true;

  return materiale;
}

export function creaFoto({ nome, src }) {
  return {
    id: new Date().getTime(),
    nome,
    src,
    aggiuntaIl: new Date().toLocaleDateString("it-IT"),
  };
}

export function calcolaAvanzamentoChecklist(checklist) {
  if (!checklist.length) return 0;

  const completate = checklist.filter((voce) => voce.completata).length;
  return Math.round((completate / checklist.length) * 100);
}

/**
 * Controlli pre-chiusura cantiere (presentation / UX).
 * Non blocca: l'utente può sempre concludere.
 * @param {object} cantiere
 * @param {{ varianti?: object[], haFirma?: boolean }=} opzioni
 * @returns {{ mancanze: Array<{ id: string, testo: string, soloAvviso?: boolean }>, ok: boolean }}
 */
export function valutaPrerequisitiChiusuraCantiere(
  cantiere = {},
  { varianti = [], haFirma = null } = {}
) {
  const mancanze = [];
  const checklist = Array.isArray(cantiere.checklist) ? cantiere.checklist : [];
  if (checklist.length > 0 && checklist.some((voce) => !voce.completata)) {
    const rimanenti = checklist.filter((voce) => !voce.completata).length;
    mancanze.push({
      id: "checklist",
      testo: `Checklist incompleta (${rimanenti} da fare)`,
    });
  }

  const totale = isCantiereDiretto(cantiere)
    ? leggiTotaleLavoroDiretto(cantiere)
    : Math.max(Number(calcolaTotaleCantiere(cantiere).totaleAggiornato) || 0, 0);
  const incassato = leggiAccontoCantiere(cantiere);
  if (totale > 0 && incassato < totale) {
    mancanze.push({
      id: "pagamenti",
      testo: "Pagamenti non aggiornati (resta da incassare)",
    });
  }

  const aperte = (Array.isArray(varianti) ? varianti : []).filter((v) => {
    const stato = String(v?.stato || "").toLowerCase();
    return stato === "proposta" || stato === "approvata";
  });
  if (aperte.length > 0) {
    mancanze.push({
      id: "varianti",
      testo: `Varianti non gestite (${aperte.length})`,
    });
  }

  const foto = Array.isArray(cantiere.foto) ? cantiere.foto : [];
  if (foto.length === 0) {
    mancanze.push({
      id: "foto",
      testo: "Nessuna foto presente",
      soloAvviso: true,
    });
  }

  if (haFirma === false) {
    mancanze.push({
      id: "firma",
      testo: "Firma cliente non disponibile",
      soloAvviso: true,
    });
  }

  return {
    mancanze,
    ok: mancanze.length === 0,
  };
}

/**
 * Copy ConfirmDialog per spostamento cantiere nel Cestino (UX-7.1).
 * Lo stato non cambia il messaggio: soft delete uniforme.
 * @param {string=} stato
 */
export function testoConfermaEliminaCantiere(stato) {
  void stato;
  return "L'elemento verrà spostato nel Cestino e potrai ripristinarlo in seguito.";
}
