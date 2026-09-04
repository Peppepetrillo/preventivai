import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle, FileText, HardHat, Plus, Wallet } from "lucide-react";
import PageWrapper from "../components/PageWrapper";
import PageBackLink from "../components/PageBackLink";
import NumericInput from "../components/NumericInput";
import { APP_EVENTS } from "../app/events";
import { routeCantierePagamenti, routePreventivo } from "../app/routes";
import { useDatiLocaliSincronizzati } from "../hooks/useDatiLocaliSincronizzati";
import { leggiPreventivi, leggiPreventiviTutti, salvaPreventivi } from "../repositories/preventiviRepository";
import { isRecordCestinato } from "../domain/cestino";
import { STATI_PREVENTIVO, normalizzaStatoPreventivo, trovaCantiereCollegato } from "../domain/workflow";
import { formatEuro, normalizzaNumero } from "../utils/preventivi";
import {
  calcolaDaIncassare,
  normalizzaPreventivoIncasso,
  registraIncasso,
  riepilogaIncassi,
  segnaPreventivoSaldato
} from "../features/preventivi/incassiDomain";
import { isPagamentiSuCantiere } from "../features/preventivi/utils/preventivoHeroCta";

function leggiPreventiviIncasso() {
  return leggiPreventivi().map(normalizzaPreventivoIncasso);
}

/** Preventivi ancora gestibili su /incassi (non ancora in cantiere). */
function isPreventivoOperativoIncassi(preventivo) {
  const s = normalizzaStatoPreventivo(preventivo?.stato);
  if (
    s === STATI_PREVENTIVO.CONVERTITO ||
    s === STATI_PREVENTIVO.LAVORO_COMPLETATO
  ) {
    return false;
  }
  if (isPagamentiSuCantiere(preventivo)) return false;
  return (
    s === STATI_PREVENTIVO.BOZZA ||
    s === STATI_PREVENTIVO.INVIATO ||
    s === STATI_PREVENTIVO.ACCETTATO
  );
}

