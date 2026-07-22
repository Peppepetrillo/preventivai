import { useCallback } from "react";

import {
  aggiornaCampoLavorazione,
  incrementaLavorazione,
} from "../preventiviDomain";
import { normalizzaNumero } from "../../../utils/preventivi";
import {
  registraUsoLavorazione,
  chiaveUsoDaLavorazione,
} from "../utils/lavorazioniUsage";

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

  /**
   * Imposta quantità diretta (UX smart). Usa aggiornaCampoLavorazione esistente.
   * Valore &lt; 1 → rimuove la riga (coerente con diminuisci a 1).
   */
  const impostaQuantita = useCallback(
    (indice, valore) => {
      onAggiornaLavorazioni((lavorazioni) => {
        const lavorazione = lavorazioni[indice];
        if (!lavorazione) return lavorazioni;

        const quantita = Math.max(
          0,
          Math.round(normalizzaNumero(valore, 0))
        );

        if (quantita < 1) {
          return lavorazioni.filter((_, i) => i !== indice);
        }

        const precedente = normalizzaNumero(lavorazione.quantita, 1);
        if (quantita === precedente) return lavorazioni;

        if (quantita > precedente) {
          registraUsoLavorazione(
            chiaveUsoDaLavorazione(lavorazione),
            quantita - precedente
          );
        }

        return lavorazioni.map((item, i) =>
          i === indice
            ? aggiornaCampoLavorazione(item, "quantita", quantita)
            : item
        );
      });
    },
    [onAggiornaLavorazioni]
  );

  /**
   * Prezzo solo sulla lavorazione in carrello — non tocca il listino.
   */
  const impostaPrezzo = useCallback(
    (indice, valore) => {
      onAggiornaLavorazioni((lavorazioni) => {
        const lavorazione = lavorazioni[indice];
        if (!lavorazione) return lavorazioni;

        const prezzo = Math.max(0, normalizzaNumero(valore, 0));
        if (prezzo === normalizzaNumero(lavorazione.prezzo)) {
          return lavorazioni;
        }

        return lavorazioni.map((item, i) =>
          i === indice ? aggiornaCampoLavorazione(item, "prezzo", prezzo) : item
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
    impostaQuantita,
    impostaPrezzo,
    rimuoviLavorazione,
  };
}
