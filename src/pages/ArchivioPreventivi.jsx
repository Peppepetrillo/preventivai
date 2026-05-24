import {
  useEffect,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import {
  Search,
  FileText,
} from "lucide-react";

export default function ArchivioPreventivi() {

  const [preventivi, setPreventivi] =
    useState([]);

  const [ricerca, setRicerca] =
    useState("");

  useEffect(() => {

    const archivio =
      JSON.parse(
        localStorage.getItem(
          "archivioPreventivi"
        )
      ) || [];

    setPreventivi(
      archivio.reverse()
    );

  }, []);

  const preventiviFiltrati =
    preventivi.filter(
      (preventivo) =>

        preventivo.cliente
          ?.toLowerCase()
          .includes(
            ricerca.toLowerCase()
          )

    );

  function coloreStato(stato) {

    switch (stato) {

      case "Bozza":
        return "bg-yellow-500";

      case "Inviato":
        return "bg-blue-500";

      case "Accettato":
        return "bg-green-500";

      case "Completato":
        return "bg-slate-500";

      default:
        return "bg-slate-500";

    }

  }

  return (

    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white p-5 pb-32">

      <div className="mb-8">

        <h1 className="text-4xl font-black mb-3">
          Archivio Preventivi
        </h1>

        <p className="text-slate-400">
          Tutti i preventivi salvati
        </p>

      </div>

      <div className="bg-slate-900 border border-slate-700 rounded-3xl p-4 flex items-center gap-3 mb-8">

        <Search
          size={22}
          className="text-slate-400"
        />

        <input
          type="text"
          placeholder="Cerca cliente..."
          value={ricerca}
          onChange={(e) =>
            setRicerca(
              e.target.value
            )
          }
          className="bg-transparent outline-none w-full text-lg"
        />

      </div>

      <div className="space-y-5">

        {preventiviFiltrati.length === 0 && (

          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 text-center text-slate-400">

            Nessun preventivo trovato

          </div>

        )}

        {preventiviFiltrati.map(
          (preventivo) => (

            <Link
              key={preventivo.id}
              to={`/preventivo/${preventivo.id}`}
              className="block bg-slate-900 border border-slate-700 rounded-[32px] p-6 shadow-xl hover:scale-[1.02] transition-all duration-300"
            >

              <div className="flex items-start justify-between">

                <div>

                  <div className="flex items-center gap-3 mb-3">

                    <h2 className="text-2xl font-bold">

                      {preventivo.cliente}

                    </h2>

                    <div className={`px-3 py-1 rounded-full text-sm font-semibold text-white ${coloreStato(preventivo.stato)}`}>

                      {preventivo.stato || "Bozza"}

                    </div>

                  </div>

                  <div className="mt-2 space-y-1">

  <p className="text-slate-500 text-sm">

    {preventivo.numero || "PREV-000"}

  </p>

  <p className="text-slate-400">

    {preventivo.data}

  </p>

</div>

                  <p className="text-green-400 text-2xl font-bold mt-4">

                    € {preventivo.totale}

                  </p>

                </div>

                <div className="bg-blue-600 p-4 rounded-2xl shadow-lg">

                  <FileText size={26} />

                </div>

              </div>

            </Link>

          )
        )}

      </div>

    </div>

  );

}