import {
  useState,
} from "react";

import {
  Users,
  Plus,
  Phone,
  Mail,
} from "lucide-react";

import PageWrapper from "../components/PageWrapper";
import { leggiStorage } from "../utils/storage";

import {
  motion,
} from "framer-motion";

import {
  useNavigate,
} from "react-router-dom";

export default function Clienti() {

  const navigate =
    useNavigate();

  const [clienti, setClienti] =
    useState(() =>
      leggiStorage("clienti", [])
    );

  const [nome, setNome] =
    useState("");

  const [telefono, setTelefono] =
    useState("");

  const [email, setEmail] =
    useState("");

  function salvaClienti(
    nuoviClienti
  ) {

    setClienti(
      nuoviClienti
    );

    localStorage.setItem(
      "clienti",
      JSON.stringify(
        nuoviClienti
      )
    );

  }

  function aggiungiCliente() {

    if (!nome) return;

    const nuovoCliente = {

      id: new Date().getTime(),

      nome,

      telefono,

      email,

    };

    salvaClienti([
      ...clienti,
      nuovoCliente,
    ]);

    setNome("");
    setTelefono("");
    setEmail("");

  }

  return (

    <PageWrapper>

      <div className="min-h-screen px-5 pt-8 pb-32 text-white">

        <div className="sticky top-0 z-40 backdrop-blur-2xl bg-black/20 border-b border-white/5 mb-8 pb-5 pt-2">

          <h1 className="text-4xl font-black tracking-tight">
            Clienti
          </h1>

          <p className="text-slate-400 mt-2">
            Gestisci clienti e contatti
          </p>

        </div>

        <motion.div
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="bg-white/[0.03] border border-white/[0.08] backdrop-blur-2xl rounded-[32px] p-5 shadow-[0_10px_40px_rgba(0,0,0,0.35)] mb-8 space-y-5"
        >

          <div>

            <p className="text-slate-400 text-sm mb-2">
              Nome Cliente
            </p>

            <input
              type="text"
              placeholder="Mario Rossi"
              value={nome}
              onChange={(e) =>
                setNome(
                  e.target.value
                )
              }
              className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 outline-none"
            />

          </div>

          <div>

            <p className="text-slate-400 text-sm mb-2">
              Telefono
            </p>

            <input
              type="text"
              placeholder="+39 333 1234567"
              value={telefono}
              onChange={(e) =>
                setTelefono(
                  e.target.value
                )
              }
              className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 outline-none"
            />

          </div>

          <div>

            <p className="text-slate-400 text-sm mb-2">
              Email
            </p>

            <input
              type="email"
              placeholder="cliente@email.com"
              value={email}
              onChange={(e) =>
                setEmail(
                  e.target.value
                )
              }
              className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 outline-none"
            />

          </div>

          <button
            onClick={
              aggiungiCliente
            }
            className="w-full bg-blue-600 rounded-[26px] p-5 text-lg font-bold shadow-2xl flex items-center justify-center gap-2"
          >

            <Plus size={22} />

            Aggiungi Cliente

          </button>

        </motion.div>

        <div className="space-y-5">

          {clienti.map(
            (cliente) => (

              <motion.div
                key={cliente.id}
                initial={{
                  opacity: 0,
                  y: 20,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                whileTap={{
                  scale: 0.98,
                }}
                onClick={() =>
                  navigate(
                    `/cliente/${cliente.id}`
                  )
                }
                className="bg-white/[0.03] border border-white/[0.08] backdrop-blur-2xl rounded-[30px] p-5 shadow-[0_10px_40px_rgba(0,0,0,0.35)]"
              >

                <div className="flex items-start justify-between">

                  <div className="flex items-start gap-4">

                    <div className="bg-blue-600 w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl">

                      <Users size={24} />

                    </div>

                    <div>

                      <h2 className="text-2xl font-bold">

                        {cliente.nome}

                      </h2>

                      {cliente.telefono && (

                        <div className="flex items-center gap-2 text-slate-400 mt-3">

                          <Phone size={16} />

                          <span>

                            {cliente.telefono}

                          </span>

                        </div>

                      )}

                      {cliente.email && (

                        <div className="flex items-center gap-2 text-slate-400 mt-2">

                          <Mail size={16} />

                          <span>

                            {cliente.email}

                          </span>

                        </div>

                      )}

                    </div>

                  </div>

                </div>

              </motion.div>

            )
          )}

        </div>

      </div>

    </PageWrapper>

  );

}
