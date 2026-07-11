import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, FileText } from "lucide-react";
import { useArchivioPreventivi } from "../hooks/useArchivioPreventivi";
import { formatEuro } from "../utils/preventivi";

export default function ArchivioPreventivi() {

  const preventivi = useArchivioPreventivi();
  const [ricerca, setRicerca] = useState("");

  const preventiviFiltrati = preventivi.filter((preventivo) =>
    (preventivo.cliente || "")
      .toLowerCase()
      .includes(ricerca.toLowerCase())
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
    <div className="pro-page text-white">

      <div className="mb-6 pro-panel-strong p-5">
        <p className="section-label">Documenti salvati</p>
        <h1 className="text-3xl sm:text-4xl font-black mt-1">
          Archivio Preventivi
        </h1>

        <p className="text-slate-400 mt-2">
          Cerca preventivi, controlla gli stati e riapri i lavori al volo.
        </p>
      </div>

      <div className="pro-panel p-4 flex items-center gap-3 mb-6">
        <Search size={22} className="text-yellow-300" />

        <input
          type="text"
          placeholder="Cerca cliente..."
          value={ricerca}
          onChange={(e) => setRicerca(e.target.value)}
          className="bg-transparent outline-none w-full text-base"
        />
      </div>

      <div className="space-y-5">

        {preventiviFiltrati.length === 0 && (
          <div className="pro-panel p-8 text-center text-slate-400">
            Nessun preventivo trovato
          </div>
        )}

        {preventiviFiltrati.map((preventivo) => (

          <Link
            key={preventivo.id}
            to={`/preventivo/${preventivo.id}`}
            className="block pro-panel p-5 hover:border-yellow-300/45 transition"
          >

            <div className="flex items-start justify-between">

              <div>

                <div className="flex items-center gap-3 mb-3 flex-wrap">

                  <h2 className="text-2xl font-bold">
                    {preventivo.cliente || "Cliente"}
                  </h2>

                  <div
                    className={`px-3 py-1 rounded-full text-sm font-semibold text-white ${coloreStato(preventivo.stato)}`}
                  >
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

                <p className="text-emerald-300 text-2xl font-black mt-4">
                  {formatEuro(preventivo.totale)}
                </p>

              </div>

              <div className="bg-yellow-400 text-slate-950 p-4 rounded-[14px] shadow-lg shrink-0">
                <FileText size={26} />
              </div>

            </div>

          </Link>

        ))}

      </div>

    </div>
  );
}
