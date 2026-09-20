import { useState } from "react";

import BottomSheet from "../../../components/BottomSheet";
import NumericInput from "../../../components/NumericInput";
import { validaECreaOperaio, aggiornaOperaio } from "../operaiDomain";

/**
 * Sheet crea/modifica operaio.
 */
export default function OperaioSheet({
  open,
  onClose,
  operaio = null,
  onSalva,
}) {
  if (!open) return null;
  return (
    <OperaioSheetBody
      key={operaio?.id || "nuovo-operaio"}
      onClose={onClose}
      operaio={operaio}
      onSalva={onSalva}
    />
  );
}

function OperaioSheetBody({ onClose, operaio, onSalva }) {
  const inModifica = Boolean(operaio?.id);
  const [nome, setNome] = useState(operaio?.nome || "");
  const [cognome, setCognome] = useState(operaio?.cognome || "");
  const [ruolo, setRuolo] = useState(operaio?.ruolo || "Elettricista");
  const [costoGiornata, setCostoGiornata] = useState(
    operaio?.costoGiornata != null ? String(operaio.costoGiornata) : ""
  );
  const [costoOra, setCostoOra] = useState(
    operaio?.costoOra != null ? String(operaio.costoOra) : ""
  );
  const [errore, setErrore] = useState("");
  const [busy, setBusy] = useState(false);

  async function salva() {
    if (busy) return;
    setBusy(true);
    setErrore("");
    try {
      const payload = {
        nome,
        cognome,
        ruolo,
        costoGiornata,
        costoOra,
      };
      const esito = inModifica
        ? aggiornaOperaio(operaio, payload)
        : validaECreaOperaio(payload);
      if (!esito.ok) {
        setErrore(esito.errore || "Dati non validi.");
        return;
      }
      const result = await onSalva?.(esito.operaio);
      if (result && result.ok === false) {
        setErrore(result.errore || "Salvataggio non riuscito.");
        return;
      }
      onClose?.();
    } finally {
      setBusy(false);
    }
  }

  return (
    <BottomSheet
      open
      onClose={onClose}
      title={inModifica ? "Modifica operaio" : "Aggiungi operaio"}
    >
      <div className="space-y-4 p-1" data-testid="operaio-sheet">
        <label className="block">
          <span className="ds-text-secondary text-sm font-medium">Nome</span>
          <input
            className="input-pro mt-2 min-h-[52px] text-base"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            autoComplete="given-name"
            data-testid="operaio-input-nome"
          />
        </label>
        <label className="block">
          <span className="ds-text-secondary text-sm font-medium">Cognome</span>
          <input
            className="input-pro mt-2 min-h-[52px] text-base"
            value={cognome}
            onChange={(e) => setCognome(e.target.value)}
            autoComplete="family-name"
            data-testid="operaio-input-cognome"
          />
        </label>
        <label className="block">
          <span className="ds-text-secondary text-sm font-medium">Ruolo</span>
          <input
            className="input-pro mt-2 min-h-[52px] text-base"
            value={ruolo}
            onChange={(e) => setRuolo(e.target.value)}
            placeholder="Elettricista"
            data-testid="operaio-input-ruolo"
          />
        </label>
        <label className="block">
          <span className="ds-text-secondary text-sm font-medium">
            Costo giornata (€)
          </span>
          <NumericInput
            className="input-pro mt-2 min-h-[52px] text-base w-full"
            value={costoGiornata}
            onChange={setCostoGiornata}
            inputMode="decimal"
            data-testid="operaio-input-costo-giornata"
          />
        </label>
        <label className="block">
          <span className="ds-text-secondary text-sm font-medium">
            Costo ora (€)
          </span>
          <NumericInput
            className="input-pro mt-2 min-h-[52px] text-base w-full"
            value={costoOra}
            onChange={setCostoOra}
            inputMode="decimal"
            data-testid="operaio-input-costo-ora"
          />
        </label>
        <p className="ds-text-secondary text-sm">
          Serve almeno uno dei due costi. Puoi lasciare vuoto l&apos;altro.
        </p>
        {errore ? (
          <p className="text-sm text-rose-200" role="alert">
            {errore}
          </p>
        ) : null}
        <button
          type="button"
          className="btn-primary w-full min-h-[52px] font-semibold disabled:opacity-50"
          disabled={busy}
          onClick={salva}
          data-testid="operaio-salva"
        >
          {busy ? "Salvataggio…" : "Salva operaio"}
        </button>
      </div>
    </BottomSheet>
  );
}
