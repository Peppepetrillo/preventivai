import { useCallback, useMemo, useState } from "react";

import {
  aggregaVociAcquisto,
  calcolaSintesiAcquisti,
  impostaAcquistatoVociListaSpesa,
  leggiListaSpesa,
  raggruppaAcquistiPerLavoro,
  toggleAcquistatoListaSpesa,
} from "../../../domain/listaSpesa";
import { unitaAcquistoInLettura } from "../../../domain/listaSpesa/listaSpesaDomain";

export const VISTA_ACQUISTI = {
  perLavoro: "per-lavoro",
  tutto: "tutto",
};

export const FILTRO_ACQUISTI = {
  daComprare: "da-comprare",
  tutti: "tutti",
};

function matchRicerca(voce, q) {
  if (!q) return true;
  const hay = [
    voce.nome,
    voce.note,
    voce.cliente,
    voce.titoloLavoro,
    voce.unita,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return hay.includes(q);
}

/**
 * Hook UI pagina Acquisti — usa solo listaSpesa + selectors Step 8.1.
 */
export function useAcquistiUi() {
  const [lista, setLista] = useState(() => leggiListaSpesa());
  const [vista, setVista] = useState(VISTA_ACQUISTI.perLavoro);
  const [filtro, setFiltro] = useState(FILTRO_ACQUISTI.daComprare);
  const [ricerca, setRicerca] = useState("");
  const [espansi, setEspansi] = useState(() => new Set());

  const ricarica = useCallback(() => {
    setLista(leggiListaSpesa());
  }, []);

  const q = ricerca.trim().toLowerCase();
  const soloDaComprare = filtro === FILTRO_ACQUISTI.daComprare;

  const vociFiltrate = useMemo(() => {
    const base = soloDaComprare
      ? lista.filter((v) => v && !v.acquistato && v.nome)
      : (lista || []).filter((v) => v?.nome);
    return base.filter((v) => matchRicerca(v, q));
  }, [lista, soloDaComprare, q]);

  const gruppi = useMemo(
    () => raggruppaAcquistiPerLavoro(vociFiltrate, { soloDaComprare: false }),
    [vociFiltrate]
  );

  const aggregati = useMemo(
    () => aggregaVociAcquisto(vociFiltrate, { soloDaComprare: false }),
    [vociFiltrate]
  );

  const sintesi = useMemo(() => calcolaSintesiAcquisti(lista), [lista]);

  const vuoto =
    filtro === FILTRO_ACQUISTI.daComprare
      ? sintesi.materiali === 0 && !q
      : lista.length === 0 && !q;

  const senzaRisultati = !vuoto && vociFiltrate.length === 0;

  function aggiornaRicerca(event) {
    setRicerca(event?.target?.value ?? "");
  }

  function toggleVoce(id) {
    toggleAcquistatoListaSpesa(id);
    ricarica();
  }

  function toggleAggregato(agg) {
    if (!agg?.idsVoci?.length) return;
    const prossimo = !agg.tuttiAcquistati;
    impostaAcquistatoVociListaSpesa(agg.idsVoci, prossimo);
    ricarica();
  }

  function toggleEspanso(chiave) {
    setEspansi((prev) => {
      const next = new Set(prev);
      if (next.has(chiave)) next.delete(chiave);
      else next.add(chiave);
      return next;
    });
  }

  return {
    lista,
    vista,
    setVista,
    filtro,
    setFiltro,
    ricerca,
    aggiornaRicerca,
    gruppi,
    aggregati,
    sintesi,
    vuoto,
    senzaRisultati,
    espansi,
    toggleVoce,
    toggleAggregato,
    toggleEspanso,
    formatUnita: unitaAcquistoInLettura,
  };
}
