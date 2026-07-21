import { useId, useState } from "react";

import BottomSheet from "../../../components/BottomSheet";
import NumericInput from "../../../components/NumericInput";
import { CONDIZIONI_DEFAULT } from "../wizard/wizardConfig";

function CondizioniAvanzateForm({ condizioni, onSalva, onClose }) {
  const baseId = useId();
  const [bozza, setBozza] = useState(condizioni);

  function aggiornaCampo(campo, valore) {
    setBozza((precedente) => ({
      ...precedente,
      [campo]: valore,
    }));
  }

  function salva() {
    onSalva(bozza);
    onClose();
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <label htmlFor={`${baseId}-iva`}>
          <span className="text-sm text-slate-400">IVA %</span>
          <NumericInput
            id={`${baseId}-iva`}
            min="0"
            value={bozza.iva}
            inputMode="decimal"
            onChange={(valore) => aggiornaCampo("iva", valore)}
            className="mt-2 input-pro"
          />
        </label>

        <label htmlFor={`${baseId}-sconto`}>
          <span className="text-sm text-slate-400">Sconto %</span>
          <NumericInput
            id={`${baseId}-sconto`}
            min="0"
            value={bozza.sconto}
            inputMode="decimal"
            onChange={(valore) => aggiornaCampo("sconto", valore)}
            className="mt-2 input-pro"
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label htmlFor={`${baseId}-validita`}>
          <span className="text-sm text-slate-400">Validità giorni</span>
          <NumericInput
            id={`${baseId}-validita`}
            min="0"
            value={bozza.validita}
            inputMode="numeric"
            onChange={(valore) => aggiornaCampo("validita", valore)}
            className="mt-2 input-pro"
          />
        </label>

        <label htmlFor={`${baseId}-acconto`}>
          <span className="text-sm text-slate-400">Acconto €</span>
          <NumericInput
            id={`${baseId}-acconto`}
            min="0"
            value={bozza.acconto}
            inputMode="decimal"
            onChange={(valore) => aggiornaCampo("acconto", valore)}
            className="mt-2 input-pro"
          />
        </label>
      </div>

      <label htmlFor={`${baseId}-pagamento`} className="block">
        <span className="text-sm text-slate-400">Pagamento</span>
        <input
          id={`${baseId}-pagamento`}
          value={bozza.pagamento}
          onChange={(event) => aggiornaCampo("pagamento", event.target.value)}
          placeholder={CONDIZIONI_DEFAULT.pagamento}
          className="mt-2 input-pro"
        />
      </label>

      <label htmlFor={`${baseId}-note`} className="block">
        <span className="text-sm text-slate-400">Note per il cliente</span>
        <textarea
          id={`${baseId}-note`}
          value={bozza.note}
          onChange={(event) => aggiornaCampo("note", event.target.value)}
          rows={3}
          placeholder="Validità offerta, materiali inclusi, tempi stimati..."
          className="mt-2 input-pro resize-none"
        />
      </label>

      <button
        type="button"
        onClick={salva}
        className="w-full btn-primary py-4 font-black"
      >
        Fatto
      </button>
    </div>
  );
}

export default function CondizioniAvanzate({
  open,
  onClose,
  condizioni,
  onSalva,
}) {
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Impostazioni avanzate"
      descrizione="IVA, pagamento, validità e note del preventivo."
    >
      {open ? (
        <CondizioniAvanzateForm
          key={JSON.stringify(condizioni)}
          condizioni={condizioni}
          onSalva={onSalva}
          onClose={onClose}
        />
      ) : null}
    </BottomSheet>
  );
}