export default function Incassi() {
  const [preventivi, setPreventivi] = useDatiLocaliSincronizzati(
    leggiPreventiviIncasso,
    [APP_EVENTS.preventiviAggiornati]
  );
  const [importi, setImporti] = useState({});

  const preventiviOperativi = useMemo(
    () => (preventivi || []).filter(isPreventivoOperativoIncassi),
    [preventivi]
  );
  const riepilogo = riepilogaIncassi(preventiviOperativi);

  function salvaListaPreventivi(nuoviPreventiviAttivi) {
    const tutti = leggiPreventiviTutti();
    const perId = new Map(
      nuoviPreventiviAttivi.map((item) => [String(item.id), item])
    );
    const prossimo = tutti.map((item) => {
      if (isRecordCestinato(item)) return item;
      return perId.get(String(item.id)) || item;
    });
    salvaPreventivi(prossimo);
    setPreventivi(nuoviPreventiviAttivi);
  }

  function aggiornaImporto(preventivoId, valore) {
    setImporti({
      ...importi,
      [preventivoId]: valore });
  }

  function registraPagamento(preventivo) {
    if (!isPreventivoOperativoIncassi(preventivo)) return;
    const importo = normalizzaNumero(importi[preventivo.id]);
    if (importo <= 0) return;

    salvaListaPreventivi(
      preventivi.map((item) =>
        String(item.id) === String(preventivo.id)
          ? registraIncasso(item, importo)
          : item
      )
    );
    aggiornaImporto(preventivo.id, "");
  }

  function segnaSaldato(preventivo) {
    if (!isPreventivoOperativoIncassi(preventivo)) return;
    salvaListaPreventivi(
      preventivi.map((item) =>
        String(item.id) === String(preventivo.id)
          ? segnaPreventivoSaldato(item)
          : item
      )
    );
  }

  return (
    <PageWrapper>
      <div className="pro-page text-white">
        <PageBackLink testId="incassi-back" />

        <section className="pro-panel-strong p-5 mb-6">
          <p className="section-label">Prima del cantiere</p>
          <h1 className="ds-page-title mt-1">Pagamenti sui preventivi</h1>
          <p className="ds-text-secondary mt-2">
            Solo preventivi non ancora in cantiere. Dopo «Inizia cantiere», i
            pagamenti si registrano nel tab Pagamenti del cantiere.
          </p>
        </section>

        <section className="grid gap-3 sm:grid-cols-3 mb-6">
          <div className="pro-panel p-4">
            <Wallet size={22} className="text-yellow-300 mb-3" />
            <p className="text-sm text-slate-400">Resta da incassare</p>
            <p className="text-2xl font-black mt-1">{formatEuro(riepilogo.daIncassare)}</p>
          </div>
          <div className="pro-panel p-4">
            <Plus size={22} className="text-emerald-300 mb-3" />
            <p className="text-sm text-slate-400">Già incassato</p>
            <p className="text-2xl font-black mt-1">{formatEuro(riepilogo.incassato)}</p>
          </div>
          <div className="pro-panel p-4">
            <CheckCircle size={22} className="text-sky-300 mb-3" />
            <p className="text-sm text-slate-400">Lavori saldati</p>
            <p className="text-2xl font-black mt-1">{riepilogo.saldati}</p>
          </div>
        </section>

        <section className="grid gap-3" data-testid="incassi-lista-operativa">
          {preventiviOperativi.length === 0 && (
            <div className="pro-panel p-6 text-center text-slate-400">
              Nessun preventivo da gestire qui. I pagamenti dei lavori in
              cantiere sono nel tab Pagamenti del cantiere.
            </div>
          )}

          {preventiviOperativi.map((preventivo) => {
            const daIncassare = calcolaDaIncassare(preventivo);
            const cantiere = trovaCantiereCollegato(preventivo);

            return (
              <div
                key={preventivo.id}
                className="pro-panel p-4"
                data-testid={`incassi-card-${preventivo.id}`}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase text-yellow-200">
                      {preventivo.numero || `PREV-${preventivo.id}`}
                    </p>
                    <h2 className="text-xl font-black mt-1 truncate">
                      {preventivo.cliente || "Cliente non indicato"}
                    </h2>
                    <div className="mt-3 grid gap-2 text-sm text-slate-300 sm:grid-cols-4">
                      <span>Totale {formatEuro(preventivo.totale)}</span>
                      <span>Già incassato {formatEuro(preventivo.incassato)}</span>
                      <span>Resta {formatEuro(daIncassare)}</span>
                      <span className="font-bold text-yellow-100">{preventivo.statoIncasso}</span>
                    </div>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-[130px_auto_auto]">
                    <NumericInput
                      min="0"
                      value={importi[preventivo.id] || ""}
                      inputMode="decimal"
                      onChange={(event) => aggiornaImporto(preventivo.id, event)}
                      placeholder="Importo"
                      className="input-pro"
                    />
                    <button
                      type="button"
                      onClick={() => registraPagamento(preventivo)}
                      className="btn-primary px-4 py-3"
                    >
                      Registra pagamento
                    </button>
                    <button
                      type="button"
                      onClick={() => segnaSaldato(preventivo)}
                      className="btn-secondary px-4 py-3"
                    >
                      Segna saldato
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-3">
                  <Link
                    to={routePreventivo(preventivo.id)}
                    className="inline-flex items-center gap-2 text-sm font-bold text-yellow-200"
                  >
                    <FileText size={16} />
                    Apri preventivo
                  </Link>
                  {cantiere?.id ? (
                    <Link
                      to={routeCantierePagamenti(cantiere.id)}
                      className="inline-flex items-center gap-2 text-sm font-bold text-slate-300"
                    >
                      <HardHat size={16} />
                      Vai al cantiere
                    </Link>
                  ) : null}
                </div>
              </div>
            );
          })}
        </section>
      </div>
    </PageWrapper>
  );
}
