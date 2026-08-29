/**
 * Eliminazione cantiere + pulizia riferimenti collegati (UX-6.3).
 * Non tocca esperienze, non cancella preventivo/distinta/attività indipendenti.
 */

import { scollegaAttivitaDalCantiere } from "../../../domain/attivita";
import { notificationService } from "../../../services/notificationService";
import {
  cercaDistinteMateriali,
  scollegaDistintaDaCantiere,
} from "../../../domain/distinteMateriali";
import { rimuoviVociListaSpesaPerCantiere } from "../../../domain/listaSpesa";
import { eliminaVariantiPerCantiere } from "../../../domain/varianti";
import {
  leggiPreventiviTutti,
  salvaPreventivi,
} from "../../../repositories/preventiviRepository";
import {
  leggiCantieriTutti,
  salvaCantieri,
} from "../../../repositories/cantieriRepository";
import { eliminaStorageFotoCantieri } from "./cantieriFotoService";

function stessoId(a, b) {
  return String(a) === String(b);
}

function scollegaPreventiviDalCantiere(cantiereId) {
  const id = String(cantiereId ?? "");
  if (!id) return [];

  const preventivi = leggiPreventiviTutti();
  let cambiato = false;
  const prossimo = preventivi.map((preventivo) => {
    if (!stessoId(preventivo?.cantiereId, id)) return preventivo;
    cambiato = true;
    return { ...preventivo, cantiereId: null };
  });
  if (cambiato) salvaPreventivi(prossimo);
  return prossimo;
}

function scollegaDistinteDalCantiere(cantiereId) {
  const distinte = cercaDistinteMateriali("", { cantiereId: String(cantiereId) });
  return distinte
    .map((distinta) => scollegaDistintaDaCantiere(distinta.id))
    .filter(Boolean);
}

/**
 * @param {object} cantiere
 * @returns {{ success: boolean, cantieri?: object[] }}
 */
export function eliminaCantiereConPulizia(cantiere) {
  if (!cantiere?.id && cantiere?.id !== 0) {
    return { success: false };
  }

  const cantiereId = cantiere.id;
  void notificationService.cancelNotificheCantiereCompleto(cantiere);
  eliminaStorageFotoCantieri(cantiere.foto || []);

  const cantieri = leggiCantieriTutti().filter(
    (voce) => !stessoId(voce?.id, cantiereId)
  );
  salvaCantieri(cantieri);

  rimuoviVociListaSpesaPerCantiere(cantiereId);
  scollegaDistinteDalCantiere(cantiereId);
  eliminaVariantiPerCantiere(cantiereId);
  scollegaPreventiviDalCantiere(cantiereId);
  scollegaAttivitaDalCantiere(cantiereId);

  return { success: true, cantieri };
}
