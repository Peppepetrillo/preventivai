import { creaCantiereDaPreventivo } from "../cantieriDomain";
import { leggiCantieri, salvaCantieri } from "../../../repositories/cantieriRepository";
import { aggiornaPreventivo } from "../../../repositories/preventiviRepository";

export function trovaCantiereCollegato(preventivo) {
  if (!preventivo) return null;

  return leggiCantieri().find(
    (cantiere) =>
      String(cantiere.id) === String(preventivo.cantiereId) ||
      String(cantiere.preventivoId) === String(preventivo.id)
  ) || null;
}

export function creaCantierePerPreventivo(preventivo) {
  if (!preventivo) {
    throw new Error("Preventivo non trovato.");
  }

  if (preventivo.stato !== "Accettato") {
    throw new Error("Il preventivo deve essere accettato prima di creare il cantiere.");
  }

  const cantiereEsistente = trovaCantiereCollegato(preventivo);

  if (cantiereEsistente) {
    const preventivoAggiornato = String(preventivo.cantiereId) === String(cantiereEsistente.id)
      ? preventivo
      : aggiornaPreventivo(preventivo.id, () => ({
          ...preventivo,
          cantiereId: cantiereEsistente.id,
        })).find((item) => String(item.id) === String(preventivo.id));

    return {
      cantiere: cantiereEsistente,
      creato: false,
      preventivo: preventivoAggiornato || {
        ...preventivo,
        cantiereId: cantiereEsistente.id,
      },
    };
  }

  const cantiere = creaCantiereDaPreventivo(preventivo);
  salvaCantieri([cantiere, ...leggiCantieri()]);

  const [preventivoAggiornato] = aggiornaPreventivo(preventivo.id, () => ({
    ...preventivo,
    cantiereId: cantiere.id,
  })).filter((item) => String(item.id) === String(preventivo.id));

  return {
    cantiere,
    creato: true,
    preventivo: preventivoAggiornato || {
      ...preventivo,
      cantiereId: cantiere.id,
    },
  };
}
