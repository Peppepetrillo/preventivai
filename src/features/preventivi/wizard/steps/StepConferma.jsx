import { useCallback } from "react";
import { Pencil, Save } from "lucide-react";

import {
  calcolaSaldo,
  calcolaTotali,
  formatEuro,
  normalizzaNumero,
} from "../../../../utils/preventivi";
import PreventivoSuccesso from "../components/PreventivoSuccesso";
import { opzioneTipoLavoro } from "../wizardConfig";

export default function StepConferma({
  stato,
  inElaborazione = false,
  pdfInCorso = false,
  errore = "",
  avvisoPdf = "",
  preventivoSalvato = null,
  pdfGenerato = false,
  onSalva,
  onRiprovaPdf,
  onNuovoPreventivo,
  onModificaComposizione,
}) {
  const { cliente, tipoLavoro, lavorazioni, condizioni } = stato;
  const opzione = opzioneTipoLavoro(tipoLavoro);
  const totali = calcolaTotali(
    lavorazioni,
    condizioni.sconto,
    condizioni.iva
  );
  const saldo = calcolaSaldo(totali.totale, condizioni.acconto);

  const salvaPreventivo = useCallback(async () => {
    await onSalva?.();
  }, [onSalva]);

  const gestisciRiprovaPdf = useCallback(async () => {
    await onRiprovaPdf?.();
  }, [onRiprovaPdf]);

  if (preventivoSalvato) {
    return (
      <PreventivoSuccesso
        preventivo={preventivoSalvato}
        condizioni={condizioni}
        lavorazioni={lavorazioni}
        pdfGenerato={pdfGenerato}
        avvisoPdf={avvisoPdf}
        inElaborazione={pdfInCorso}
        onRiprovaPdf={gestisciRiprovaPdf}
        onNuovoPreventivo={onNuovoPreventivo}
      />
    );
  }

  const puoSalvare = Boolean(cliente?.trim()) && lavorazioni.length > 0;

  return (
    <div className="px-4 pb-36 space-y-4" data-testid="step-conferma">
      <header className="pro-panel-strong p-5" data-testid="riepilogo-hero">
        <p className="section-label">{opzione?.titolo || "Preventivo"}</p>
        <div className="flex flex-wrap items-start justify-between gap-3 mt-2">
          <h2 className="ds-page-title min-w-0 flex-1 truncate">
            {cliente || "Cliente"}
          </h2>
          <span className="ds-badge ds-badge-da-iniziare shrink-0">Bozza</span>
        </div>
        <div className="mt-5 pt-4 border-t border-white/[0.08]">
          <p className="ds-text-secondary">Totale IVA incl.</p>
          <p
            className="text-3xl font-bold tracking-tight mt-1 text-yellow-100"
            data-testid="riepilogo-totale"
          >
            {formatEuro(totali.totale)}
          </p>
        </div>
      </header>

      <section className="pro-panel p-4 space-y-3" aria-label="Lavorazioni">
        <p className="section-label">Lavorazioni · {lavorazioni.length}</p>
        <div className="space-y-2">
          {lavorazioni.map((item) => (
            <div
              key={item.id || item.nome}
              className="flex items-center justify-between gap-3"
            >
              <span className="ds-text-primary truncate">
                {item.nome}{" "}
                <span className="ds-text-secondary">×{item.quantita}</span>
              </span>
              <span className="ds-text-primary shrink-0 text-yellow-200">
                {formatEuro(
                  normalizzaNumero(item.prezzo) *
                    normalizzaNumero(item.quantita)
                )}
              </span>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-white/10 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="ds-text-secondary">Imponibile</span>
            <span>{formatEuro(totali.imponibile)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="ds-text-secondary">IVA {condizioni.iva}%</span>
            <span>{formatEuro(totali.importoIva)}</span>
          </div>
          {condizioni.sconto > 0 ? (
            <div className="flex justify-between text-sm">
              <span className="ds-text-secondary">
                Sconto {condizioni.sconto}%
              </span>
              <span>-{formatEuro(totali.importoSconto)}</span>
            </div>
          ) : null}
          {condizioni.acconto > 0 ? (
            <div className="flex justify-between text-sm">
              <span className="ds-text-secondary">Saldo</span>
              <span>{formatEuro(saldo)}</span>
            </div>
          ) : null}
        </div>
      </section>

      <section className="pro-panel p-4 space-y-2" aria-label="Condizioni">
        <p className="ds-text-secondary">
          {condizioni.pagamento} · Valido {condizioni.validita} gg · IVA{" "}
          {condizioni.iva}%
        </p>
        {condizioni.note ? (
          <p className="ds-text-primary text-sm pt-2 border-t border-white/10">
            {condizioni.note}
          </p>
        ) : null}
      </section>

      {onModificaComposizione ? (
        <button
          type="button"
          onClick={onModificaComposizione}
          className="w-full min-h-[44px] btn-secondary flex items-center justify-center gap-2"
          data-testid="modifica-composizione"
        >
          <Pencil size={16} aria-hidden="true" />
          Modifica composizione
        </button>
      ) : null}

      {errore ? (
        <p className="text-sm text-red-300 pro-panel p-3" role="alert">
          {errore}
        </p>
      ) : null}

      <div className="fixed bottom-[88px] left-0 right-0 px-4 z-40 safe-bottom">
        <button
          type="button"
          onClick={salvaPreventivo}
          disabled={inElaborazione || !puoSalvare}
          className="w-full max-w-xl mx-auto min-h-[56px] btn-primary flex items-center justify-center gap-2 disabled:opacity-45 shadow-[var(--shadow-soft)]"
          data-testid="salva-preventivo"
        >
          <Save size={20} aria-hidden="true" />
          {inElaborazione ? "Salvo..." : "Salva preventivo"}
        </button>
      </div>
    </div>
  );
}
