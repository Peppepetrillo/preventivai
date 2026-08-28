import {
  FileText,
  HardHat,
  Home,
  LayoutGrid,
  Plus,
} from "lucide-react";

import { Link, useLocation } from "react-router-dom";

import { ROUTES } from "../app/routes";
import { useGlobalCreate } from "./globalCreate/GlobalCreateContext";
import {
  isVoceAttiva,
  shouldShowBottomNav,
  shouldShowGlobalCreateFab,
} from "./bottomNavUtils";

const MENU_COMPLETO = [
  {
    nome: "Oggi",
    path: ROUTES.dashboard,
    icon: Home,
  },
  {
    nome: "Preventivi",
    path: ROUTES.preventivi,
    icon: FileText,
  },
  {
    tipo: "create",
  },
  {
    nome: "Cantieri",
    path: ROUTES.cantieri,
    icon: HardHat,
  },
  {
    nome: "Altro",
    path: ROUTES.altro,
    icon: LayoutGrid,
  },
];

export default function BottomNav() {
  const location = useLocation();
  const { menuOpen, openMenu } = useGlobalCreate();

  if (!shouldShowBottomNav(location)) {
    return null;
  }

  const mostraFabGlobale = shouldShowGlobalCreateFab(location);

  return (
    <nav className="ds-bottom-nav" aria-label="Navigazione principale">
      <div className="ds-bottom-nav-inner">
        <div className="flex items-end justify-around gap-0.5">
          {MENU_COMPLETO.map((item) => {
            if (item.tipo === "create") {
              if (!mostraFabGlobale) {
                return (
                  <div
                    key="create-spacer-agenda"
                    className="min-w-0 flex-1 max-w-[72px] min-h-[44px]"
                    aria-hidden="true"
                  />
                );
              }

              if (menuOpen) {
                return (
                  <div
                    key="create-spacer"
                    className="min-w-0 flex-1 max-w-[72px] min-h-[44px]"
                    aria-hidden="true"
                  />
                );
              }

              return (
                <div
                  key="create"
                  className="flex flex-col items-center justify-end relative min-w-0 flex-1 max-w-[72px] -mt-3"
                >
                  <button
                    type="button"
                    onClick={openMenu}
                    className="w-14 h-14 min-h-[44px] min-w-[44px] rounded-full bg-yellow-400 text-slate-950 shadow-[var(--shadow-soft)] flex items-center justify-center active:scale-95 transition-transform duration-200"
                    aria-label="Nuovo"
                    data-testid="global-create-fab"
                  >
                    <Plus size={26} strokeWidth={2.5} aria-hidden="true" />
                  </button>
                </div>
              );
            }

            const Icon = item.icon;
            const attivo = isVoceAttiva(location, item);

            return (
              <Link
                key={item.nome}
                to={item.path}
                className="flex flex-col items-center justify-center relative min-w-0 flex-1 max-w-[72px] py-0.5 min-h-[44px]"
                aria-current={attivo ? "page" : undefined}
                aria-label={item.nome}
                data-testid={`bottom-nav-${item.nome.toLowerCase()}`}
              >
                <div
                  className={`rounded-[16px] flex items-center justify-center transition-colors duration-200 w-10 h-10 ${
                    attivo
                      ? "bg-yellow-400 text-slate-950"
                      : "text-slate-400"
                  }`}
                >
                  <Icon size={20} aria-hidden="true" />
                </div>

                <span
                  className={`mt-1 truncate max-w-full px-0.5 text-[10px] leading-none transition-colors duration-200 ${
                    attivo ? "text-yellow-200 font-semibold" : "text-slate-500"
                  }`}
                >
                  {item.nome}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
