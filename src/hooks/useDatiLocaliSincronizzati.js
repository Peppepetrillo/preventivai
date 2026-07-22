import { useEffect, useState } from "react";

import { APP_EVENTS } from "../app/events";

/**
 * Contatore che incrementa ad ogni sync cloud riuscito (evento globale).
 */
export function useCloudSyncTick() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    function onSync() {
      setTick((valore) => valore + 1);
    }

    window.addEventListener(APP_EVENTS.cloudSyncAggiornata, onSync);
    return () => {
      window.removeEventListener(APP_EVENTS.cloudSyncAggiornata, onSync);
    };
  }, []);

  return tick;
}

/**
 * Stato locale allineato allo storage, aggiornato dopo sync cloud (e eventi extra).
 *
 * @template T
 * @param {() => T} leggi Funzione stabile (import di repository).
 * @param {string[]} [eventiExtra]
 * @returns {[T, import("react").Dispatch<import("react").SetStateAction<T>>]}
 */
export function useDatiLocaliSincronizzati(leggi, eventiExtra = []) {
  const [dati, setDati] = useState(leggi);
  const eventiKey = eventiExtra.join("|");

  useEffect(() => {
    function aggiornaDaStorage() {
      setDati(leggi());
    }

    const eventi = [APP_EVENTS.cloudSyncAggiornata, ...eventiExtra];
    for (const evento of eventi) {
      window.addEventListener(evento, aggiornaDaStorage);
    }

    return () => {
      for (const evento of eventi) {
        window.removeEventListener(evento, aggiornaDaStorage);
      }
    };
    // `leggi` è un import stabile di repository; eventiKey cattura la lista eventi.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventiKey]);

  return [dati, setDati];
}
