import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, ChevronRight } from "lucide-react";

import NumericInput from "../../../components/NumericInput";
import { formatEuro, normalizzaNumero } from "../../../utils/preventivi";
import {
  ETICHETTE_METODO_PAGAMENTO,
  ETICHETTE_TIPO_PAGAMENTO,
  riepilogoEconomicoCantiere,
} from "../services/pagamentiCantiereService";
import PagamentoSheet from "./PagamentoSheet";

/**
 * Tab Economico: riepilogo + registro pagamenti (UX-7.5).
 */
export default function PagamentiSection({
  cantiere,
  diretto = false,
  onAggiornaTotaleLavoro,
  onAggiungi,
  onAggiorna,
  onElimina,
  registraIncassoTrigger = 0,
  registraIncassoImportoIniziale = null,
  registraIncassoOrigine = null,
}) {
  const [sheetAperto, setSheetAperto] = useState(false);
  const [inModifica, setInModifica] = useState(null);
  const [apriComeSaldo, setApriComeSaldo] = useState(false);
  const [importoPrefill, setImportoPrefill] = useState(null);
  const [sheetOrigine, setSheetOrigine] = useState(null);
  const ultimoTriggerIncasso = useRef(0);

  const riepilogo = useMemo(
    () => riepilogoEconomicoCantiere(cantiere),
    [cantiere]
  );

  function apriNuovo({ importoIniziale = null, origine = null } = {}) {
    setInModifica(null);
    setApriComeSaldo(false);
    setImportoPrefill(importoIniziale);
    setSheetOrigine(origine);
    setSheetAperto(true);
  }

  function apriRegistraSaldo() {
    setInModifica(null);
    setApriComeSaldo(true);
    setImportoPrefill(null);
    setSheetOrigine(null);
    setSheetAperto(true);
  }

  useEffect(() => {
    if (
      !registraIncassoTrigger ||
      registraIncassoTrigger === ultimoTriggerIncasso.current
    ) {
      return;
    }
    ultimoTriggerIncasso.current = registraIncassoTrigger;
    apriNuovo({
      importoIniziale: registraIncassoImportoIniziale,
      origine: registraIncassoOrigine,
    });
  }, [
    registraIncassoTrigger,
    registraIncassoImportoIniziale,
    registraIncassoOrigine,
  ]);

  function gestisciSalva(payload) {
    const daAssistente = sheetOrigine === "assistente-economico";
    if (inModifica?.id) {
      onAggiorna?.(inModifica.id, payload);
    } else {
      onAggiungi?.(payload);
    }
    setSheetAperto(false);
    setApriComeSaldo(false);
    setImportoPrefill(null);
    setSheetOrigine(null);
    if (daAssistente) return;
    requestAnimationFrame(() => {
      document
        .getElementById("sezione-pagamenti")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  return (
    <section
      id="sezione-pagamenti"
      className="scroll-mt-24"
      aria-labelledby="pagamenti-title"
      data-testid="cantiere-pagamenti"
    >
      <h2 id="pagamenti-title" className="ds-card-title mb-4">
        Pagamenti
      </h2>

      {diretto ? (
        <label className="block mb-4" data-testid="economico-lavoro-diretto">
          <span className="ds-text-secondary text-xs font-bold uppercase tracking-wide">
            Prezzo lavoro
          </span>
          <NumericInput
            className="mt-1.5 w-full min-h-[48px] rounded-[16px] border border-white/10 bg-black/30 px-4 text-white text-base"
            value={riepilogo.totale || ""}
            onChange={(v) => {
              const n = Math.max(normalizzaNumero(v), 0);
              onAggiornaTotaleLavoro?.(n);
            }}
            min={0}
            data-testid="totale-lavoro-input"
          />
        </label>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3 mb-5">
        <div className="rounded-[14px] border border-white/10 bg-black/[0.18] p-4">
          <p className="ds-text-secondary text-sm">Totale</p>
          <p
            className="text-2xl font-semibold mt-1 tabular-nums ds-text-primary"
            data-testid="economico-totale"
          >
            {formatEuro(riepilogo.totale)}
          </p>
        </div>
        <div className="rounded-[14px] border border-white/10 bg-black/[0.18] p-4">
          <p className="ds-text-secondary text-sm">Già incassato</p>
          <p
            className="text-2xl font-semibold mt-1 tabular-nums ds-text-primary"
            data-testid="economico-incassato"
          >
            {formatEuro(riepilogo.incassato)}
          </p>
          {riepilogo.overpayment ? (
            <span
              className="ds-badge mt-2 inline-flex bg-amber-500/20 text-amber-100"
              data-testid="badge-overpayment"
            >
              Oltre il totale
            </span>
          ) : null}
        </div>
        <div className="rounded-[14px] border border-yellow-400/20 bg-yellow-400/10 p-4">
          <p className="text-sm text-yellow-100/80">Resta da incassare</p>
          <p
            className="text-2xl font-semibold mt-1 tabular-nums text-yellow-100"
            data-testid="economico-rimanenza"
          >
            {formatEuro(riepilogo.rimanenza)}
          </p>
        </div>
      </div>

      {riepilogo.rimanenza > 0 ? (
        <button
          type="button"
          onClick={apriRegistraSaldo}
          className="btn-primary w-full min-h-[48px] mb-5"
          data-testid="pagamento-registra-saldo"
        >
          Registra saldo ({formatEuro(riepilogo.rimanenza)})
        </button>
      ) : null}

      <div className="flex items-center justify-between gap-3 mb-3">
        <h3 className="ds-text-primary font-semibold">Pagamenti registrati</h3>
        <button
          type="button"
          onClick={() => apriNuovo()}
          className="btn-primary min-h-[44px] px-3 flex items-center gap-2 text-sm font-bold"
          data-testid="pagamento-aggiungi"
        >
          <Plus size={18} aria-hidden="true" />
          Registra pagamento
        </button>
      </div>

      {riepilogo.pagamenti.length === 0 ? (
        <div className="ds-empty pro-panel p-5" data-testid="pagamenti-empty">
          <p className="ds-card-title">Nessun pagamento registrato</p>
          <p className="ds-text-secondary mt-2">
            {riepilogo.rimanenza > 0
              ? "Usa Registra saldo sopra oppure aggiungi un acconto."
              : "Registra acconti e saldi: restano nel cantiere, non nel Diario."}
          </p>
          {riepilogo.rimanenza <= 0 ? (
            <button
              type="button"
              onClick={() => apriNuovo()}
              className="btn-primary mt-4 min-h-[48px] w-full"
              data-testid="pagamento-empty-primo"
            >
              Registra il primo pagamento
            </button>
          ) : null}
        </div>
      ) : (
        <ul className="space-y-3" data-testid="pagamenti-lista">
          {[...riepilogo.pagamenti].reverse().map((pagamento) => (
            <li key={pagamento.id}>
              <button
                type="button"
                onClick={() => {
                  setInModifica(pagamento);
                  setApriComeSaldo(false);
                  setSheetAperto(true);
                }}
                className="pro-panel w-full p-4 text-left min-h-[72px] active:scale-[0.99] transition-transform"
                data-testid={`pagamento-riga-${pagamento.id}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="ds-text-primary font-medium">{pagamento.data}</p>
                    <p className="ds-text-secondary mt-1">
                      {ETICHETTE_TIPO_PAGAMENTO[pagamento.tipo] || "Pagamento"}
                      {" · "}
                      {ETICHETTE_METODO_PAGAMENTO[pagamento.metodo] || "Altro"}
                    </p>
                    {pagamento.note ? (
                      <p className="ds-text-secondary text-sm mt-1 line-clamp-2">
                        {pagamento.note}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <p className="ds-text-primary font-semibold tabular-nums">
                      {formatEuro(pagamento.importo)}
                    </p>
                    <ChevronRight
                      size={18}
                      className="text-slate-500"
                      aria-hidden="true"
                    />
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      <PagamentoSheet
        open={sheetAperto}
        onClose={() => {
          setSheetAperto(false);
          setApriComeSaldo(false);
          setImportoPrefill(null);
          setSheetOrigine(null);
        }}
        pagamento={inModifica}
        rimanenza={riepilogo.rimanenza}
        importoIniziale={
          !inModifica
            ? apriComeSaldo
              ? riepilogo.rimanenza
              : importoPrefill
            : null
        }
        tipoIniziale={apriComeSaldo && !inModifica ? "saldo" : null}
        onSalva={gestisciSalva}
        onElimina={(id) => onElimina?.(id)}
      />
    </section>
  );
}
