import { creaCantiereDaPreventivo } from "../cantieriDomain";
import { leggiClienti } from "../../../repositories/clientiRepository";
import { leggiCantieri, salvaCantieri } from "../../../repositories/cantieriRepository";
import { aggiornaPreventivo } from "../../../repositories/preventiviRepository";

function dataOdierna() {
  return new Date().toLocaleDateString("it-IT");
}

function risolviDatiCliente(preventivo) {
  const cliente = leggiClienti().find(
    (item) => item.nome === preventivo.cliente
  );

  return {
    clienteId: preventivo.clienteId ?? cliente?.id ?? null,
    indirizzo: String(preventivo.indirizzo || cliente?.indirizzo || "").trim(),
  };
}

export function trovaCantiereCollegato(preventivo) {
  if (!preventivo) return null;

  return (
    leggiCantieri().find(
      (cantiere) =>
        String(cantiere.id) === String(preventivo.cantiereId) ||
        String(cantiere.preventivoId) === String(preventivo.id)
    ) || null
  );
}

export function convertiPreventivoInCantiere(preventivo) {
  if (!preventivo) {
    throw new Error("Preventivo non trovato.");
  }

  const cantiereEsistente = trovaCantiereCollegato(preventivo);

  if (cantiereEsistente) {
    const preventivoAggiornato =
      String(preventivo.cantiereId) === String(cantiereEsistente.id)
        ? preventivo
        : aggiornaPreventivo(preventivo.id, (item) => ({
            ...item,
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

  const dataAccettazione = dataOdierna();
  const { clienteId, indirizzo } = risolviDatiCliente(preventivo);
  const cantiere = creaCantiereDaPreventivo(preventivo, {
    clienteId,
    indirizzo,
    dataAccettazione,
  });

  salvaCantieri([cantiere, ...leggiCantieri()]);

  const [preventivoAggiornato] = aggiornaPreventivo(preventivo.id, (item) => ({
    ...item,
    stato: "Accettato",
    cantiereId: cantiere.id,
    dataAccettazione,
  })).filter((item) => String(item.id) === String(preventivo.id));

  return {
    cantiere,
    creato: true,
    preventivo: preventivoAggiornato || {
      ...preventivo,
      stato: "Accettato",
      cantiereId: cantiere.id,
      dataAccettazione,
    },
  };
}

/** @deprecated Usa convertiPreventivoInCantiere */
export function creaCantierePerPreventivo(preventivo) {
  return convertiPreventivoInCantiere(preventivo);
}
