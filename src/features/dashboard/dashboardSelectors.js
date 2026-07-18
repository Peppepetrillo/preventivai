import { calcolaAvanzamentoChecklist } from "../cantieri/cantieriDomain";

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

export function creaMessaggioOperativo({ nome, cantieriAperti, preventiviInAttesa }) {
  const destinatario = nome ? ` ${nome}` : "";
  const cantieri = cantieriAperti === 1 ? "1 cantiere aperto" : `${cantieriAperti} cantieri aperti`;
  const preventivi =
    preventiviInAttesa === 1
      ? "1 preventivo in attesa"
      : `${preventiviInAttesa} preventivi in attesa`;

  return `Buongiorno${destinatario}. Hai ${cantieri} e ${preventivi}.`;
}
