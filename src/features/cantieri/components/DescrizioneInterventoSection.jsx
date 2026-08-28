import { useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";

import { miglioraDescrizioneIntervento } from "../services/miglioraDescrizioneInterventoService";

/**
 * Sezione descrizione intervento + flusso conferma bozza IA (UX-6.5).
 */
export default function DescrizioneInterventoSection({
  descrizione = "",
  onSalva,
}) {
  const [locale, setLocale] = useState(descrizione);
  const [bozza, setBozza] = useState("");
  const [errore, setErrore] = useState("");
  const [inCorso, setInCorso] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    setLocale(descrizione);
  }, [descrizione]);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  function salvaLocale(valore, { immediato = false } = {}) {
    setLocale(valore);
    if (timer.current) clearTimeout(timer.current);
    if (immediato) {
      onSalva?.(valore);
      return;
    }
    timer.current = setTimeout(() => onSalva?.(valore), 350);
  }

  async function richiediMiglioramento() {
    setErrore("");
    setInCorso(true);
    try {
      const esito = await miglioraDescrizioneIntervento(locale);
      if (!esito.ok) {
        setErrore(esito.errore || "Operazione non riuscita.");
        setBozza("");
        return;
      }
      setBozza(esito.bozza || "");
    } finally {
      setInCorso(false);
    }
  }

  function usaBozza() {
    if (!bozza.trim()) return;
    salvaLocale(bozza.trim(), { immediato: true });
    setBozza("");
    setErrore("");
  }

  function annullaBozza() {
    setBozza("");
    setErrore("");
  }

  return (
    <section
      className="pro-panel p-5 mb-5"
      aria-labelledby="descrizione-intervento-title"
      data-testid="descrizione-intervento-section"
    >
      <h2 id="descrizione-intervento-title" className="text-xl font-black mb-1">
        Descrizione intervento
      </h2>
      <p className="ds-text-secondary text-sm mb-3">
        Scrivi cosa hai fatto. Puoi migliorare il testo con l&apos;IA e
        confermare prima di usarlo.
      </p>

      <label className="block">
        <span className="sr-only">Descrizione intervento</span>
        <textarea
          value={locale}
          onChange={(e) => salvaLocale(e.target.value)}
          rows={5}
          placeholder="Descrivi brevemente cosa hai fatto…"
          className="input-pro resize-none text-base leading-relaxed min-h-[120px] w-full"
          data-testid="descrizione-intervento-input"
        />
      </label>

      <button
        type="button"
        onClick={richiediMiglioramento}
        disabled={inCorso || !String(locale || "").trim()}
        className="mt-3 w-full btn-secondary min-h-[48px] flex items-center justify-center gap-2 font-bold"
        data-testid="migliora-descrizione-ia"
      >
        <Sparkles size={18} aria-hidden="true" />
        {inCorso ? "Elaborazione…" : "Migliora con IA"}
      </button>

      {errore ? (
        <p
          className="mt-3 text-sm text-amber-100/90"
          role="alert"
          data-testid="migliora-descrizione-errore"
        >
          {errore}
        </p>
      ) : null}

      {bozza ? (
        <div
          className="mt-4 rounded-[16px] border border-yellow-400/25 bg-yellow-400/10 p-4 space-y-3"
          data-testid="migliora-descrizione-bozza"
        >
          <p className="text-xs font-bold uppercase tracking-wide text-yellow-100/80">
            Bozza proposta
          </p>
          <p className="ds-text-primary text-base leading-relaxed whitespace-pre-wrap">
            {bozza}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={usaBozza}
              className="btn-primary min-h-[48px] font-bold"
              data-testid="migliora-descrizione-usa"
            >
              Usa questa
            </button>
            <button
              type="button"
              onClick={annullaBozza}
              className="btn-secondary min-h-[48px] font-bold"
              data-testid="migliora-descrizione-annulla"
            >
              Annulla
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
