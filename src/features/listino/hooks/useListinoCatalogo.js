import { useCallback, useMemo, useState } from "react";

import {
  aggiornaVoceCatalogo,
  creaVoceCatalogo,
  elencaCategorieCatalogo,
  eliminaVoceCatalogo,
  filtraCatalogoPerRicerca,
  ordinaCatalogo,
  raggruppaPerCategoria,
} from "../listinoCatalogDomain";
import {
  caricaCatalogoListino,
  persistiCatalogoListino,
} from "../listinoCatalogService";

/**
 * Hook UI catalogo listino — indipendente dai preventivi.
 */
export function useListinoCatalogo() {
  const [catalogo, setCatalogo] = useState(() => caricaCatalogoListino());
  const [ricerca, setRicerca] = useState("");
  const [categoriaAttiva, setCategoriaAttiva] = useState("tutte");
  const [messaggio, setMessaggio] = useState("");

  const persisti = useCallback((prossimo) => {
    const salvato = persistiCatalogoListino(prossimo);
    setCatalogo(salvato);
    return salvato;
  }, []);

  const categorie = useMemo(
    () => elencaCategorieCatalogo(catalogo),
    [catalogo]
  );

  const preferiti = useMemo(
    () => ordinaCatalogo(catalogo).filter((voce) => voce.preferita),
    [catalogo]
  );

  const lavorazioniVisibili = useMemo(() => {
    const cercate = filtraCatalogoPerRicerca(catalogo, ricerca);
    return raggruppaPerCategoria(cercate, categoriaAttiva);
  }, [catalogo, ricerca, categoriaAttiva]);

  const aggiornaRicerca = useCallback((valore) => {
    setRicerca(valore);
  }, []);

  const salvaVoce = useCallback(
    (voceId, patch) => {
      try {
        const nome = String(patch?.nome || "").trim();
        if (!nome) {
          setMessaggio("Inserisci il nome della lavorazione.");
          return false;
        }
        const prossimo = aggiornaVoceCatalogo(catalogo, voceId, {
          ...patch,
          nome,
        });
        persisti(prossimo);
        setMessaggio("Lavorazione aggiornata.");
        return true;
      } catch (errore) {
        setMessaggio(errore?.message || "Impossibile salvare.");
        return false;
      }
    },
    [catalogo, persisti]
  );

  const aggiungiVoce = useCallback(
    (dati) => {
      try {
        const voce = creaVoceCatalogo({
          ...dati,
          ordinamento: catalogo.length * 10 + 10,
        });
        persisti([voce, ...catalogo]);
        setMessaggio("Lavorazione aggiunta al catalogo.");
        return voce;
      } catch (errore) {
        setMessaggio(errore?.message || "Impossibile aggiungere.");
        return null;
      }
    },
    [catalogo, persisti]
  );

  const eliminaVoce = useCallback(
    (voceId) => {
      persisti(eliminaVoceCatalogo(catalogo, voceId));
      setMessaggio("Lavorazione eliminata.");
    },
    [catalogo, persisti]
  );

  const toggleAttiva = useCallback(
    (voceId) => {
      const voce = catalogo.find((item) => String(item.id) === String(voceId));
      if (!voce) return;
      persisti(
        aggiornaVoceCatalogo(catalogo, voceId, { attiva: !voce.attiva })
      );
    },
    [catalogo, persisti]
  );

  const togglePreferita = useCallback(
    (voceId) => {
      const voce = catalogo.find((item) => String(item.id) === String(voceId));
      if (!voce) return;
      persisti(
        aggiornaVoceCatalogo(catalogo, voceId, {
          preferita: !voce.preferita,
        })
      );
    },
    [catalogo, persisti]
  );

  return {
    catalogo,
    preferiti,
    categorie,
    lavorazioniVisibili,
    ricerca,
    categoriaAttiva,
    messaggio,
    setMessaggio,
    aggiornaRicerca,
    setCategoriaAttiva,
    salvaVoce,
    aggiungiVoce,
    eliminaVoce,
    toggleAttiva,
    togglePreferita,
  };
}
