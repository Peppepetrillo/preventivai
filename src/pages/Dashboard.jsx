import {
  FileText,
  Users,
  Archive,
  Settings,
  List,
  ArrowRight,
  CheckCircle,
  Clock3,
  Wallet,
} from "lucide-react";

import { Link } from "react-router-dom";

import {
  motion,
} from "framer-motion";

import PageWrapper from "../components/PageWrapper";

export default function Dashboard() {

  const datiAzienda =
    JSON.parse(
      localStorage.getItem(
        "datiAzienda"
      )
    ) || {};

  const preventivi =
    JSON.parse(
      localStorage.getItem(
        "archivioPreventivi"
      )
    ) || [];

  const clienti =
    JSON.parse(
      localStorage.getItem(
        "clienti"
      )
    ) || [];

  const totalePreventivi =
    preventivi.reduce(
      (acc, item) =>
        acc + Number(item.totale || 0),
      0
    );

  const accettati =
    preventivi.filter(
      (p) =>
        p.stato === "Accettato"
    ).length;

  const completati =
    preventivi.filter(
      (p) =>
        p.stato === "Completato"
    ).length;

  const cards = [

    {
      titolo: "Nuovo Preventivo",
      testo:
        "Crea preventivi professionali in pochi secondi.",
      link: "/preventivi",
      icon: FileText,
    },

    {
      titolo: "Clienti",
      testo:
        "Gestisci clienti e lavori salvati.",
      link: "/clienti",
      icon: Users,
    },

    {
      titolo: "Archivio",
      testo:
        "Consulta tutti i preventivi creati.",
      link: "/archivio",
      icon: Archive,
    },

    {
      titolo: "Listino",
      testo:
        "Modifica prezzi e lavorazioni.",
      link: "/listino",
      icon: List,
    },

    {
      titolo: "Impostazioni",
      testo:
        "Logo, dati azienda e PDF.",
      link: "/impostazioni",
      icon: Settings,
    },

  ];

  return (

    <PageWrapper>

      <motion.div
        initial={{
          opacity: 0,
          y: 20,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.4,
        }}
        className="min-h-screen px-5 pt-8 pb-32 text-white"
      >

        <div className="mb-10">

          <div className="flex items-center gap-4">

            {datiAzienda.logo ? (

              <img
                src={datiAzienda.logo}
                alt="Logo"
                className="w-16 h-16 rounded-2xl object-cover border border-slate-700 shadow-lg"
              />

            ) : (

              <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-2xl font-black shadow-xl">

                ⚡

              </div>

            )}

            <div>

              <h1 className="text-4xl font-black tracking-tight">

                {datiAzienda.nomeAzienda ||
                  "PreventivAI"}

              </h1>

              <p className="text-slate-400 mt-1">

                Gestionale smart per elettricisti

              </p>

            </div>

          </div>

        </div>

        <div className="grid grid-cols-2 gap-4 mb-10">

          {[

            {
              icon: Wallet,
              colore:
                "text-green-400",
              label: "Totale",
              value:
                `€${totalePreventivi}`,
            },

            {
              icon: Users,
              colore:
                "text-blue-400",
              label: "Clienti",
              value:
                clienti.length,
            },

            {
              icon: CheckCircle,
              colore:
                "text-emerald-400",
              label: "Accettati",
              value:
                accettati,
            },

            {
              icon: Clock3,
              colore:
                "text-orange-400",
              label: "Completati",
              value:
                completati,
            },

          ].map(
            (
              stat,
              index
            ) => {

              const Icon =
                stat.icon;

              return (

                <motion.div
                  key={stat.label}
                  initial={{
                    opacity: 0,
                    scale: 0.9,
                  }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                  }}
                  transition={{
                    delay:
                      index * 0.1,
                  }}
                  whileTap={{
                    scale: 0.97,
                  }}
                  className="bg-white/[0.03] border border-white/[0.08] backdrop-blur-2xl rounded-[28px] p-5 shadow-[0_10px_40px_rgba(0,0,0,0.35)]"
                >

                  <div className="flex items-center justify-between mb-4">

                    <Icon
                      size={24}
                      className={
                        stat.colore
                      }
                    />

                    <span className="text-slate-500 text-sm">

                      {stat.label}

                    </span>

                  </div>

                  <h2 className="text-3xl font-black">

                    {stat.value}

                  </h2>

                </motion.div>

              );

            }
          )}

        </div>

        <div className="grid gap-4">

          {cards.map(
            (
              card,
              index
            ) => {

              const Icon =
                card.icon;

              return (

                <motion.div
                  key={card.titolo}
                  initial={{
                    opacity: 0,
                    y: 20,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    delay:
                      index * 0.08,
                  }}
                  whileTap={{
                    scale: 0.98,
                  }}
                >

                  <Link
                    to={card.link}
                    className="bg-white/[0.03] border border-white/[0.08] backdrop-blur-2xl rounded-[28px] p-5 shadow-[0_10px_40px_rgba(0,0,0,0.35)]"
                  >

                    <div className="flex items-center justify-between">

                      <div className="flex items-center gap-4">

                        <div className="bg-white/10 p-4 rounded-2xl">

                          <Icon size={24} />

                        </div>

                        <div>

                          <h2 className="text-xl font-bold">

                            {card.titolo}

                          </h2>

                          <p className="text-slate-400 mt-1 text-sm">

                            {card.testo}

                          </p>

                        </div>

                      </div>

                      <ArrowRight
                        size={20}
                        className="text-slate-500"
                      />

                    </div>

                  </Link>

                </motion.div>

              );

            }
          )}

        </div>

      </motion.div>

    </PageWrapper>

  );

}