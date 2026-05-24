import {
  Home,
  FileText,
  Archive,
  Settings,
  List,
} from "lucide-react";

import {
  Link,
  useLocation,
} from "react-router-dom";

export default function BottomNav() {

  const location =
    useLocation();

  const menu = [

    {
      nome: "Home",
      path: "/",
      icon: Home,
    },

    {
      nome: "Preventivi",
      path: "/preventivi",
      icon: FileText,
    },

    {
      nome: "Archivio",
      path: "/archivio",
      icon: Archive,
    },

    {
      nome: "Listino",
      path: "/listino",
      icon: List,
    },

    {
      nome: "Impostazioni",
      path: "/impostazioni",
      icon: Settings,
    },

  ];

  return (

    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 w-[92%] max-w-xl z-50 safe-bottom">

      <div className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-[32px] px-3 py-3 shadow-[0_10px_40px_rgba(0,0,0,0.45)]">

        <div className="flex items-center justify-around">

          {menu.map((item) => {

            const Icon =
              item.icon;

            const attivo =
              location.pathname ===
              item.path;

            return (

              <Link
                key={item.nome}
                to={item.path}
                className="flex flex-col items-center justify-center relative"
              >

                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                    attivo
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105"
                      : "text-slate-400"
                  }`}
                >

                  <Icon size={22} />

                </div>

                <span className={`text-[11px] mt-1 transition-all duration-300 ${
                  attivo
                    ? "text-white"
                    : "text-slate-500"
                }`}>

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