import { useCallback, useMemo, useState } from "react";

import { leggiPreventivi } from "../../../repositories/preventiviRepository";
import {
  creaSerieCivile,
  eliminaSerieCivile,
  rinominaSerieCivile,
  trovaSerieCivile,
} from "./contestoPreventivoModel";
import {
  leggiSerieCivili,
  raccogliSerieCiviliInUso,
  salvaSerieCivili,
} from "./serieCiviliStorage";

/**
 * Catalogo Serie Civile + operazioni UX (locale).
 * @param {{ serieCivileId?: string }=} contestoCorrente
 */
export function useSerieCivili(contestoCorrente = {}) {
  const [serie, setSerie] = useState(() => leggiSerieCivili());
  const [messaggio, setMessaggio] = useState("");

  const idsInUso = (() => {
    try {
      return raccogliSerieCiviliInUso(leggiPreventivi());
    } catch {
      return [];
    }
  })();

  const serieSelezionata = useMemo(
    () => trovaSerieCivile(serie, contestoCorrente?.serieCivileId),
    [serie, contestoCorrente?.serieCivileId]
  );

  const persisti = useCallback((prossimo) => {
    const salvato = salvaSerieCivili(prossimo);
    setSerie(salvato);
    return salvato;
  }, []);

  const aggiungi = useCallback(
    (nome) => {
      try {
        const nuova = creaSerieCivile(nome);
        persisti([...serie, nuova]);
        setMessaggio("");
        return nuova;
      } catch (errore) {
        setMessaggio(errore.message || "Impossibile creare la serie.");
        return null;
      }
    },
    [persisti, serie]
  );

  const rinomina = useCallback(
    (serieId, nome) => {
      try {
        persisti(rinominaSerieCivile(serie, serieId, nome));
        setMessaggio("");
        return true;
      } catch (errore) {
        setMessaggio(errore.message || "Impossibile rinominare.");
        return false;
      }
    },
    [persisti, serie]
  );

  const elimina = useCallback(
    (serieId) => {
      try {
        persisti(
          eliminaSerieCivile(serie, serieId, contestoCorrente, idsInUso)
        );
        setMessaggio("");
        return true;
      } catch (errore) {
        setMessaggio(errore.message || "Impossibile eliminare.");
        return false;
      }
    },
    [contestoCorrente, idsInUso, persisti, serie]
  );

  return {
    serie,
    serieSelezionata,
    messaggio,
    setMessaggio,
    aggiungi,
    rinomina,
    elimina,
    idsInUso,
  };
}
