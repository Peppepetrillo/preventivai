export const STATI_CANTIERE = [
  "Da iniziare",
  "Da avviare",
  "In corso",
  "In pausa",
  "Completato",
];

export function creaCantiere({ nome, cliente, indirizzo }) {
  return {
    id: new Date().getTime(),
    nome: nome.trim(),
    cliente: cliente.trim(),
    indirizzo: indirizzo.trim(),
    stato: "Da iniziare",
    checklist: [],
    materiali: [],
    foto: [],
    note: "",
    preventivoOriginaleTotale: 0,
    varianti: [],
    creatoIl: new Date().toLocaleDateString("it-IT"),
    aggiornatoIl: new Date().toLocaleDateString("it-IT"),
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
  const totalePreventivo = Number(preventivo.totale);
  const preventivoOriginaleTotale = Number.isFinite(totalePreventivo)
    ? totalePreventivo
    : lavorazioni.reduce(
        (acc, item) =>
          acc + (Number(item.prezzo) || 0) * (Number(item.quantita) || 0),
        0
      );

  return {
    id: new Date().getTime(),
    nome: `Cantiere ${riferimento}`,
    cliente: String(preventivo.cliente || "").trim(),
    indirizzo: String(indirizzo || preventivo.indirizzo || "").trim(),
    stato: "Da iniziare",
    preventivoId: preventivo.id,
    preventivoNumero: riferimento,
    clienteId,
    dataCreazione,
    dataAccettazione: dataAccettazioneFinale,
    origine: "preventivo",
    lavorazioniOrigine: lavorazioni.map((lavorazione) => ({ ...lavorazione })),
    checklist: lavorazioni.map((lavorazione, index) => ({
      id: `${preventivo.id}-check-${index}`,
      testo: `Eseguire ${lavorazione.nome}`,
      completata: false,
    })),
    materiali: [],
    foto: [],
    note: notePreventivo || `Creato dal preventivo ${riferimento}.`,
    preventivoOriginaleTotale,
    varianti: [],
    creatoIl: dataCreazione,
    aggiornatoIl: dataCreazione,
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
