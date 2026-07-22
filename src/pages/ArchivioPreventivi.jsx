import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FileText } from "lucide-react";

import { routePreventivo } from "../app/routes";
import PageWrapper from "../components/PageWrapper";
import SearchInput from "../components/SearchInput";
import {
  classeColoreStatoPreventivo,
  filtraPreventiviPerCliente,
} from "../features/preventivi/archivioPreventiviUtils";
import { useArchivioPreventivi } from "../hooks/useArchivioPreventivi";
import { formatEuro } from "../utils/preventivi";
import {
  limitaElencoVisibile,
  PAGINA_LISTA_DEFAULT,
} from "../utils/listPerformance";

export default function ArchivioPreventivi() {
  const preventivi = useArchivioPreventivi();
  const [ricerca, setRicerca] = useState("");
  const [limite, setLimite] = useState(PAGINA_LISTA_DEFAULT);

  const preventiviFiltrati = useMemo(
    () => filtraPreventiviPerCliente(preventivi, ricerca),
    [preventivi, ricerca]
  );

  const preventiviVisibili = useMemo(
    () => limitaElencoVisibile(preventiviFiltrati, limite),
    [preventiviFiltrati, limite]
  );

  const rimanenti = Math.max(0, preventiviFiltrati.length - preventiviVisibili.length);

  return (
    <PageWrapper>
      <div className="pro-page text-white pb-24">
        <div className="mb-6 pro-panel-strong p-5">
          <p className="section-label">Documenti salvati</p>
          <h1 className="text-3xl sm:text-4xl font-black mt-1">
            Archivio Preventivi
          </h1>
          <p className="text-slate-400 mt-2">
            Cerca preventivi, controlla gli stati e riapri i lavori al volo.
          </p>
        </div>

        <SearchInput
          className="mb-6"
          label="Cerca cliente nell'archivio"
          placeholder="Cerca cliente..."
          value={ricerca}
          onChange={(event) => setRicerca(event.target.value)}
        />

        <div className="space-y-5">
          {preventiviFiltrati.length === 0 && (
            <div className="pro-panel p-8 text-center text-slate-400">
              Nessun preventivo trovato
            </div>
          )}

          {preventiviVisibili.map((preventivo) => (
            <Link
              key={preventivo.id}
              to={routePreventivo(preventivo.id)}
              className="block pro-panel p-5 hover:border-yellow-300/45 transition"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-3 flex-wrap">
                    <h2 className="text-2xl font-bold">
                      {preventivo.cliente || "Cliente"}
                    </h2>
                    <div
                      className={`px-3 py-1 rounded-full text-sm font-semibold text-white ${classeColoreStatoPreventivo(preventivo.stato)}`}
                    >
                      {preventivo.stato || "Bozza"}
                    </div>
                  </div>

                  <div className="mt-2 space-y-1">
                    <p className="text-slate-500 text-sm">
                      {preventivo.numero || "PREV-000"}
                    </p>
                    <p className="text-slate-400">{preventivo.data}</p>
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
