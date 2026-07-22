import { memo, useCallback, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

import NumericInput from "../../../components/NumericInput";
import { formatEuro, normalizzaNumero } from "../../../utils/preventivi";
import Stepper from "./Stepper";

/**
 * Riga carrello premium — gerarchia fissa DS:
 * Nome → Prezzo unitario → Quantità → Totale → Azioni (cestino secondario).
 */
function RigaCarrello({
  indice,
  lavorazione,
  prezzoListino,
  onAumentaQuantita,
  onDiminuisciQuantita,
  onImpostaQuantita,
  onImpostaPrezzo,
  onRimuoviLavorazione,
}) {
  const [modificaPrezzo, setModificaPrezzo] = useState(false);
  const quantita = normalizzaNumero(lavorazione.quantita, 1);
  const prezzo = normalizzaNumero(lavorazione.prezzo);
  const subtotale = prezzo * quantita;
  const listinoNoto =
    prezzoListino !== undefined &&
    prezzoListino !== null &&
    Number.isFinite(Number(prezzoListino));
  const prezzoPersonalizzato =
    listinoNoto && prezzo !== normalizzaNumero(prezzoListino);

  const aumenta = useCallback(() => {
    onAumentaQuantita(indice);
  }, [indice, onAumentaQuantita]);

  const diminuisci = useCallback(() => {
    onDiminuisciQuantita(indice);
  }, [indice, onDiminuisciQuantita]);

  const impostaQuantita = useCallback(
    (valore) => {
      onImpostaQuantita?.(indice, valore);
    },
    [indice, onImpostaQuantita]
  );

  const confermaPrezzo = useCallback(
    (prossimo) => {
      if (typeof prossimo !== "number") return;
      onImpostaPrezzo?.(indice, prossimo);
    },
    [indice, onImpostaPrezzo]
  );

  const rimuovi = useCallback(() => {
    onRimuoviLavorazione(indice);
  }, [indice, onRimuoviLavorazione]);

  return (
    <article className="py-2 border-b border-white/[0.06] last:border-b-0">
      {/* Nome + Totale riga (info economica primaria) */}
      <div className="flex items-start gap-3">
        <p className="min-w-0 flex-1 text-[15px] font-semibold leading-snug text-white truncate">
          {lavorazione.nome}
        </p>
        <p
          className="shrink-0 text-[16px] font-semibold leading-snug text-yellow-200 tabular-nums"
          aria-label={`Totale riga ${formatEuro(subtotale)}`}
        >
          {formatEuro(subtotale)}
        </p>
      </div>

      {/* Prezzo unitario (tap → edit) */}
      <div className="mt-1">
        {modificaPrezzo && onImpostaPrezzo ? (
          <NumericInput
            autoFocus
            aria-label={`Prezzo unitario di ${lavorazione.nome}`}
            value={prezzo}
            inputMode="decimal"
            className="w-[5.5rem] min-h-[44px] px-2 rounded-[16px] border border-white/15 bg-white/[0.06] text-[16px] font-medium tabular-nums text-white outline-none"
            onChange={confermaPrezzo}
            onBlur={() => setModificaPrezzo(false)}
          />
        ) : (
          <button
            type="button"
            onClick={() => onImpostaPrezzo && setModificaPrezzo(true)}
            disabled={!onImpostaPrezzo}
            className="inline-flex items-center gap-1 min-h-[44px] text-[14px] text-slate-400 disabled:pointer-events-none"
            aria-label={
              onImpostaPrezzo
                ? `Prezzo ${formatEuro(prezzo)}${
                    lavorazione.unita ? ` per ${lavorazione.unita}` : ""
                  }. Tocca per modificare`
                : `Prezzo ${formatEuro(prezzo)}`
            }
          >
            <span className="tabular-nums">{formatEuro(prezzo)}</span>
            {lavorazione.unita ? (
              <span className="text-slate-500">/ {lavorazione.unita}</span>
            ) : null}
            {prezzoPersonalizzato ? (
              <span
                className="inline-flex text-slate-500"
                title="Prezzo diverso dal listino"
              >
                <Pencil size={11} aria-hidden="true" />
                <span className="sr-only">Personalizzato</span>
              </span>
            ) : null}
          </button>
        )}
      </div>

      {/* Quantità + azione secondaria (cestino) */}
      <div className="mt-1 flex items-center justify-between gap-2">
        <Stepper
          compatto
          valore={quantita}
          nomeVoce={lavorazione.nome}
          onDiminuisci={diminuisci}
          onAumenta={aumenta}
          onImpostaValore={onImpostaQuantita ? impostaQuantita : undefined}
        />

        <button
          type="button"
          onClick={rimuovi}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-500 hover:text-slate-300 transition-colors duration-150"
          aria-label={`Rimuovi ${lavorazione.nome}`}
        >
          <Trash2 size={16} strokeWidth={1.75} aria-hidden="true" />
        </button>
      </div>
    </article>
  );
}

function sonoUguali(precedente, successivo) {
  return (
    precedente.indice === successivo.indice &&
    precedente.lavorazione.id === successivo.lavorazione.id &&
    precedente.lavorazione.nome === successivo.lavorazione.nome &&
    precedente.lavorazione.quantita === successivo.lavorazione.quantita &&
    precedente.lavorazione.prezzo === successivo.lavorazione.prezzo &&
    precedente.prezzoListino === successivo.prezzoListino &&
    precedente.onAumentaQuantita === successivo.onAumentaQuantita &&
    precedente.onDiminuisciQuantita === successivo.onDiminuisciQuantita &&
    precedente.onImpostaQuantita === successivo.onImpostaQuantita &&
    precedente.onImpostaPrezzo === successivo.onImpostaPrezzo &&
    precedente.onRimuoviLavorazione === successivo.onRimuoviLavorazione
  );
}

export default memo(RigaCarrello, sonoUguali);
