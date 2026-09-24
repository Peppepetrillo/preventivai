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

/**
 * Hub Altro — sezioni ordinate (UX simplify).
 * Solo presentazione: stessi path e testId.
 */
const SEZIONI_HUB = [
  {
    id: "lavoro",
    titolo: "Lavoro",
    voci: [
      {
        titolo: "Agenda",
        sottotitolo: "Calendario lavori",
        path: ROUTES.agenda,
        icon: Calendar,
        testId: "altro-link-agenda",
      },
      {
        titolo: "Clienti",
        sottotitolo: "Rubrica",
        path: ROUTES.clienti,
        icon: Users,
        testId: "altro-link-clienti",
      },
      {
        titolo: "Economia",
        sottotitolo: "Entrate, uscite, da incassare",
        path: ROUTES.economia,
        icon: Wallet,
        testId: "altro-link-economia",
      },
      {
        titolo: "Storico lavori",
        sottotitolo: "Giornate e conti reali",
        path: ROUTES.storico,
        icon: History,
        testId: "altro-link-storico",
      },
    ],
  },
  {
    id: "strumenti",
    titolo: "Strumenti",
    voci: [
      {
        titolo: "Calcoli elettrici",
        sottotitolo: "Ohm, sezione, carico…",
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
        sottotitolo: "Materiali di magazzino",
        path: ROUTES.catalogoMateriali,
        icon: Package,
        testId: "altro-link-catalogo",
      },
      {
        titolo: "Liste materiali",
        sottotitolo: "Liste per il cantiere",
        path: ROUTES.distinteMateriali,
        icon: ClipboardList,
        testId: "altro-link-distinte",
      },
    ],
  },
  {
    id: "personale",
    titolo: "Personale",
    voci: [
      {
        titolo: "Operai",
        sottotitolo: "Persone della squadra",
        path: ROUTES.operai,
        icon: UserRound,
        testId: "altro-link-operai",
      },
      {
        titolo: "Manodopera",
        sottotitolo: "Giornate e ore",
        path: ROUTES.manodopera,
        icon: HardHat,
        testId: "altro-link-manodopera",
      },
    ],
  },
  {
    id: "sistema",
    titolo: "Sistema",
    voci: [
      {
        titolo: "Impostazioni",
        sottotitolo: "App, azienda e backup",
        path: ROUTES.impostazioni,
        icon: Settings,
        testId: "altro-link-impostazioni",
      },
      {
        titolo: "Cestino",
        sottotitolo: "Eliminati di recente",
        path: ROUTES.cestino,
        icon: Trash2,
        testId: "altro-link-cestino",
      },
    ],
  },
];

function VoceHub({ voce }) {
  const Icon = voce.icon;
  return (
    <Link
      to={voce.path}
      className="pro-panel p-5 flex items-center gap-4 min-h-[64px]"
      data-testid={voce.testId}
    >
      <span className="ds-icon-tile">
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
}

export default function Altro() {
  return (
    <PageWrapper>
      <div className="pro-page text-white">
        <div className="pro-panel-strong p-5 mb-6">
          <p className="section-label">Menu</p>
          <h1 className="ds-page-title mt-1">Altro</h1>
          <p className="ds-text-secondary mt-2">
            Agenda, soldi, materiali e impostazioni.
          </p>
        </div>

        <div className="space-y-6">
          {SEZIONI_HUB.map((sezione) => (
            <section
              key={sezione.id}
              aria-labelledby={`altro-sezione-${sezione.id}`}
              data-testid={`altro-sezione-${sezione.id}`}
            >
              <h2
                id={`altro-sezione-${sezione.id}`}
                className="section-label mb-3 px-0.5"
              >
                {sezione.titolo}
              </h2>
              <div className="flex flex-col gap-3 ds-hub-grid">
                {sezione.voci.map((voce) => (
                  <VoceHub key={voce.path} voce={voce} />
                ))}
              </div>
            </section>
          ))}
        </div>

        <ProssimamenteSection />
      </div>
    </PageWrapper>
  );
}
