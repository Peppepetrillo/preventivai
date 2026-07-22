import { useMemo } from "react";
import {
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
      <div className="pro-page text-white pb-24">
        <section className="pro-panel-strong p-5 mb-6">
          <p className="section-label">Home operativa</p>
          <h1 className="text-3xl sm:text-4xl font-black mt-1">
            {messaggioOperativo}
          </h1>
          <p className="text-slate-400 mt-3">
            Parti dai lavori aperti, controlla i preventivi in attesa e scegli la prossima azione.
          </p>
        </section>

        <section className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl" aria-hidden="true">
              🧠
            </span>
            <h2 className="text-2xl font-black">Assistente</h2>
          </div>
          <AssistantPanel />
        </section>

        <section className="mb-6">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <HardHat size={23} className="text-yellow-300" />
              <h2 className="text-2xl font-black">Cantieri aperti</h2>
            </div>
            <span className="text-sm text-slate-400">{cantieriAperti.length}</span>
          </div>

          <div className="grid gap-3">
            {cantieriAperti.length === 0 && (
              <div className="pro-panel p-5 text-slate-400">
                Nessun cantiere aperto. Puoi crearne uno o trasformare un preventivo accettato in cantiere.
              </div>
            )}

            {cantieriAperti.map((cantiere) => (
              <div key={cantiere.id} className="pro-panel p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase text-yellow-200">
                      {cantiere.stato}
                    </p>
                    <h3 className="text-xl font-black mt-1 truncate">
                      {cantiere.cliente || cantiere.nome || "Cliente non indicato"}
                    </h3>
                    <p className="text-sm text-slate-400 mt-1 truncate">
                      {cantiere.nome}
                    </p>
                  </div>

                  <Link
                    to={routeCantiere(cantiere.id)}
                    className="btn-primary px-5 py-3 flex items-center justify-center gap-2"
                  >
                    <HardHat size={18} />
                    Apri
                  </Link>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-slate-400">Checklist</span>
                    <span className="font-black text-yellow-100">{cantiere.avanzamento}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-yellow-400"
                      style={{ width: `${cantiere.avanzamento}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-6">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <ClipboardList size={23} className="text-sky-300" />
              <h2 className="text-2xl font-black">Preventivi in attesa</h2>
            </div>
            <span className="text-sm text-slate-400">{preventiviInAttesa.length}</span>
          </div>

          <div className="grid gap-3">
            {preventiviInAttesa.length === 0 && (
              <div className="pro-panel p-5 text-slate-400">
                Nessun preventivo in attesa di risposta.
              </div>
            )}

            {preventiviInAttesa.map((preventivo) => (
              <div key={preventivo.id} className="pro-panel p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase text-sky-200">
                      {preventivo.numero || `PREV-${preventivo.id}`}
                    </p>
                    <h3 className="text-xl font-black mt-1 truncate">
                      {preventivo.cliente || "Cliente non indicato"}
                    </h3>
                    <p className="text-emerald-300 font-black mt-2">
                      {formatEuro(preventivo.totale)}
                    </p>
                  </div>

                  <Link
                    to={routePreventivo(preventivo.id)}
                    className="btn-secondary px-5 py-3 flex items-center justify-center gap-2"
                  >
                    <FileText size={18} />
                    Apri
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-3">
            <Plus size={23} className="text-yellow-300" />
            <h2 className="text-2xl font-black">Azioni rapide</h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {AZIONI_RAPIDE.map((azione) => {
              const Icon = azione.icon;

              return (
                <Link
                  key={azione.titolo}
                  to={azione.link}
                  className="pro-panel p-4 hover:border-yellow-300/45 transition"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-[14px] bg-yellow-400/12 text-yellow-200 flex items-center justify-center">
                      <Icon size={23} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black">{azione.titolo}</h3>
                      <p className="text-sm text-slate-400 mt-1">{azione.testo}</p>
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
