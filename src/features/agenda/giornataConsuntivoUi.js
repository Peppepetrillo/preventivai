import {
  STATI_GIORNATA,
  normalizzaStatoGiornata,
} from "../cantieri/services/programmazioneCantiereService";
import { leggiRegistroGiornate } from "../cantieri/services/registroGiornateService";

/**
 * True se esiste almeno un consuntivo (registroGiornate[]) per la data indicata.
 * Solo lettura — nessuna modifica ai dati.
 */
export function haConsuntivoPerData(cantiere = {}, dataGiornata = "") {
  const data = String(dataGiornata || "").trim();
  if (!data) return false;

  return leggiRegistroGiornate(cantiere).some(
    (giornata) => String(giornata?.data || "").trim() === data
  );
}

/**
 * Giornata prevista segnata completata ma senza consuntivo per la stessa data.
 */
export function giornataProgrammataConsuntivoMancante(cantiere = {}, giornata = {}) {
  const stato = normalizzaStatoGiornata(giornata?.stato);
  if (stato !== STATI_GIORNATA.completata) return false;
  return !haConsuntivoPerData(cantiere, giornata?.data);
}
