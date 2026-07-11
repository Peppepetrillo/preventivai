import { useEffect, useState } from "react";
import { APP_EVENTS } from "../app/events";
import { leggiPreventivi } from "../repositories/preventiviRepository";

export function useArchivioPreventivi() {
  const [preventivi, setPreventivi] = useState([]);

  useEffect(() => {
    function aggiornaArchivio() {
      setPreventivi([...leggiPreventivi()].reverse());
    }

    aggiornaArchivio();

    window.addEventListener(APP_EVENTS.preventiviAggiornati, aggiornaArchivio);
    window.addEventListener(APP_EVENTS.cloudSyncAggiornata, aggiornaArchivio);

    return () => {
      window.removeEventListener(APP_EVENTS.preventiviAggiornati, aggiornaArchivio);
      window.removeEventListener(APP_EVENTS.cloudSyncAggiornata, aggiornaArchivio);
    };
  }, []);

  return preventivi;
}
