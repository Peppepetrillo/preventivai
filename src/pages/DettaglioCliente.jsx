import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FileText, Save, Trash2, Wallet } from "lucide-react";
import { ROUTES, routePreventivo } from "../app/routes";
import { leggiClienti, salvaClienti } from "../repositories/clientiRepository";
import { leggiPreventivi, salvaPreventivi } from "../repositories/preventiviRepository";
import { formatEuro, normalizzaNumero } from "../utils/preventivi";

export default function DettaglioCliente() {

  const { id } =
    useParams();
  const navigate =
    useNavigate();

  const clienti =
    leggiClienti();

  const cliente =
    clienti.find(
      (c) =>
        String(c.id) === id
    );

  const archivio =
    leggiPreventivi();

  const [nome, setNome] =
    useState(cliente?.nome || "");
  const [telefono, setTelefono] =
    useState(cliente?.telefono || "");
  const [email, setEmail] =
    useState(cliente?.email || "");
  const [messaggio, setMessaggio] =
    useState("");

  const preventiviCliente =
    archivio.filter(
      (p) =>
        p.cliente ===
        cliente?.nome
    );

  const totaleLavori =
    preventiviCliente.reduce(
      (acc, item) =>
        acc + normalizzaNumero(item.totale),
      0
    );

  if (!cliente) {

    return (

      <div className="min-h-screen flex items-center justify-center text-white">

        Cliente non trovato

      </div>

    );

  }

  function salvaCliente() {
    const nomePulito = nome.trim();

    if (!nomePulito) {
      setMessaggio("Inserisci il nome del cliente.");
      return;
    }

    const clientiAggiornati =
      clienti.map((item) =>
        String(item.id) === id
          ? {
              ...item,
              nome: nomePulito,
              telefono: telefono.trim(),
              email: email.trim(),
            }
          : item
      );

    const archivioAggiornato =
      archivio.map((preventivo) =>
        preventivo.cliente === cliente.nome
          ? {
              ...preventivo,
              cliente: nomePulito,
            }
          : preventivo
      );

    salvaClienti(clientiAggiornati);
    salvaPreventivi(archivioAggiornato);
    setMessaggio("Cliente aggiornato sul dispositivo.");
  }

  function eliminaCliente() {
    const conferma = window.confirm(
      `Eliminare il cliente ${cliente.nome}? I preventivi già creati resteranno nell'archivio.`
    );

    if (!conferma) return;

    const clientiAggiornati =
      clienti.filter((item) => String(item.id) !== id);

    salvaClienti(clientiAggiornati);
    navigate(ROUTES.clienti);
  }

  return (

    <div className="pro-page text-white">

      <Link
        to={ROUTES.clienti}
        className="text-slate-400 flex items-center gap-2 mb-5"
      >
        <ArrowLeft size={18} />
        Clienti
      </Link>

      <div className="pro-panel-strong p-5 mb-6">

        <p className="section-label">

          Scheda cliente

        </p>

        <h1 className="text-3xl sm:text-4xl font-black mt-1">

          {cliente.nome}

        </h1>

        <p className="text-slate-400 mt-2">

          Contatti, preventivi collegati e totale lavori.

        </p>

      </div>

      {messaggio && (
        <div className="pro-panel p-4 mb-5 text-yellow-100 border-yellow-300/30">
          {messaggio}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_320px] mb-6">

        <div className="pro-panel p-5">

          <h2 className="text-xl font-black mb-4">

            Informazioni

          </h2>

          <div className="space-y-4">

            <label className="block">
              <span className="text-sm text-slate-400">Nome cliente</span>
              <input
                value={nome}
                onChange={(event) => setNome(event.target.value)}
                className="mt-2 input-pro"
              />
            </label>

            <label className="block">
              <span className="text-sm text-slate-400">Telefono</span>
              <input
                value={telefono}
                onChange={(event) => setTelefono(event.target.value)}
                className="mt-2 input-pro"
              />
            </label>

            <label className="block">
              <span className="text-sm text-slate-400">Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 input-pro"
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                onClick={salvaCliente}
                className="btn-primary p-4 flex items-center justify-center gap-2"
              >
                <Save size={19} />
                Salva cliente
              </button>

              <button
                onClick={eliminaCliente}
                className="rounded-[14px] border border-red-400/25 bg-red-500/10 p-4 font-black text-red-100 flex items-center justify-center gap-2"
              >
                <Trash2 size={19} />
                Elimina
              </button>
            </div>

          </div>

        </div>

        <div className="pro-panel p-5">

          <Wallet size={24} className="text-emerald-300 mb-4" />

          <p className="text-slate-400">

            Totale lavori

          </p>

          <h2 className="text-4xl font-black mt-2">

            {formatEuro(totaleLavori)}

          </h2>

        </div>

      </div>

      <div>

        <h2 className="text-2xl font-black mb-5">

          Preventivi Cliente

        </h2>

        <div className="space-y-4">

          {preventiviCliente.length === 0 && (

            <div className="pro-panel p-6 text-slate-400 text-center">

              Nessun preventivo collegato a questo cliente.

            </div>

          )}

          {preventiviCliente.map(
            (preventivo) => (

              <Link
                key={preventivo.id}
                to={routePreventivo(preventivo.id)}
                className="pro-panel p-5 block hover:border-yellow-300/40 transition"
              >

                <div className="flex items-center justify-between">

                  <div className="flex items-center gap-3">

                    <div className="w-12 h-12 rounded-[14px] bg-yellow-400 text-slate-950 flex items-center justify-center">

                      <FileText size={21} />

                    </div>

                    <div>

                      <h3 className="text-xl font-black">

                        {preventivo.numero || "PREV-000"}

                      </h3>

                      <p className="text-slate-400 mt-1">

                        {preventivo.data}

                      </p>

                    </div>

                  </div>

                  <div className="text-right">

                    <p className="text-sm text-slate-400">

                      {preventivo.stato}

                    </p>

                    <h2 className="text-2xl font-black mt-1 text-emerald-300">

                      {formatEuro(preventivo.totale)}

                    </h2>

                  </div>

                </div>

              </Link>

            )
          )}

        </div>

      </div>

    </div>

  );

}
