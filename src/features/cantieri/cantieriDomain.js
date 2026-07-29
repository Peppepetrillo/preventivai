import { creaEventoCantiereCreato } from "../diario/events/cantiereCreato";

export const STATI_CANTIERE = [
  "Da iniziare",
  "Da avviare",
  "In corso",
  "In pausa",
  "Completato",
];

export function creaCantiere({ nome, cliente, indirizzo }) {
  const cantiere = {
    id: new Date().getTime(),
    nome: nome.trim(),
    cliente: cliente.trim(),
    indirizzo: indirizzo.trim(),
    stato: "Da iniziare",
    tipoLavoro: "cantiere",
    checklist: [],
    materiali: [],
    foto: [],
    note: "",
    preventivoOriginaleTotale: 0,
    varianti: [],
    creatoIl: new Date().toLocaleDateString("it-IT"),
    aggiornatoIl: new Date().toLocaleDateString("it-IT"),
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

export function creaMateriale({ nome, quantita, unita }) {
  return {
    id: new Date().getTime(),
    nome: nome.trim(),
    quantita: Number(quantita) || 0,
    unita: unita.trim() || "cad",
  };
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

  const totale = Number(
    cantiere.preventivoOriginaleTotale ??
      cantiere.preventivoImporto ??
      cantiere.totale ??
      0
  );
  const incassato = Number(
    cantiere.incassato ??
      cantiere.extra?.incassato ??
      cantiere.acconto ??
      cantiere.extra?.acconto ??
      0
  );
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
