import { useMemo } from "react";
import {
  Brain,
  ChevronRight,
  ClipboardList,
  FileText,
  HardHat,
  Plus,
  UserPlus,
} from "lucide-react";
import { Link } from "react-router-dom";
import PageWrapper from "../components/PageWrapper";
import AssistantPanel from "../components/assistant/AssistantPanel";
import { ROUTES, routeCantiere, routePreventivo } from "../app/routes";
import { useDatiLocaliSincronizzati } from "../hooks/useDatiLocaliSincronizzati";
import { leggiCantieri } from "../repositories/cantieriRepository";
import { leggiDatiAzienda } from "../repositories/impostazioniRepository";
import { leggiPreventivi } from "../repositories/preventiviRepository";
import { formatEuro } from "../utils/preventivi";
import {
  creaMessaggioOperativo,
  preparaCantieriOperativi,
  selezionaPreventiviInAttesa,
} from "../features/dashboard/dashboardSelectors";
import { classeBadgeStatoCantiere } from "../ui/designSystem";

const AZIONI_RAPIDE = [
  {
    titolo: "Nuovo Preventivo",
    testo: "Prepara subito una nuova offerta.",
    link: ROUTES.preventivi,
    icon: FileText,
  },
  {
    titolo: "Archivio Preventivi",
    testo: "Riapri documenti salvati e stati.",
    link: ROUTES.archivio,
    icon: ClipboardList,
  },
  {
    titolo: "Nuovo Cliente",
    testo: "Aggiungi contatto e riferimenti.",
    link: ROUTES.clienti,
    icon: UserPlus,
  },
  {
    titolo: "Nuovo Cantiere",
    testo: "Apri una scheda lavoro manuale.",
    link: ROUTES.cantieri,
    icon: HardHat,
  },
];

function ContatoreSezione({ valore, etichetta }) {
  return (
    <span className="ds-badge-count" aria-label={`${valore} ${etichetta}`}>
      {valore}
    </span>
  );
}

