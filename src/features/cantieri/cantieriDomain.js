export const STATI_CANTIERE = [
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
    stato: "Da avviare",
    checklist: [],
    materiali: [],
    foto: [],
    note: "",
    creatoIl: new Date().toLocaleDateString("it-IT"),
    aggiornatoIl: new Date().toLocaleDateString("it-IT"),
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
