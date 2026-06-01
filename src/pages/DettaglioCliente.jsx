import { Link, useParams } from "react-router-dom";
import { ArrowLeft, FileText, Mail, Phone, Wallet } from "lucide-react";
import { leggiStorage } from "../utils/storage";
import { formatEuro } from "../utils/preventivi";

export default function DettaglioCliente() {

  const { id } =
    useParams();

  const clienti =
    leggiStorage("clienti", []);

  const cliente =
    clienti.find(
      (c) =>
        String(c.id) === id
    );

  const archivio =
    leggiStorage("archivioPreventivi", []);

  const preventiviCliente =
    archivio.filter(
      (p) =>
        p.cliente ===
        cliente?.nome
    );

  const totaleLavori =
    preventiviCliente.reduce(
      (acc, item) =>
        acc + Number(item.totale || 0),
      0
    );

  if (!cliente) {

    return (

      <div className="min-h-screen flex items-center justify-center text-white">

        Cliente non trovato

      </div>

    );

  }

  return (

    <div className="pro-page text-white">

      <Link
        to="/clienti"
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

      <div className="grid gap-4 lg:grid-cols-[1fr_320px] mb-6">

        <div className="pro-panel p-5">

          <h2 className="text-xl font-black mb-4">

            Informazioni

          </h2>

          <div className="space-y-3">

            <div className="flex items-center gap-3 text-slate-300">

              <Phone size={18} className="text-yellow-300" />
              <span>{cliente.telefono || "-"}</span>

            </div>

            <div className="flex items-center gap-3 text-slate-300">

              <Mail size={18} className="text-yellow-300" />
              <span>{cliente.email || "-"}</span>

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
                to={`/preventivo/${preventivo.id}`}
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
