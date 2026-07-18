import { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle, FileText, Plus, Wallet } from "lucide-react";
import PageWrapper from "../components/PageWrapper";
import { routePreventivo } from "../app/routes";
import { leggiPreventivi, salvaPreventivi } from "../repositories/preventiviRepository";
import { formatEuro, normalizzaNumero } from "../utils/preventivi";
import { selezionaZeroAlFocus } from "../utils/inputNumerici";
import {
  calcolaDaIncassare,
  normalizzaPreventivoIncasso,
  registraIncasso,
  riepilogaIncassi,
  segnaPreventivoSaldato,
} from "../features/preventivi/incassiDomain";

export default function Incassi() {
  const [preventivi, setPreventivi] = useState(() =>
    leggiPreventivi().map(normalizzaPreventivoIncasso)
  );
  const [importi, setImporti] = useState({});
  const riepilogo = riepilogaIncassi(preventivi);

  function salvaListaPreventivi(nuoviPreventivi) {
    setPreventivi(nuoviPreventivi);
    salvaPreventivi(nuoviPreventivi);
  }

  function aggiornaImporto(preventivoId, valore) {
    setImporti({
      ...importi,
      [preventivoId]: valore,
    });
  }

  function registraPagamento(preventivo) {
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
      <div className="pro-page text-white pb-24">
        <section className="pro-panel-strong p-5 mb-6">
          <p className="section-label">Soldi da seguire</p>
          <h1 className="text-3xl sm:text-4xl font-black mt-1">Incassi</h1>
          <p className="text-slate-400 mt-2">
            Controlla chi deve pagare, quanto manca e quali lavori sono saldati.
          </p>
        </section>

        <section className="grid gap-3 sm:grid-cols-3 mb-6">
          <div className="pro-panel p-4">
            <Wallet size={22} className="text-yellow-300 mb-3" />
            <p className="text-sm text-slate-400">Da incassare</p>
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

        <section className="grid gap-3">
          {preventivi.length === 0 && (
            <div className="pro-panel p-6 text-center text-slate-400">
              Nessun preventivo salvato.
            </div>
          )}

          {preventivi.map((preventivo) => {
            const daIncassare = calcolaDaIncassare(preventivo);

            return (
              <div key={preventivo.id} className="pro-panel p-4">
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
                      <span>Incassato {formatEuro(preventivo.incassato)}</span>
                      <span>Manca {formatEuro(daIncassare)}</span>
                      <span className="font-bold text-yellow-100">{preventivo.statoIncasso}</span>
                    </div>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-[130px_auto_auto]">
                    <input
                      type="number"
                      min="0"
                      value={importi[preventivo.id] || ""}
                      onFocus={selezionaZeroAlFocus}
                      onChange={(event) => aggiornaImporto(preventivo.id, event.target.value)}
                      placeholder="Importo"
                      className="input-pro"
                    />
                    <button
                      onClick={() => registraPagamento(preventivo)}
                      className="btn-primary px-4 py-3"
                    >
                      Registra incasso
                    </button>
                    <button
                      onClick={() => segnaSaldato(preventivo)}
                      className="btn-secondary px-4 py-3"
                    >
                      Segna saldato
                    </button>
                  </div>
                </div>

                <Link
                  to={routePreventivo(preventivo.id)}
                  className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-yellow-200"
                >
                  <FileText size={16} />
                  Apri preventivo
                </Link>
              </div>
            );
          })}
        </section>
      </div>
    </PageWrapper>
  );
}
