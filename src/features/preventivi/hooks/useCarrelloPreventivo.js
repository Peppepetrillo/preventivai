import { useCallback } from "react";

import {
  aggiornaCampoLavorazione,
  incrementaLavorazione,
} from "../preventiviDomain";
import { normalizzaNumero } from "../../../utils/preventivi";
import { registraUsoLavorazione, chiaveUsoDaLavorazione } from "../utils/lavorazioniUsage";

export function useCarrelloPreventivo({ onAggiornaLavorazioni }) {
  const aumentaQuantita = useCallback(
    (indice) => {
      onAggiornaLavorazioni((lavorazioni) => {
        const lavorazione = lavorazioni[indice];
        if (!lavorazione) return lavorazioni;

        registraUsoLavorazione(chiaveUsoDaLavorazione(lavorazione), 1);

        return lavorazioni.map((item, i) =>
          i === indice ? incrementaLavorazione(item) : item
        );
      });
    },
    [onAggiornaLavorazioni]
  );

  const diminuisciQuantita = useCallback(
    (indice) => {
      onAggiornaLavorazioni((lavorazioni) => {
        const lavorazione = lavorazioni[indice];
        if (!lavorazione) return lavorazioni;

        const quantita = normalizzaNumero(lavorazione.quantita, 1);

        if (quantita <= 1) {
          return lavorazioni.filter((_, i) => i !== indice);
        }

        return lavorazioni.map((item, i) =>
          i === indice
            ? aggiornaCampoLavorazione(item, "quantita", quantita - 1)
            : item
        );
      });
    },
    [onAggiornaLavorazioni]
  );

  const rimuoviLavorazione = useCallback(
    (indice) => {
      onAggiornaLavorazioni((lavorazioni) =>
        lavorazioni.filter((_, i) => i !== indice)
      );
    },
    [onAggiornaLavorazioni]
  );

  return {
    aumentaQuantita,
    diminuisciQuantita,
    rimuoviLavorazione,
  };
}
