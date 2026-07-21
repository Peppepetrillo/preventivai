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

const MENU_COMPLETO = [
  {
    nome: "Home",
    path: ROUTES.dashboard,
    icon: Home,
  },
  {
    nome: "Preventivi",
    path: ROUTES.preventivi,
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

function isVoceAttiva(location, item) {
  return (
    location.pathname === item.path ||
    (item.path === ROUTES.incassi &&
      location.pathname.startsWith("/preventivo/")) ||
    (item.path === ROUTES.archivio &&
      location.pathname.startsWith("/preventivo/")) ||
    (item.path === ROUTES.clienti &&
      location.pathname.startsWith("/cliente/")) ||
    (item.path === ROUTES.preventivi && location.pathname === ROUTES.preventivi)
  );
}

export default function BottomNav() {
  const location = useLocation();
  const { attivo: wizardAttivo } = useWizardContext();
  const menu = wizardAttivo ? MENU_WIZARD : MENU_COMPLETO;
  const modalitaCompatta = wizardAttivo;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[94%] max-w-2xl z-50 safe-bottom">
      <div
        className={`bg-slate-950/[0.82] backdrop-blur-2xl border border-white/10 rounded-[20px] shadow-[0_18px_50px_rgba(0,0,0,0.42)] ${
          modalitaCompatta ? "px-3 py-2" : "px-2 py-2"
        }`}
      >
        <div className="flex items-center justify-around">
          {menu.map((item) => {
            const Icon = item.icon;
            const attivo = isVoceAttiva(location, item);

            return (
              <Link
                key={item.nome}
                to={item.path}
                className="flex flex-col items-center justify-center relative min-w-[56px]"
                aria-current={attivo ? "page" : undefined}
              >
                <div
                  className={`rounded-[14px] flex items-center justify-center transition-all duration-300 ${
                    modalitaCompatta ? "w-11 h-11" : "w-12 h-12"
                  } ${
                    attivo
                      ? "bg-yellow-400 text-slate-950 shadow-lg shadow-yellow-500/25 scale-105"
                      : "text-slate-400"
                  }`}
                >
                  <Icon size={modalitaCompatta ? 20 : 22} />
                </div>

                <span
                  className={`mt-1 transition-all duration-300 ${
                    modalitaCompatta ? "text-[10px]" : "text-[11px]"
                  } ${attivo ? "text-yellow-200" : "text-slate-500"}`}
                >
                  {item.nome}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
