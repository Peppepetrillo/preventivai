import { useCallback, useMemo, useState } from "react";

import {
  aggiornaFamigliaCatalogo,
  aggiornaVarianteCatalogo,
  caricaCatalogoMateriali,
  cercaCatalogoMateriali,
  creaFamigliaCatalogo,
  creaVarianteCatalogo,
  eliminaFamigliaCatalogo,
  eliminaVarianteCatalogo,
  impostaAttivaFamigliaCatalogo,
  impostaAttivaVarianteCatalogo,
} from "../../../domain/catalogoMateriali/materialiCatalogService";
import { CATEGORIE_MATERIALE } from "../../../domain/catalogoMateriali/materialiTypes";
import { elencaMetaCategorieMateriale } from "../catalogoMaterialiUiMeta";

/**
 * Hook UI Catalogo Materiali — usa solo il service, mai localStorage diretto.
 */
export function useCatalogoMaterialiUi() {
  const [catalogo, setCatalogo] = useState(() => caricaCatalogoMateriali());
  const [ricerca, setRicerca] = useState("");
  const [categoriaId, setCategoriaId] = useState(null);
  const [famigliaId, setFamigliaId] = useState(null);
  const [messaggio, setMessaggio] = useState("");
  const [soloAttive, setSoloAttive] = useState(false);

  const ricarica = useCallback(() => {
    setCatalogo(caricaCatalogoMateriali());
  }, []);

  const categorie = useMemo(() => elencaMetaCategorieMateriale(), []);

  const famiglieVisibili = useMemo(() => {
    const filtri = {};
    if (categoriaId) filtri.categoria = categoriaId;
    if (soloAttive) filtri.soloAttive = true;
    return cercaCatalogoMateriali(ricerca, filtri);
  }, [catalogo, ricerca, categoriaId, soloAttive]);

  const famigliaAttiva = useMemo(() => {
    if (!famigliaId) return null;
    return catalogo.find((f) => f.id === String(famigliaId)) || null;
  }, [catalogo, famigliaId]);

  const vista = famigliaId
    ? "varianti"
    : categoriaId || ricerca.trim()
      ? "famiglie"
      : "categorie";

  const aggiornaRicerca = useCallback((valore) => {
    setRicerca(valore);
    if (String(valore || "").trim()) {
      setFamigliaId(null);
    }
  }, []);

  const apriCategoria = useCallback((id) => {
    setCategoriaId(id);
    setFamigliaId(null);
  }, []);

  const apriFamiglia = useCallback((id) => {
    setFamigliaId(id);
  }, []);

  const indietro = useCallback(() => {
    if (famigliaId) {
      setFamigliaId(null);
      return;
    }
    if (categoriaId) {
      setCategoriaId(null);
    }
  }, [famigliaId, categoriaId]);

  const creaFamiglia = useCallback(
    (payload) => {
      const creata = creaFamigliaCatalogo(payload);
      if (!creata) {
        setMessaggio("Impossibile creare il materiale. Controlla i campi.");
        return null;
      }
      ricarica();
      setMessaggio("Materiale aggiunto al catalogo.");
      setCategoriaId(creata.categoria);
      setFamigliaId(creata.id);
      return creata;
    },
    [ricarica]
  );

  const salvaFamiglia = useCallback(
    (id, patch) => {
      const aggiornata = aggiornaFamigliaCatalogo(id, patch);
      if (!aggiornata) {
        setMessaggio("Impossibile aggiornare il materiale.");
        return false;
      }
      ricarica();
      setMessaggio("Materiale aggiornato.");
      return true;
    },
    [ricarica]
  );

  const toggleAttivaFamiglia = useCallback(
    (id, attiva) => {
      impostaAttivaFamigliaCatalogo(id, attiva);
      ricarica();
      setMessaggio(attiva ? "Materiale attivato." : "Materiale disattivato.");
    },
    [ricarica]
  );

  const eliminaFamiglia = useCallback(
    (id, { hard = false } = {}) => {
      const ok = eliminaFamigliaCatalogo(id, { hard });
      if (!ok) return false;
      ricarica();
      if (famigliaId === String(id)) setFamigliaId(null);
      setMessaggio(hard ? "Materiale eliminato." : "Materiale disattivato.");
      return true;
    },
    [ricarica, famigliaId]
  );

  const creaVariante = useCallback(
    (targetFamigliaId, payload) => {
      const creata = creaVarianteCatalogo(targetFamigliaId, payload);
      if (!creata) {
        setMessaggio("Impossibile creare la variante.");
        return null;
      }
      ricarica();
      setMessaggio("Variante aggiunta.");
      return creata;
    },
    [ricarica]
  );

  const salvaVariante = useCallback(
    (targetFamigliaId, varianteId, patch) => {
      const aggiornata = aggiornaVarianteCatalogo(
        targetFamigliaId,
        varianteId,
        patch
      );
      if (!aggiornata) {
        setMessaggio("Impossibile aggiornare la variante.");
        return false;
      }
      ricarica();
      setMessaggio("Variante aggiornata.");
      return true;
    },
    [ricarica]
  );

  const toggleAttivaVariante = useCallback(
    (targetFamigliaId, varianteId, attiva) => {
      impostaAttivaVarianteCatalogo(targetFamigliaId, varianteId, attiva);
      ricarica();
      setMessaggio(attiva ? "Variante attivata." : "Variante disattivata.");
    },
    [ricarica]
  );

  const eliminaVariante = useCallback(
    (targetFamigliaId, varianteId, { hard = false } = {}) => {
      const ok = eliminaVarianteCatalogo(targetFamigliaId, varianteId, {
        hard,
      });
      if (!ok) return false;
      ricarica();
      setMessaggio(hard ? "Variante eliminata." : "Variante disattivata.");
      return true;
    },
    [ricarica]
  );

  const conteggiPerCategoria = useMemo(() => {
    /** @type {Record<string, number>} */
    const map = {};
    for (const id of CATEGORIE_MATERIALE) map[id] = 0;
    for (const famiglia of catalogo) {
      if (soloAttive && !famiglia.attiva) continue;
      map[famiglia.categoria] = (map[famiglia.categoria] || 0) + 1;
    }
    return map;
  }, [catalogo, soloAttive]);

  return {
    catalogo,
    categorie,
    famiglieVisibili,
    famigliaAttiva,
    vista,
    ricerca,
    categoriaId,
    famigliaId,
    messaggio,
    soloAttive,
    conteggiPerCategoria,
    setMessaggio,
    setSoloAttive,
    aggiornaRicerca,
    apriCategoria,
    apriFamiglia,
    indietro,
    creaFamiglia,
    salvaFamiglia,
    toggleAttivaFamiglia,
    eliminaFamiglia,
    creaVariante,
    salvaVariante,
    toggleAttivaVariante,
    eliminaVariante,
    ricarica,
  };
}
