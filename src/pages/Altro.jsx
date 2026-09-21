import {
  BookOpen,
  Calendar,
  ChevronRight,
  ClipboardList,
  HardHat,
  History,
  Package,
  Settings,
  ShoppingCart,
  Trash2,
  Users,
  UserRound,
  Wallet,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";

import PageWrapper from "../components/PageWrapper";
import { ROUTES } from "../app/routes";
import ProssimamenteSection from "../features/roadmap/ProssimamenteSection";

const VOCI_HUB = [
  {
    titolo: "Agenda",
    sottotitolo: "I tuoi giorni",
    path: ROUTES.agenda,
    icon: Calendar,
    testId: "altro-link-agenda",
  },
  {
    titolo: "Clienti",
    sottotitolo: "Rubrica clienti",
    path: ROUTES.clienti,
    icon: Users,
    testId: "altro-link-clienti",
  },
  {
    titolo: "Operai",
    sottotitolo: "Anagrafica e costi manodopera",
    path: ROUTES.operai,
    icon: UserRound,
    testId: "altro-link-operai",
  },
  {
    titolo: "Manodopera",
    sottotitolo: "Riepilogo settimanale giornate e pagamenti",
    path: ROUTES.manodopera,
    icon: HardHat,
    testId: "altro-link-manodopera",
  },
  {
    titolo: "Economia",
    sottotitolo: "Entrate, uscite e saldo",
    path: ROUTES.economia,
    icon: Wallet,
    testId: "altro-link-economia",
  },
  {
    titolo: "Storico lavori",
    sottotitolo: "Giornate, ore e conti reali",
    path: ROUTES.storico,
    icon: History,
    testId: "altro-link-storico",
  },
  {
    titolo: "Calcoli elettrici",
    sottotitolo: "Strumenti rapidi per il lavoro",
    path: ROUTES.calcoliElettrici,
    icon: Zap,
    testId: "altro-link-calcoli",
  },
  {
    titolo: "Da comprare",
    sottotitolo: "Materiali da acquistare",
    path: ROUTES.acquisti,
    icon: ShoppingCart,
    testId: "altro-link-acquisti",
  },
  {
    titolo: "Listino prezzi",
    sottotitolo: "Prezzi e lavorazioni",
    path: ROUTES.listino,
    icon: BookOpen,
    testId: "altro-link-listino",
  },
  {
    titolo: "Catalogo materiali",
    sottotitolo: "Materiali",
    path: ROUTES.catalogoMateriali,
    icon: Package,
    testId: "altro-link-catalogo",
  },
  {
    titolo: "Liste materiali",
    sottotitolo: "Liste da cantiere",
    path: ROUTES.distinteMateriali,
    icon: ClipboardList,
    testId: "altro-link-distinte",
  },
  {
    titolo: "Impostazioni",
    sottotitolo: "App, azienda e backup",
    path: ROUTES.impostazioni,
    icon: Settings,
    testId: "altro-link-impostazioni",
  },
  {
    titolo: "Cestino",
    sottotitolo: "Elementi eliminati di recente",
    path: ROUTES.cestino,
    icon: Trash2,
    testId: "altro-link-cestino",
  },
];

export default function Altro() {
  return (
    <PageWrapper>
      <div className="pro-page text-white">
        <div className="pro-panel-strong p-5 mb-6">
          <p className="section-label">Menu</p>
          <h1 className="ds-page-title mt-1">Altro</h1>
          <p className="ds-text-secondary mt-2">
            Agenda, economia, storico, calcoli, clienti, materiali e
            impostazioni dell&apos;app.
          </p>
        </div>

        <div className="flex flex-col gap-3 ds-hub-grid">
          {VOCI_HUB.map((voce) => {
            const Icon = voce.icon;
            return (
              <Link
                key={voce.path}
                to={voce.path}
                className="pro-panel p-5 flex items-center gap-4 min-h-[64px]"
                data-testid={voce.testId}
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-[16px] bg-yellow-400/15 text-yellow-300 shrink-0">
                  <Icon size={22} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="ds-card-title">{voce.titolo}</p>
                  <p className="ds-text-secondary text-sm mt-1">{voce.sottotitolo}</p>
                </div>
                <ChevronRight
                  size={20}
                  className="text-slate-500 shrink-0"
                  aria-hidden="true"
                />
              </Link>
            );
          })}
        </div>

        <ProssimamenteSection />
      </div>
    </PageWrapper>
  );
}
