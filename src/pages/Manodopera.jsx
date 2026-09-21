import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, HardHat, Users } from "lucide-react";

import PageWrapper from "../components/PageWrapper";
import PageBackLink from "../components/PageBackLink";
import { ROUTES, routeCantiere } from "../app/routes";
import { useDatiLocaliSincronizzati } from "../hooks/useDatiLocaliSincronizzati";
import { leggiCantieri } from "../repositories/cantieriRepository";
import { leggiOperaiTutti } from "../repositories/operaiRepository";
import { costruisciRiepilogoManodopera } from "../features/manodopera/riepilogoManodoperaService";
import {
  etichettaIntervalloSettimana,
  fineSettimana,
  inizioSettimana,
  spostaSettimana,
} from "../features/manodopera/settimanaUtils";

function formatEuro(n) {
  return Number(n || 0).toLocaleString("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });
}

export default function Manodopera() {
  const [cantieri] = useDatiLocaliSincronizzati(leggiCantieri);
  const [operai] = useDatiLocaliSincronizzati(leggiOperaiTutti);
  const [lunedi, setLunedi] = useState(() => inizioSettimana(new Date()));
  const [filtroOperaioId, setFiltroOperaioId] = useState("");
  const [filtroCantiereId, setFiltroCantiereId] = useState("");

  const domenica = useMemo(() => fineSettimana(lunedi), [lunedi]);
  const etichetta = useMemo(
    () => etichettaIntervalloSettimana(lunedi, domenica),
    [lunedi, domenica]
  );

  const riepilogo = useMemo(
    () =>
      costruisciRiepilogoManodopera(cantieri || [], operai || [], {
        da: lunedi,
        a: domenica,
        operaioId: filtroOperaioId || undefined,
        cantiereId: filtroCantiereId || undefined,
      }),
    [cantieri, operai, lunedi, domenica, filtroOperaioId, filtroCantiereId]
  );

  const t = riepilogo.totali;

  return (
    <PageWrapper>
      <div className="pro-page text-white" data-testid="manodopera-page">
        <PageBackLink />

        <div className="mb-6">
          <p className="section-label">Controllo</p>
          <h1 className="ds-page-title mt-1">Manodopera</h1>
          <p className="ds-text-secondary mt-2">
            Riepilogo settimanale senza aprire ogni cantiere.
          </p>
        </div>

        <div
          className="pro-panel p-4 mb-5 flex items-center gap-2"
          data-testid="manodopera-settimana-nav"
        >
          <button
            type="button"
            className="btn-secondary min-h-[48px] min-w-[48px] inline-flex items-center justify-center"
            aria-label="Settimana precedente"
            data-testid="manodopera-settimana-prev"
            onClick={() => setLunedi((d) => spostaSettimana(d, -1))}
          >
            <ChevronLeft size={22} />
          </button>
          <div className="flex-1 text-center min-w-0">
            <p className="ds-text-secondary text-xs uppercase tracking-wide">
              Settimana
            </p>
            <p className="ds-text-primary font-medium truncate" data-testid="manodopera-settimana-label">
              {etichetta}
            </p>
          </div>
          <button
            type="button"
            className="btn-secondary min-h-[48px] min-w-[48px] inline-flex items-center justify-center"
            aria-label="Settimana successiva"
            data-testid="manodopera-settimana-next"
            onClick={() => setLunedi((d) => spostaSettimana(d, 1))}
          >
            <ChevronRight size={22} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <label className="block">
            <span className="ds-text-secondary text-xs">Operaio</span>
            <select
              className="input-pro mt-1 min-h-[48px] w-full text-sm"
              value={filtroOperaioId}
              data-testid="manodopera-filtro-operaio"
              onChange={(e) => setFiltroOperaioId(e.target.value)}
            >
              <option value="">Tutti</option>
              {(operai || []).map((o) => (
                <option key={o.id} value={o.id}>
                  {o.nome} {o.cognome}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="ds-text-secondary text-xs">Cantiere</span>
            <select
              className="input-pro mt-1 min-h-[48px] w-full text-sm"
              value={filtroCantiereId}
              data-testid="manodopera-filtro-cantiere"
              onChange={(e) => setFiltroCantiereId(e.target.value)}
            >
              <option value="">Tutti</option>
              {(cantieri || []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome || c.titolo || c.id}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div
          className="pro-panel-strong p-5 mb-6 space-y-3"
          data-testid="manodopera-totali"
        >
          <div className="flex justify-between gap-3">
            <span className="ds-text-secondary">Operai</span>
            <span className="ds-text-primary">{t.operai}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="ds-text-secondary">Cantieri</span>
            <span className="ds-text-primary">{t.cantieri}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="ds-text-secondary">Giornate</span>
            <span className="ds-text-primary">{t.giornate}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="ds-text-secondary">Ore</span>
            <span className="ds-text-primary">{t.ore}</span>
          </div>
          <div className="flex justify-between gap-3 pt-2 border-t border-white/10">
            <span className="ds-text-secondary">Costo manodopera</span>
            <span className="ds-text-primary font-semibold">
              {formatEuro(t.costo)}
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-emerald-300 text-sm">Pagato</span>
            <span className="text-emerald-300 font-medium">
              {formatEuro(t.pagato)}
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-amber-200 text-sm">Da pagare</span>
            <span className="text-amber-200 font-medium">
              {formatEuro(t.daPagare)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between mb-3">
          <h2 className="ds-card-title flex items-center gap-2">
            <Users size={18} className="text-yellow-300" />
            Per operaio
          </h2>
          <Link
            to={ROUTES.operai}
            className="text-sm text-yellow-300 font-medium min-h-[44px] inline-flex items-center"
          >
            Operai
          </Link>
        </div>

        {riepilogo.perOperaio.length === 0 ? (
          <p className="ds-text-secondary text-sm mb-6">
            Nessuna giornata in questa settimana.
          </p>
        ) : (
          <ul className="space-y-3 list-none p-0 m-0 mb-8 ds-card-grid" data-testid="manodopera-per-operaio">
            {riepilogo.perOperaio.map((riga) => (
              <li key={riga.operaioId} className="pro-panel p-4">
                <p className="ds-text-primary font-medium">{riga.nome}</p>
                <p className="ds-text-secondary text-sm mt-1">
                  {riga.giornate} giornate · {riga.ore}h · {formatEuro(riga.costo)}
                </p>
                <p className="text-sm mt-2">
                  <span className="text-emerald-300">
                    Pagato {formatEuro(riga.pagato)}
                  </span>
                  {" · "}
                  <span className="text-amber-200">
                    Da pagare {formatEuro(riga.daPagare)}
                  </span>
                </p>
              </li>
            ))}
          </ul>
        )}

        <h2 className="ds-card-title flex items-center gap-2 mb-3">
          <HardHat size={18} className="text-yellow-300" />
          Per cantiere
        </h2>

        {riepilogo.perCantiere.length === 0 ? (
          <p className="ds-text-secondary text-sm">Nessun cantiere nel periodo.</p>
        ) : (
          <ul className="space-y-3 list-none p-0 m-0 ds-card-grid" data-testid="manodopera-per-cantiere">
            {riepilogo.perCantiere.map((riga) => (
              <li key={riga.cantiereId}>
                <Link
                  to={routeCantiere(riga.cantiereId)}
                  className="pro-panel p-4 block min-h-[64px]"
                >
                  <p className="ds-text-primary font-medium">{riga.nome}</p>
                  <p className="ds-text-secondary text-sm mt-1">
                    {riga.giornate} giornate · {formatEuro(riga.costo)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PageWrapper>
  );
}
