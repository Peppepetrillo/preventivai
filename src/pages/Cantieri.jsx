import { useMemo, useState } from "react";
import { HardHat } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { routeCantiere } from "../app/routes";
import PageWrapper from "../components/PageWrapper";
import NuovoCantiereForm from "../features/cantieri/components/NuovoCantiereForm";
import { calcolaAvanzamentoChecklist } from "../features/cantieri/cantieriDomain";
import { useCantieri } from "../features/cantieri/hooks/useCantieri";
import {
  limitaElencoVisibile,
  PAGINA_LISTA_DEFAULT,
} from "../utils/listPerformance";

/**
 * Lista ufficiale dei cantieri (+ creazione).
 * Il dettaglio operativo vive su /cantiere/:id (route canonica RC-1B).
 * Non usare location.state per selezionare un cantiere.
 */
export default function Cantieri() {
  const navigate = useNavigate();
  const {
    cantieri,
    nuovoCantiere,
    messaggio,
    aggiornaCampoNuovoCantiere,
    aggiungiCantiere,
  } = useCantieri();
  const [limite, setLimite] = useState(PAGINA_LISTA_DEFAULT);

  const cantieriVisibili = useMemo(
    () => limitaElencoVisibile(cantieri, limite),
    [cantieri, limite]
  );
  const rimanenti = Math.max(0, cantieri.length - cantieriVisibili.length);

  function gestisciCreaCantiere() {
    const creato = aggiungiCantiere();
    if (creato?.id) {
      navigate(routeCantiere(creato.id));
    }
  }

  return (
    <PageWrapper>
      <div className="pro-page text-white pb-24">
        <div className="pro-panel-strong p-5 mb-6">
          <p className="section-label">Operatività</p>
          <h1 className="text-3xl sm:text-4xl font-black mt-1">Cantieri</h1>
          <p className="text-slate-400 mt-2">
            Elenco cantieri. Apri un cantiere per checklist, materiali, foto e note.
          </p>
        </div>

        {messaggio ? (
          <div className="pro-panel p-4 mb-5 text-yellow-100 border-yellow-300/30">
            {messaggio}
          </div>
        ) : null}

        <NuovoCantiereForm
          cantiere={nuovoCantiere}
          onAggiornaCampo={aggiornaCampoNuovoCantiere}
          onCreaCantiere={gestisciCreaCantiere}
        />

        <div className="space-y-3 mt-6">
          {cantieri.length === 0 ? (
            <div className="pro-panel p-6 text-center text-slate-400">
              Nessun cantiere creato.
            </div>
          ) : null}

          {cantieriVisibili.map((cantiere) => {
            const progresso = calcolaAvanzamentoChecklist(
              cantiere.checklist || []
            );

            return (
              <Link
                key={cantiere.id}
                to={routeCantiere(cantiere.id)}
                className="block w-full pro-panel p-4 text-left transition hover:border-yellow-300/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-white/45 text-xs font-bold uppercase">
                      {cantiere.stato}
                    </p>
                    <h3 className="text-xl font-black mt-1 truncate">
                      {cantiere.nome}
                    </h3>
                    <p className="text-slate-400 mt-1 truncate">
                      {cantiere.cliente || "Cliente non indicato"}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-[14px] bg-yellow-400 text-slate-950 flex items-center justify-center shrink-0">
                    <HardHat size={22} />
                  </div>
                </div>

                <div className="mt-4 h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-yellow-400"
                    style={{ width: `${progresso}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Checklist {progresso}% · Agg. {cantiere.aggiornatoIl}
                </p>
              </Link>
            );
          })}

          {rimanenti > 0 ? (
            <button
              type="button"
              className="w-full btn-secondary p-4"
              onClick={() => setLimite((n) => n + PAGINA_LISTA_DEFAULT)}
            >
              Mostra altri ({rimanenti})
            </button>
          ) : null}
        </div>
      </div>
    </PageWrapper>
  );
}
