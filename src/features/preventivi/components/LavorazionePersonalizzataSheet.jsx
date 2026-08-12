import { useEffect, useState } from "react";

import BottomSheet from "../../../components/BottomSheet";
import NumericInput from "../../../components/NumericInput";
import { normalizzaNumero } from "../../../utils/preventivi";

function statoIniziale() {
  return {
    nome: "",
    prezzo: 0,
    quantita: 1,
  };
}

/**
 * Sheet per aggiungere una lavorazione non presente nel listino.
 */
export default function LavorazionePersonalizzataSheet({ open, onClose, onSalva }) {
  const [form, setForm] = useState(statoIniziale);

  useEffect(() => {
    if (open) setForm(statoIniziale());
  }, [open]);

  function gestisciSalva() {
    const nome = form.nome.trim();
    if (!nome) return;

    onSalva({
      id: `custom-${Date.now()}`,
      nome,
      categoria: "Lavorazioni",
      prezzo: normalizzaNumero(form.prezzo),
      quantita: normalizzaNumero(form.quantita, 1),
      unita: "cad",
      listinoId: null,
      catalogoId: null,
    });
    onClose();
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Lavorazione personalizzata">
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
          disabled={!form.nome.trim()}
          className="btn-primary w-full min-h-[44px] disabled:opacity-40"
        >
          Aggiungi
        </button>
      </div>
    </BottomSheet>
  );
}