export default function Dashboard() {
  const [datiAzienda] = useDatiLocaliSincronizzati(leggiDatiAzienda);
  const [cantieri] = useDatiLocaliSincronizzati(leggiCantieri);
  const [preventivi] = useDatiLocaliSincronizzati(leggiPreventivi);
  const cantieriAperti = useMemo(
    () => preparaCantieriOperativi(cantieri),
    [cantieri]
  );
  const preventiviInAttesa = useMemo(
    () => selezionaPreventiviInAttesa(preventivi),
    [preventivi]
  );
  const nomeOperativo = datiAzienda.nomeDitta || "";
  const messaggioOperativo = creaMessaggioOperativo({
    nome: nomeOperativo,
    cantieriAperti: cantieriAperti.length,
    preventiviInAttesa: preventiviInAttesa.length,
  });

  return (
    <PageWrapper>
      <div className="pro-page text-white">
        <header className="pro-panel-strong px-4 py-4 mb-4">
          <p className="section-label">Home operativa</p>
          <h1 className="ds-page-title mt-1">{messaggioOperativo}</h1>
          <p className="ds-text-secondary mt-2 max-w-2xl">
            Lavori aperti, preventivi in attesa e prossima azione.
          </p>
        </header>

        <section className="mb-4" aria-labelledby="dashboard-assistente">
          <div className="flex items-center gap-3 mb-2">
            <Brain size={20} className="text-yellow-300 shrink-0" aria-hidden="true" />
            <h2 id="dashboard-assistente" className="ds-section-title">
              Assistente
            </h2>
          </div>
          <AssistantPanel />
        </section>

        <section className="mb-4" aria-labelledby="dashboard-cantieri">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-3 min-w-0">
              <HardHat size={20} className="text-yellow-300 shrink-0" aria-hidden="true" />
              <h2 id="dashboard-cantieri" className="ds-section-title truncate">
                Cantieri aperti
              </h2>
            </div>
            <ContatoreSezione
              valore={cantieriAperti.length}
              etichetta="cantieri aperti"
            />
          </div>

          <div className="grid gap-3">
            {cantieriAperti.length === 0 && (
              <div className="pro-panel px-4 py-4 ds-text-secondary">
                Nessun cantiere aperto. Puoi crearne uno o trasformare un preventivo accettato in cantiere.
              </div>
            )}

            {cantieriAperti.map((cantiere) => (
              <Link
                key={cantiere.id}
                to={routeCantiere(cantiere.id)}
                className="pro-panel ds-card-link p-4"
                aria-label={`Apri cantiere ${cantiere.cliente || cantiere.nome || ""}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className={classeBadgeStatoCantiere(cantiere.stato)}>
                      {cantiere.stato}
                    </span>
                    <h3 className="ds-card-title mt-2 truncate">
                      {cantiere.cliente || cantiere.nome || "Cliente non indicato"}
                    </h3>
                    <p className="ds-text-secondary mt-1 truncate">
                      {cantiere.nome}
                    </p>
                  </div>
                  <div
                    className="w-10 h-10 rounded-[16px] bg-yellow-400 text-slate-950 flex items-center justify-center shrink-0"
                    aria-hidden="true"
                  >
                    <ChevronRight size={20} strokeWidth={2.5} />
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex items-center justify-between text-[12px] mb-1">
                    <span className="text-slate-400">Checklist</span>
                    <span className="font-semibold text-yellow-100 tabular-nums">
                      {cantiere.avanzamento}%
                    </span>
                  </div>
                  <div
                    className="h-1.5 rounded-full bg-white/10 overflow-hidden"
                    role="progressbar"
                    aria-valuenow={cantiere.avanzamento}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Avanzamento checklist ${cantiere.avanzamento}%`}
                  >
                    <div
                      className="h-full bg-yellow-400"
                      style={{ width: `${cantiere.avanzamento}%` }}
                    />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="mb-4" aria-labelledby="dashboard-preventivi">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-3 min-w-0">
              <ClipboardList size={20} className="text-sky-300 shrink-0" aria-hidden="true" />
              <h2 id="dashboard-preventivi" className="ds-section-title truncate">
                Preventivi in attesa
              </h2>
            </div>
            <ContatoreSezione
              valore={preventiviInAttesa.length}
              etichetta="preventivi in attesa"
            />
          </div>

          <div className="grid gap-3">
            {preventiviInAttesa.length === 0 && (
              <div className="pro-panel px-4 py-4 ds-text-secondary">
                Nessun preventivo in attesa di risposta.
              </div>
            )}

            {preventiviInAttesa.map((preventivo) => (
              <Link
                key={preventivo.id}
                to={routePreventivo(preventivo.id)}
                className="pro-panel ds-card-link p-4"
                aria-label={`Apri preventivo ${preventivo.cliente || preventivo.numero || ""}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[12px] font-medium uppercase tracking-wide text-sky-200/90">
                      {preventivo.numero || `PREV-${preventivo.id}`}
                    </p>
                    <h3 className="ds-card-title mt-2 truncate">
                      {preventivo.cliente || "Cliente non indicato"}
                    </h3>
                    <p className="text-emerald-300 font-semibold mt-2 tabular-nums ds-text-primary">
                      {formatEuro(preventivo.totale)}
                    </p>
                  </div>
                  <div
                    className="w-10 h-10 rounded-[16px] bg-sky-400/15 text-sky-200 border border-sky-300/25 flex items-center justify-center shrink-0"
                    aria-hidden="true"
                  >
                    <ChevronRight size={20} strokeWidth={2.5} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section aria-labelledby="dashboard-azioni">
          <div className="flex items-center gap-3 mb-3">
            <Plus size={20} className="text-yellow-300 shrink-0" aria-hidden="true" />
            <h2 id="dashboard-azioni" className="ds-section-title">
              Azioni rapide
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {AZIONI_RAPIDE.map((azione) => {
              const Icon = azione.icon;

              return (
                <Link
                  key={azione.titolo}
                  to={azione.link}
                  className="pro-panel ds-card-link px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-[16px] bg-yellow-400/12 text-yellow-200 flex items-center justify-center shrink-0">
                      <Icon size={20} aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="ds-text-primary font-semibold truncate">
                        {azione.titolo}
                      </h3>
                      <p className="ds-text-secondary mt-1">{azione.testo}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </PageWrapper>
  );
}
