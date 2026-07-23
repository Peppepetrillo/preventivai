import { useCallback, useMemo, useState } from "react";

import { selezionaVociAttive } from "../../listino/listinoCatalogDomain";
import { leggiListino } from "../../../repositories/listinoRepository";
import {
  creaLavorazioneDaVoce,
  incrementaLavorazione,
} from "../preventiviDomain";
import { aggiungiKitALavorazioni } from "../kitListinoDomain";
import { filtraListino } from "../utils/listinoGrouping";
import {
  leggiLavorazioniPiuUsate,
  registraUsoLavorazione,
} from "../utils/lavorazioniUsage";

export function useComponiPreventivo({ onAggiornaLavorazioni }) {
  const [listino] = useState(() => selezionaVociAttive(leggiListino()));
  const [ricerca, setRicerca] = useState("");

  const listinoFiltrato = useMemo(
    () => filtraListino(listino, ricerca),
    [listino, ricerca]
  );

  const piuUsati = useMemo(
    () => leggiLavorazioniPiuUsate(listinoFiltrato),
    [listinoFiltrato]
  );

  const aggiungiVoce = useCallback(
    (voce) => {
      onAggiornaLavorazioni((lavorazioni) => {
        const esistente = lavorazioni.find((item) => item.nome === voce.nome);

        if (esistente) {
          return lavorazioni.map((item) =>
            item.nome === voce.nome ? incrementaLavorazione(item) : item
          );
        }

        return [...lavorazioni, creaLavorazioneDaVoce(voce)];
      });

      registraUsoLavorazione(voce.id ?? voce.nome, 1);
    },
    [onAggiornaLavorazioni]
  );

  const aggiungiKit = useCallback(
    (kit) => {
      onAggiornaLavorazioni((lavorazioni) =>
        aggiungiKitALavorazioni(lavorazioni, listino, kit.id)
      );

      kit.voci.forEach((voceKit) => {
        registraUsoLavorazione(voceKit.voceId, voceKit.quantita);
      });
    },
    [listino, onAggiornaLavorazioni]
  );

  return {
    listino,
    listinoFiltrato,
    piuUsati,
    ricerca,
    setRicerca,
    aggiungiVoce,
    aggiungiKit,
  };
}
