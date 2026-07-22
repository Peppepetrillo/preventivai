import { leggiPreventivi } from "../repositories/preventiviRepository";
import { APP_EVENTS } from "../app/events";
import { useDatiLocaliSincronizzati } from "./useDatiLocaliSincronizzati";

function leggiArchivioPreventivi() {
  return [...leggiPreventivi()].reverse();
}

export function useArchivioPreventivi() {
  const [preventivi] = useDatiLocaliSincronizzati(leggiArchivioPreventivi, [
    APP_EVENTS.preventiviAggiornati,
  ]);

  return preventivi;
}
