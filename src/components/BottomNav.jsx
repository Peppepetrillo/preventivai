import {
  Home,
  FileText,
  HardHat,
  Settings,
  List,
  Users,
  Wallet,
} from "lucide-react";

import { Link, useLocation } from "react-router-dom";

import { ROUTES } from "../app/routes";
import { useWizardContext } from "../features/preventivi/wizard/useWizardContext";
import { isVoceAttiva } from "./bottomNavUtils";

const MENU_COMPLETO = [
  {
    nome: "Home",
    path: ROUTES.dashboard,
    icon: Home,
  },
  {
    // Lista ufficiale documenti; il wizard resta su /preventivi (azioni Dashboard).
    nome: "Preventivi",
    path: ROUTES.archivio,
    icon: FileText,
  },
  {
    nome: "Incassi",
    path: ROUTES.incassi,
    icon: Wallet,
  },
  {
    nome: "Cantieri",
    path: ROUTES.cantieri,
    icon: HardHat,
  },
  {
    nome: "Clienti",
    path: ROUTES.clienti,
    icon: Users,
  },
  {
    nome: "Listino",
    path: ROUTES.listino,
    icon: List,
  },
  {
    nome: "Altro",
    path: ROUTES.impostazioni,
    icon: Settings,
  },
];

const MENU_WIZARD = [
  {
    nome: "Home",
    path: ROUTES.dashboard,
    icon: Home,
  },
  {
    nome: "Nuovo",
    path: ROUTES.preventivi,
    icon: FileText,
  },
  {
    nome: "Clienti",
    path: ROUTES.clienti,
    icon: Users,
  },
  {
    nome: "Listino",
    path: ROUTES.listino,
    icon: List,
  },
];

export default function BottomNav() {
  const location = useLocation();
  const { attivo: wizardAttivo } = useWizardContext();
  const menu = wizardAttivo ? MENU_WIZARD : MENU_COMPLETO;
  const modalitaCompatta = wizardAttivo;

  return (
    <nav className="ds-bottom-nav" aria-label="Navigazione principale">
      <div className="ds-bottom-nav-inner">
        <div className="flex items-center justify-around gap-0.5">
          {menu.map((item) => {
            const Icon = item.icon;
            const attivo = isVoceAttiva(location, item);

            return (
              <Link
                key={item.nome}
                to={item.path}
                className="flex flex-col items-center justify-center relative min-w-0 flex-1 max-w-[72px] py-0.5 min-h-[44px]"
                aria-current={attivo ? "page" : undefined}
                aria-label={item.nome}
              >
                <div
                  className={`rounded-[16px] flex items-center justify-center transition-colors duration-200 ${
                    modalitaCompatta ? "w-11 h-11" : "w-10 h-10"
                  } ${
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
