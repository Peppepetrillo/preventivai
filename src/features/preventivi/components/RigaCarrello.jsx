import { memo, useCallback } from "react";
import { Trash2 } from "lucide-react";

import { formatEuro, normalizzaNumero } from "../../../utils/preventivi";
import Stepper from "./Stepper";

function RigaCarrello({
  indice,
  lavorazione,
  onAumentaQuantita,
  onDiminuisciQuantita,
  onRimuoviLavorazione,
}) {
  const quantita = normalizzaNumero(lavorazione.quantita, 1);
  const subtotale =
    normalizzaNumero(lavorazione.prezzo) * normalizzaNumero(lavorazione.quantita);

  const aumenta = useCallback(() => {
    onAumentaQuantita(indice);
  }, [indice, onAumentaQuantita]);

  const diminuisci = useCallback(() => {
    onDiminuisciQuantita(indice);
  }, [indice, onDiminuisciQuantita]);

  const rimuovi = useCallback(() => {
    onRimuoviLavorazione(indice);
  }, [indice, onRimuoviLavorazione]);

  return (
    <div className="flex items-center gap-2 py-2 border-b border-white/8 last:border-b-0">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-black truncate leading-tight">
          {lavorazione.nome}
        </p>
        <p className="text-[11px] text-slate-500 mt-0.5">
          {formatEuro(lavorazione.prezzo)}
          {lavorazione.unita ? ` / ${lavorazione.unita}` : ""}
        </p>
      </div>

      <Stepper
        valore={quantita}
        nomeVoce={lavorazione.nome}
        onDiminuisci={diminuisci}
        onAumenta={aumenta}
      />

      <p className="text-sm font-black text-yellow-200 w-[4.5rem] text-right tabular-nums shrink-0">
        {formatEuro(subtotale)}
      </p>

      <button
        type="button"
        onClick={rimuovi}
        className="w-9 h-9 rounded-[10px] bg-red-500/15 text-red-200 flex items-center justify-center shrink-0"
        aria-label={`Rimuovi ${lavorazione.nome}`}
      >
        <Trash2 size={16} aria-hidden="true" />
      </button>
    </div>
  );
}

function sonoUguali(precedente, successivo) {
  return (
    precedente.indice === successivo.indice &&
    precedente.lavorazione.id === successivo.lavorazione.id &&
    precedente.lavorazione.nome === successivo.lavorazione.nome &&
    precedente.lavorazione.quantita === successivo.lavorazione.quantita &&
    precedente.lavorazione.prezzo === successivo.lavorazione.prezzo &&
    precedente.onAumentaQuantita === successivo.onAumentaQuantita &&
    precedente.onDiminuisciQuantita === successivo.onDiminuisciQuantita &&
    precedente.onRimuoviLavorazione === successivo.onRimuoviLavorazione
  );
}

export default memo(RigaCarrello, sonoUguali);
