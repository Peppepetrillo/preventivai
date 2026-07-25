/**
 * Adapter legacy → domain/varianti.
 * Mantiene le API usate da UI/test esistenti; la fonte di verità è il nuovo modulo.
 */

import {
  calcolaTotaleCantiere,
  creaVarianteModel,
  importoSegnatoVariante as importoSegnatoDomain,
  TIPI_VARIANTE as TIPI_VARIANTE_DOMAIN,
} from "../../domain/varianti";
import { normalizzaNumero } from "../../utils/preventivi";

/** @deprecated Usa TIPI_VARIANTE da domain/varianti */
export const TIPI_VARIANTE = ["aggiunta", "rimozione"];

export function calcolaTotaleLavorazioni(lavorazioni = []) {
  return (Array.isArray(lavorazioni) ? lavorazioni : []).reduce(
    (acc, item) =>
      acc + normalizzaNumero(item?.prezzo) * normalizzaNumero(item?.quantita),
    0
  );
}

export function risolviPreventivoOriginaleTotale(cantiere) {
  return calcolaTotaleCantiere(cantiere || {}).preventivoOriginale;
}

export function importoSegnatoVariante(variante) {
  if (variante && variante.importo === undefined && variante.totale !== undefined) {
    return importoSegnatoDomain({
      ...variante,
      importo: variante.totale,
    });
  }
  return importoSegnatoDomain(variante);
}

/**
 * @param {object=} cantiere
 */
export function riepilogoEconomicoCantiere(cantiere) {
  const riepilogo = calcolaTotaleCantiere(cantiere || {});
  return {
    preventivoOriginale: riepilogo.preventivoOriginale,
    deltaVarianti: riepilogo.deltaVarianti,
    totaleAggiornato: riepilogo.totaleAggiornato,
    numeroVarianti: riepilogo.numeroVarianti,
    varianti: riepilogo.varianti,
  };
}

/**
 * Factory legacy (senza persistenza).
 * Preferire creaVariante() del service per salvare.
 */
export function creaVarianteCantiere(dati = {}) {
  const descrizione = String(dati.descrizione || "").trim();
  if (!descrizione) {
    throw new Error("Inserisci la descrizione della variante.");
  }

  const modello = creaVarianteModel({
    ...dati,
    titolo: descrizione,
    descrizione,
    tipo: dati.tipo,
    // legacy embedded: già applicata al totale cantiere
    stato: dati.stato || "eseguita",
  });

  return {
    id: modello.id,
    data: modello.dataCreazione,
    tipo:
      modello.tipo === TIPI_VARIANTE_DOMAIN.RIMOZIONE
        ? "rimozione"
        : modello.tipo === TIPI_VARIANTE_DOMAIN.MODIFICA
          ? "modifica"
          : "aggiunta",
    descrizione: modello.descrizione,
    categoria: modello.categoria,
    quantita: modello.quantita,
    prezzoUnitario: modello.prezzoUnitario,
    totale: modello.importo,
    note: modello.note,
    titolo: modello.titolo,
    importo: modello.importo,
    stato: modello.stato,
    unita: modello.unita,
  };
}
