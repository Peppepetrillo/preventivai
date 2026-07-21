import { useCallback } from "react";
import { FileDown } from "lucide-react";

import {
  calcolaSaldo,
  calcolaTotali,
  formatEuro,
  normalizzaNumero,
} from "../../../../utils/preventivi";
import { useSalvaEGeneraPdf } from "../../hooks/useSalvaEGeneraPdf";
import PreventivoSuccesso from "../components/PreventivoSuccesso";
import { opzioneTipoLavoro } from "../wizardConfig";

export default function StepConferma({ stato, onNuovoPreventivo }) {
  const { cliente, tipoLavoro, lavorazioni, condizioni } = stato;
  const opzione = opzioneTipoLavoro(tipoLavoro);
  const totali = calcolaTotali(
    lavorazioni,
    condizioni.sconto,
    condizioni.iva
  );
  const saldo = calcolaSaldo(totali.totale, condizioni.acconto);

  const {
    inElaborazione,
    errore,
    preventivoSalvato,
    salvaEGeneraPdf,
    resetEsito,
  } = useSalvaEGeneraPdf();

  const generaPdf = useCallback(async () => {
    await salvaEGeneraPdf(stato);
  }, [salvaEGeneraPdf, stato]);

  const gestisciNuovoPreventivo = useCallback(() => {
    resetEsito();
    onNuovoPreventivo?.();
  }, [onNuovoPreventivo, resetEsito]);

  if (preventivoSalvato) {
    return (
      <PreventivoSuccesso
        preventivo={preventivoSalvato}
        condizioni={condizioni}
        lavorazioni={lavorazioni}
        onNuovoPreventivo={gestisciNuovoPreventivo}
      />
    );
  }

  return (
    <div className="px-4 pb-36 space-y-4">
      <div className="pro-panel p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-slate-500 uppercase font-bold">Cliente</p>
            <p className="font-black truncate">{cliente || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase font-bold">Tipo</p>
            <p className="font-black truncate">{opzione?.titolo || "—"}</p>
          </div>
        </div>

        <div>
          <p className="text-xs text-slate-500 uppercase font-bold mb-2">
            Lavorazioni
          </p>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {lavorazioni.map((item) => (
              <div
                key={item.id || item.nome}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span className="text-slate-200 truncate">
                  {item.nome}{" "}
                  <span className="text-slate-500">×{item.quantita}</span>
                </span>
                <span className="font-bold text-yellow-200 shrink-0">
                  {formatEuro(
                    normalizzaNumero(item.prezzo) *
                      normalizzaNumero(item.quantita)
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-3 border-t border-white/10 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Imponibile</span>
            <span>{formatEuro(totali.imponibile)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">IVA {condizioni.iva}%</span>
            <span>{formatEuro(totali.importoIva)}</span>
          </div>
          {condizioni.sconto > 0 ? (
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Sconto {condizioni.sconto}%</span>
              <span>-{formatEuro(totali.importoSconto)}</span>
            </div>
          ) : null}
          <div className="flex justify-between items-end pt-1">
            <span className="text-xs text-slate-500 uppercase font-bold">
              Totale
            </span>
            <p className="text-3xl font-black text-yellow-200">
              {formatEuro(totali.totale)}
            </p>
          </div>
          {condizioni.acconto > 0 ? (
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Saldo</span>
              <span className="font-bold">{formatEuro(saldo)}</span>
            </div>
          ) : null}
        </div>

        <p className="text-sm text-slate-400">
          {condizioni.pagamento} · Valido {condizioni.validita} gg
        </p>

        {condizioni.note ? (
          <p className="text-sm text-slate-300 border-t border-white/10 pt-2">
            {condizioni.note}
          </p>
        ) : null}
      </div>

      {errore ? (
        <p className="text-sm text-red-300 pro-panel p-3" role="alert">
          {errore}
        </p>
      ) : null}

      <div className="fixed bottom-[88px] left-0 right-0 px-4 z-40 safe-bottom">
        <button
          type="button"
          onClick={generaPdf}
          disabled={inElaborazione || !cliente || lavorazioni.length === 0}
          className="w-full max-w-xl mx-auto h-14 btn-primary font-black flex items-center justify-center gap-2 disabled:opacity-45 shadow-[0_16px_50px_rgba(0,0,0,0.5)]"
        >
          <FileDown size={20} aria-hidden="true" />
          {inElaborazione ? "Genero PDF..." : "Genera PDF"}
        </button>
      </div>
    </div>
  );
}
