import {
  Home,
  FileText,
  Archive,
  Settings,
  ClipboardCheck,
  Users,
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
      nome: "Clienti",
      path: "/clienti",
      icon: Users,
    },

    {
      nome: "Sopralluogo",
      path: "/sopralluogo",
      icon: ClipboardCheck,
    },

    {
      nome: "Altro",
      path: "/impostazioni",
      icon: Settings,
    },

  ];

  return (

    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[94%] max-w-2xl z-50 safe-bottom">

      <div className="bg-slate-950/[0.82] backdrop-blur-2xl border border-white/10 rounded-[20px] px-2 py-2 shadow-[0_18px_50px_rgba(0,0,0,0.42)]">

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
                  className={`w-12 h-12 rounded-[14px] flex items-center justify-center transition-all duration-300 ${
                    attivo
                      ? "bg-yellow-400 text-slate-950 shadow-lg shadow-yellow-500/25 scale-105"
                      : "text-slate-400"
                  }`}
                >

                  <Icon size={22} />

                </div>

                <span className={`text-[11px] mt-1 transition-all duration-300 ${
                  attivo
                    ? "text-yellow-200"
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
