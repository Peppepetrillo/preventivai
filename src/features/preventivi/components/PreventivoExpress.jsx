import { useCallback, useId, useState } from "react";
import { Mic, MicOff, Sparkles } from "lucide-react";

import BottomSheet from "../../../components/BottomSheet";
import { leggiClienti } from "../../../repositories/clientiRepository";
import { leggiListino } from "../../../repositories/listinoRepository";
import { useRiconoscimentoVocale } from "../../../hooks/useRiconoscimentoVocale";
import { generaBozzaPreventivoAI } from "../assistentePreventivi";
import { CONDIZIONI_DEFAULT } from "../wizard/wizardConfig";
import { normalizzaNumero } from "../../../utils/preventivi";
import { registraUsoLavorazione, chiaveUsoDaLavorazione } from "../utils/lavorazioniUsage";

export default function PreventivoExpress({
  open,
  onClose,
  onApplica,
  clienteCorrente,
}) {
  const [testo, setTesto] = useState("");
  const [inElaborazione, setInElaborazione] = useState(false);
  const [errore, setErrore] = useState("");
  const testoId = useId();

  const aggiornaTestoDaVoce = useCallback((nuovoTesto) => {
    setTesto(nuovoTesto);
  }, []);

  const {
    supportato: voceSupportata,
    inAscolto,
    avvia,
    ferma,
  } = useRiconoscimentoVocale({
    onTesto: aggiornaTestoDaVoce,
  });

  function chiudi() {
    if (inAscolto) ferma();
    setErrore("");
    onClose();
  }

  async function creaPreventivo() {
    if (!testo.trim()) {
      setErrore("Scrivi o detta una richiesta prima di continuare.");
      return;
    }

    setInElaborazione(true);
    setErrore("");

    try {
      const bozza = await generaBozzaPreventivoAI({
        testo,
        clienti: leggiClienti(),
        listino: leggiListino(),
      });

      bozza.lavorazioni?.forEach((lavorazione) => {
        registraUsoLavorazione(
          chiaveUsoDaLavorazione(lavorazione),
          lavorazione.quantita || 1
        );
      });

      onApplica({
        lavorazioni: bozza.lavorazioni || [],
        condizioni: {
          sconto: normalizzaNumero(bozza.sconto),
          iva: normalizzaNumero(bozza.iva, CONDIZIONI_DEFAULT.iva),
          validita: normalizzaNumero(bozza.validita, CONDIZIONI_DEFAULT.validita),
          pagamento: bozza.pagamento || CONDIZIONI_DEFAULT.pagamento,
          acconto: normalizzaNumero(bozza.acconto),
          note: bozza.note || testo.trim(),
        },
        cliente: bozza.cliente || clienteCorrente,
        avvisi: bozza.avvisi || [],
        riepilogo: bozza.riepilogo,
      });

      setTesto("");
      onClose();
    } catch {
      setErrore("Assistente non disponibile. Riprova tra poco.");
    } finally {
      setInElaborazione(false);
    }
  }

  return (
    <BottomSheet
      open={open}
      onClose={chiudi}
      title="Preventivo Express"
      descrizione="Detta o scrivi: il preventivo viene creato e applicato subito."
      altezza="auto"
    >
      <div className="space-y-4">
        <div className="flex flex-col items-center gap-3 py-2">
          <button
            type="button"
            onClick={inAscolto ? ferma : avvia}
            disabled={!voceSupportata || inElaborazione}
            className={`w-16 h-16 rounded-full flex items-center justify-center ${
              inAscolto
                ? "bg-red-500/20 text-red-100"
                : "bg-yellow-400 text-slate-950 disabled:opacity-40"
            }`}
            aria-label={inAscolto ? "Ferma dettatura" : "Avvia dettatura"}
          >
            {inAscolto ? <MicOff size={26} /> : <Mic size={26} />}
          </button>
          <p className="text-sm text-slate-400 text-center">
            {voceSupportata
              ? inAscolto
                ? "Sto ascoltando..."
                : "Tocca il microfono e parla"
              : "Dettatura non supportata da questo browser."}
          </p>
        </div>

        <label htmlFor={testoId} className="block">
          <span className="text-sm text-slate-400">Richiesta</span>
          <textarea
            id={testoId}
            value={testo}
            onChange={(event) => {
              setTesto(event.target.value);
              setErrore("");
            }}
            rows={4}
            placeholder="Es: 4 punti luce, 6 prese, quadro elettrico, sconto 5%, acconto 200 euro."
            className="mt-2 input-pro resize-none"
            disabled={inElaborazione}
          />
        </label>

        {errore ? (
          <p className="text-sm text-red-300" role="alert">
            {errore}
          </p>
        ) : null}

        <button
          type="button"
          onClick={creaPreventivo}
          disabled={inElaborazione}
          className="w-full btn-primary py-4 font-black flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Sparkles size={18} aria-hidden="true" />
          {inElaborazione ? "Creo il preventivo..." : "Crea preventivo"}
        </button>
      </div>
    </BottomSheet>
  );
}
