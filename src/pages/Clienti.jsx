import {
  useMemo,
  useState,
} from "react";

import {
  Users,
  Plus,
  Phone,
  Mail,
} from "lucide-react";

import PageWrapper from "../components/PageWrapper";
import { routeCliente } from "../app/routes";
import { useDatiLocaliSincronizzati } from "../hooks/useDatiLocaliSincronizzati";
import { leggiClienti, salvaClienti as salvaClientiRepository } from "../repositories/clientiRepository";
import {
  limitaElencoVisibile,
  PAGINA_LISTA_DEFAULT,
} from "../utils/listPerformance";

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
    useDatiLocaliSincronizzati(leggiClienti);
  const [limite, setLimite] = useState(PAGINA_LISTA_DEFAULT);

  const clientiVisibili = useMemo(
    () => limitaElencoVisibile(clienti, limite),
    [clienti, limite]
  );
  const rimanenti = Math.max(0, clienti.length - clientiVisibili.length);

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

    salvaClientiRepository(nuoviClienti);

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

      <div className="pro-page text-white">

        <div className="pro-panel-strong mb-6 p-5">

          <p className="section-label">Rubrica lavori</p>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mt-1">
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
          className="pro-panel p-5 mb-8 space-y-5"
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
              className="input-pro"
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
              className="input-pro"
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
              className="input-pro"
            />

          </div>

          <button
            onClick={
              aggiungiCliente
            }
            className="w-full btn-primary p-5 text-lg flex items-center justify-center gap-2"
          >

            <Plus size={22} />

            Aggiungi Cliente

          </button>

        </motion.div>

        <div className="space-y-5">

          {clientiVisibili.map(
            (cliente) => (

              <div
                key={cliente.id}
                role="button"
                tabIndex={0}
                onClick={() =>
                  navigate(
                    routeCliente(cliente.id)
                  )
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    navigate(routeCliente(cliente.id));
                  }
                }}
                className="pro-panel p-5 hover:border-yellow-300/40 transition cursor-pointer"
              >

                <div className="flex items-start justify-between">

                  <div className="flex items-start gap-4">

                    <div className="bg-yellow-400 text-slate-950 w-14 h-14 rounded-[14px] flex items-center justify-center shadow-xl">

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

              </div>

            )
          )}

          {rimanenti > 0 ? (
            <button
              type="button"
              className="w-full btn-secondary p-4"
              onClick={() => setLimite((n) => n + PAGINA_LISTA_DEFAULT)}
            >
              Mostra altri ({rimanenti})
            </button>
          ) : null}

        </div>

      </div>

    </PageWrapper>

  );

}
