import { useState } from "react";
import { ArrowLeft, ClipboardList, PenLine, Sparkles } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ROUTES } from "../app/routes";
import { leggiClienti } from "../repositories/clientiRepository";

const PREF_KEY = "preventivai_modalita_preventivo";

export default function ScelgaModalitaPreventivo() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const clienteId = searchParams.get("clienteId");
  const clienti = leggiClienti();
  const cliente = clienteId
    ? clienti.find((c) => String(c.id) === clienteId)
    : null;

  const [ultimaScelta, setUltimaScelta] = useState(
    () => localStorage.getItem(PREF_KEY) || null
  );

  function scegli(modalita) {
    localStorage.setItem(PREF_KEY, modalita);
    setUltimaScelta(modalita);

    const params = clienteId ? `?clienteId=${clienteId}` : "";

    if (modalita === "intelligente") {
      navigate(`${ROUTES.preventivoIntelligente}${params}`);
    } else {
      navigate(`${ROUTES.preventivoManuale}${params}`);
    }
  }

  const wizardLink = clienteId
    ? `${ROUTES.preventiviNuovo}?clienteId=${clienteId}`
    : ROUTES.preventiviNuovo;

  const backTo = clienteId ? `/cliente/${clienteId}` : ROUTES.preventiviNuovo;

  return (
    <div className="pro-page text-white">
      <Link to={backTo} className="ds-back-link mb-6">
        <ArrowLeft size={18} />
        {cliente ? cliente.nome : "Nuovo preventivo"}
      </Link>

      {cliente ? (
        <div className="pro-panel-strong p-5 mb-6">
          <p className="section-label">Opzioni avanzate</p>
          <h1 className="text-2xl font-black mt-1">{cliente.nome}</h1>
          {cliente.indirizzo ? (
            <p className="text-slate-400 text-sm mt-1">{cliente.indirizzo}</p>
          ) : null}
          <p className="ds-text-secondary mt-3">
            Flussi alternativi al percorso consigliato Nuovo preventivo.
          </p>
        </div>
      ) : (
        <div className="mb-6">
          <p className="section-label">Opzioni avanzate</p>
          <h1 className="text-2xl font-black mt-1">
            Altri modi per creare un preventivo
          </h1>
          <p className="ds-text-secondary mt-2">
            Il percorso consigliato è Nuovo preventivo: cliente, listino e
            riepilogo in un unico flusso.
          </p>
        </div>
      )}

      <Link
        to={wizardLink}
        className="btn-primary w-full min-h-[44px] flex items-center justify-center gap-2 mb-6"
        data-testid="scelta-modalita-wizard"
      >
        <ClipboardList size={18} aria-hidden="true" />
        Nuovo preventivo
      </Link>

      <p className="text-slate-400 mb-4 text-sm">
        Oppure usa un flusso alternativo.
        {ultimaScelta ? (
          <span className="ml-1 text-yellow-300">
            Ultima volta:{" "}
            {ultimaScelta === "intelligente"
              ? "Preventivo Intelligente"
              : "Preventivo Manuale"}
            .
          </span>
        ) : null}
      </p>

      <div className="space-y-4">
        <button
          type="button"
          onClick={() => scegli("intelligente")}
          className="w-full pro-panel p-5 text-left hover:border-yellow-300/40 transition active:scale-[0.98]"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-[14px] bg-yellow-400 text-slate-950 flex items-center justify-center shrink-0">
              <Sparkles size={22} />
            </div>
            <div>
              <h2 className="text-lg font-black flex items-center gap-2">
                Preventivo Intelligente
                {ultimaScelta === "intelligente" ? (
                  <span className="text-xs font-normal text-yellow-300 bg-yellow-400/10 px-2 py-0.5 rounded-full">
                    Ultima scelta
                  </span>
                ) : null}
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                PreventivAI ti guida nella compilazione con suggerimenti e listino
                integrato.
              </p>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => scegli("manuale")}
          className="w-full pro-panel p-5 text-left hover:border-yellow-300/40 transition active:scale-[0.98]"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-[14px] bg-slate-700 flex items-center justify-center shrink-0">
              <PenLine size={22} className="text-slate-200" />
            </div>
            <div>
              <h2 className="text-lg font-black flex items-center gap-2">
                Preventivo Manuale
                {ultimaScelta === "manuale" ? (
                  <span className="text-xs font-normal text-yellow-300 bg-yellow-400/10 px-2 py-0.5 rounded-full">
                    Ultima scelta
                  </span>
                ) : null}
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                Aggiungi righe liberamente. Veloce, senza assistente.
              </p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
