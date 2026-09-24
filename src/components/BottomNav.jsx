import {
  FileText,
  HardHat,
  Home,
  LayoutGrid,
  Plus,
} from "lucide-react";

import { Link, useLocation, useNavigate } from "react-router-dom";

import { ROUTES } from "../app/routes";
import { provaNavigazioneGuidata } from "../navigation/navigateBack";
import { useGlobalCreate } from "./globalCreate/useGlobalCreate";
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
    nome: "Lavori",
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
  const navigate = useNavigate();
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
                    className="ds-nav-fab"
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
                onClick={(event) => {
                  if (item.path === location.pathname) return;
                  event.preventDefault();
                  provaNavigazioneGuidata(navigate, item.path);
                }}
                className="flex flex-col items-center justify-center relative min-w-0 flex-1 max-w-[72px] py-0.5 min-h-[44px]"
                aria-current={attivo ? "page" : undefined}
                aria-label={item.nome}
                data-testid={`bottom-nav-${item.nome.toLowerCase()}`}
              >
                <div
                  className={`ds-nav-item-icon ${attivo ? "is-active" : ""}`}
                >
                  <Icon size={20} aria-hidden="true" />
                </div>

                <span
                  className={`ds-nav-item-label truncate ${
                    attivo ? "is-active" : ""
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
