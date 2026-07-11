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
  HardHat,
  Zap,
} from "lucide-react";

import { Link } from "react-router-dom";

import {
  motion,
} from "framer-motion";

import PageWrapper from "../components/PageWrapper";
import { ROUTES } from "../app/routes";
import { normalizzaNumero } from "../utils/preventivi";
import { leggiClienti } from "../repositories/clientiRepository";
import { leggiDatiAzienda } from "../repositories/impostazioniRepository";
import { leggiPreventivi } from "../repositories/preventiviRepository";

export default function Dashboard() {

  const datiAzienda =
    leggiDatiAzienda();

  const preventivi =
    leggiPreventivi();

  const clienti =
    leggiClienti();

  const totalePreventivi =
    preventivi.reduce(
      (acc, item) =>
        acc + normalizzaNumero(item.totale),
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
        "Componi materiale, manodopera e condizioni.",
      link: ROUTES.preventivi,
      icon: FileText,
    },

    {
      titolo: "Archivio",
      testo:
        "Consulta tutti i preventivi creati.",
      link: ROUTES.archivio,
      icon: Archive,
    },

    {
      titolo: "Clienti",
      testo:
        "Contatti, storico lavori e importi.",
      link: ROUTES.clienti,
      icon: Users,
    },

    {
      titolo: "Cantieri",
      testo:
        "Stato lavori, checklist e materiali.",
      link: ROUTES.cantieri,
      icon: HardHat,
    },

    {
      titolo: "Listino",
      testo:
        "Prezzi aggiornati per interventi e materiali.",
      link: ROUTES.listino,
      icon: List,
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
        className="pro-page text-white"
      >

        <div className="mb-7 pro-panel-strong p-5 overflow-hidden relative">

          <div className="absolute right-[-40px] top-[-50px] w-36 h-36 rounded-full bg-yellow-400/12 blur-2xl" />

          <div className="flex items-start justify-between gap-4 relative">

            {datiAzienda.logo ? (

              <img
                src={datiAzienda.logo}
                alt="Logo"
                className="w-16 h-16 rounded-[16px] object-cover border border-slate-700 shadow-lg"
              />

            ) : (

              <div className="w-16 h-16 rounded-[16px] bg-yellow-400 text-slate-950 flex items-center justify-center shadow-xl">

                <Zap size={31} />

              </div>

            )}

            <div>

              <p className="section-label">Gestionale elettrico</p>

              <h1 className="text-3xl sm:text-4xl font-black tracking-tight mt-1">

                {datiAzienda.nomeDitta ||
                  "PreventivAI"}

              </h1>

              <p className="text-slate-300 mt-1 max-w-xl">

                Preventivi, clienti, archivio e listino in un unico banco lavoro.

              </p>

            </div>

            <Link
              to={ROUTES.impostazioni}
              className="hidden sm:flex w-12 h-12 rounded-[14px] border border-white/10 bg-white/5 items-center justify-center text-slate-300"
              aria-label="Impostazioni"
            >
              <Settings size={20} />
            </Link>

          </div>

        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">

          {[

            {
              icon: Wallet,
              colore:
                "text-green-400",
              label: "Totale",
              value:
                `€ ${totalePreventivi.toLocaleString("it-IT")}`,
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
                  className="pro-panel p-4"
                >

                  <div className="flex items-center justify-between mb-3">

                    <Icon
                      size={24}
                      className={
                        stat.colore
                      }
                    />

                    <span className="text-slate-400 text-sm">

                      {stat.label}

                    </span>

                  </div>

                  <h2 className="text-2xl font-black">

                    {stat.value}

                  </h2>

                </motion.div>

              );

            }
          )}

        </div>

        <div className="grid gap-3 lg:grid-cols-2">

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
                    className="pro-panel p-4 block hover:border-yellow-300/45 transition"
                  >

                    <div className="flex items-center justify-between">

                      <div className="flex items-center gap-4">

                        <div className="bg-yellow-400/12 text-yellow-200 p-3 rounded-[14px]">

                          <Icon size={24} />

                        </div>

                        <div>

                          <h2 className="text-lg font-black">

                            {card.titolo}

                          </h2>

                          <p className="text-slate-400 mt-1 text-sm leading-snug">

                            {card.testo}

                          </p>

                        </div>

                      </div>

                      <ArrowRight
                        size={20}
                        className="text-yellow-300"
                      />

                    </div>

                  </Link>

                </motion.div>

              );

            }
          )}

        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="pro-panel p-4">
            <HardHat size={22} className="text-yellow-300 mb-3" />
            <p className="font-black">Pronto per cantiere</p>
            <p className="text-sm text-slate-400 mt-1">Schede compatte, leggibili da telefono.</p>
          </div>
          <div className="pro-panel p-4">
            <FileText size={22} className="text-sky-300 mb-3" />
            <p className="font-black">PDF ordinati</p>
            <p className="text-sm text-slate-400 mt-1">Dati azienda già collegati ai documenti.</p>
          </div>
          <div className="pro-panel p-4">
            <Wallet size={22} className="text-emerald-300 mb-3" />
            <p className="font-black">Numeri sotto mano</p>
            <p className="text-sm text-slate-400 mt-1">Valore lavori, stati e clienti sempre visibili.</p>
          </div>
        </div>

      </motion.div>

    </PageWrapper>

  );

}
