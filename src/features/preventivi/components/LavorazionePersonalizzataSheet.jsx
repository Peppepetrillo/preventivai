import { useRef, useState } from "react";

import BottomSheet from "../../../components/BottomSheet";
import NumericInput from "../../../components/NumericInput";
import { creaLavorazioneManuale } from "../lavorazionePreventivoUtils";

function statoIniziale() {
  return {
    nome: "",
    prezzo: 0,
    quantita: 1,
  };
}

function FormLavorazionePersonalizzata({ onClose, onSalva }) {
  const [form, setForm] = useState(statoIniziale);
  const [salvando, setSalvando] = useState(false);
  const salvataggioInCorso = useRef(false);

  function gestisciSalva() {
    if (salvataggioInCorso.current) return;
    const nome = form.nome.trim();
    if (!nome) return;

    salvataggioInCorso.current = true;
    setSalvando(true);
    try {
      onSalva(
        creaLavorazioneManuale({
          id: `custom-${Date.now()}`,
          nome,
          prezzo: form.prezzo,
          quantita: form.quantita,
        })
      );
      onClose();
    } catch {
      salvataggioInCorso.current = false;
      setSalvando(false);
    }
  }

  return (
    <div className="space-y-4 pb-2">
      <label className="block">
        <span className="ds-text-secondary text-sm">Nome</span>
        <input
          value={form.nome}
          onChange={(event) =>
            setForm((precedente) => ({ ...precedente, nome: event.target.value }))
          }
          className="mt-1 w-full input-pro p-3 min-h-[44px]"
          placeholder="Es. Lavoro straordinario"
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="ds-text-secondary text-sm">Prezzo</span>
          <NumericInput
            min="0"
            value={form.prezzo}
            inputMode="decimal"
            onChange={(valore) =>
              setForm((precedente) => ({ ...precedente, prezzo: valore }))
            }
            className="mt-1 w-full input-pro p-3 min-h-[44px]"
          />
        </label>

        <label className="block">
          <span className="ds-text-secondary text-sm">Quantità</span>
          <NumericInput
            min="1"
            value={form.quantita}
            inputMode="decimal"
            onChange={(valore) =>
              setForm((precedente) => ({ ...precedente, quantita: valore }))
            }
            className="mt-1 w-full input-pro p-3 min-h-[44px]"
          />
        </label>
      </div>

      <button
        type="button"
        onClick={gestisciSalva}
        disabled={!form.nome.trim() || salvando}
        className="btn-primary w-full min-h-[44px] disabled:opacity-40"
        data-testid="lavorazione-personalizzata-salva"
      >
        {salvando ? "Aggiunta…" : "Aggiungi"}
      </button>
    </div>
  );
}

/**
 * Sheet per aggiungere una lavorazione non presente nel listino.
 * Form remounted when open so draft resets without setState-in-effect.
 */
export default function LavorazionePersonalizzataSheet({ open, onClose, onSalva }) {
  return (
    <BottomSheet open={open} onClose={onClose} title="Lavorazione personalizzata">
      {open ? (
        <FormLavorazionePersonalizzata
          key="nuova-lavorazione"
          onClose={onClose}
          onSalva={onSalva}
        />
      ) : null}
    </BottomSheet>
  );
}
