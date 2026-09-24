import { useMemo, useState } from "react";

import BottomSheet from "../../../components/BottomSheet";
import NumericInput from "../../../components/NumericInput";
import DatePickerField from "../../agenda/components/DatePickerField";
import { formattaDataLocale } from "../../lavori/schedulingDomain";
import {
  TIPI_GIORNATA_MANODOPERA,
  validaGiornataManodopera,
} from "../giornateManodoperaService";
import {
  nomeCompletoOperaio,
  suggerisciCostoGiornata,
} from "../operaiDomain";

/**
 * Sheet registra/modifica giornata manodopera.
 */
export default function GiornataManodoperaSheet({
  open,
  onClose,
  giornata = null,
  cantiereId,
  operai = [],
  onSalva,
}) {
  if (!open) return null;
  return (
    <GiornataManodoperaBody
      key={giornata?.id || `nuova-${cantiereId}`}
      onClose={onClose}
      giornata={giornata}
      cantiereId={cantiereId}
      operai={operai}
      onSalva={onSalva}
    />
  );
}

function GiornataManodoperaBody({
  onClose,
  giornata,
  cantiereId,
  operai,
  onSalva,
}) {
  const inModifica = Boolean(giornata?.id);
  const operaiAttivi = useMemo(
    () =>
      (operai || []).filter(
        (o) => o?.attivo !== false || String(o?.id) === String(giornata?.operaioId)
      ),
    [operai, giornata?.operaioId]
  );

  const [data, setData] = useState(
    giornata?.data || formattaDataLocale(new Date())
  );
  const [operaioId, setOperaioId] = useState(giornata?.operaioId || "");
  const [tipo, setTipo] = useState(
    giornata?.tipo === TIPI_GIORNATA_MANODOPERA.ore
      ? TIPI_GIORNATA_MANODOPERA.ore
      : TIPI_GIORNATA_MANODOPERA.giornata
  );
  const [ore, setOre] = useState(
    giornata?.ore != null ? String(giornata.ore) : tipo === "ore" ? "" : "8"
  );
  const [costo, setCosto] = useState(
    giornata?.costo != null ? String(giornata.costo) : ""
  );
  const [costoManuale, setCostoManuale] = useState(Boolean(giornata?.id));
  const [pagato, setPagato] = useState(Boolean(giornata?.pagato));
  const [errore, setErrore] = useState("");
  const [busy, setBusy] = useState(false);

  const operaioSelezionato = operaiAttivi.find(
    (o) => String(o.id) === String(operaioId)
  );

  function ricalcolaCosto(nextTipo, nextOre, nextOperaioId) {
    if (costoManuale) return;
    const op =
      operaiAttivi.find((o) => String(o.id) === String(nextOperaioId)) || null;
    const sug = suggerisciCostoGiornata(op, {
      tipo: nextTipo,
      ore: Number(String(nextOre).replace(",", ".")),
    });
    if (sug.ok) setCosto(String(sug.costo));
  }

  async function salva() {
    if (busy) return;
    setBusy(true);
    setErrore("");
    try {
      const esito = validaGiornataManodopera(
        {
          id: giornata?.id,
          cantiereId,
          operaioId,
          data,
          tipo,
          ore,
          costo,
          pagato,
          createdAt: giornata?.createdAt,
        },
        operaioSelezionato
      );
      if (!esito.ok) {
        setErrore(esito.errore || "Dati non validi.");
        return;
      }
      const result = await onSalva?.(esito.giornata);
      if (result && result.success === false) {
        setErrore("Salvataggio non riuscito.");
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
      title={inModifica ? "Modifica giornata" : "Registra giornata"}
    >
      <div className="space-y-4 p-1" data-testid="giornata-manodopera-sheet">
        <DatePickerField value={data} onChange={setData} label="Data" />

        <label className="block">
          <span className="ds-text-secondary text-sm font-medium">Operaio</span>
          <select
            className="input-pro mt-2 min-h-[52px] text-base w-full"
            value={operaioId}
            data-testid="giornata-manodopera-operaio"
            onChange={(e) => {
              const id = e.target.value;
              setOperaioId(id);
              ricalcolaCosto(tipo, ore, id);
            }}
          >
            <option value="">Seleziona…</option>
            {operaiAttivi.map((op) => (
              <option key={op.id} value={op.id}>
                {nomeCompletoOperaio(op)}
              </option>
            ))}
          </select>
        </label>

        {operaiAttivi.length === 0 ? (
          <p className="text-sm text-amber-200">
            Nessun operaio attivo. Aggiungilo da Altro → Operai.
          </p>
        ) : null}

        <fieldset>
          <legend className="ds-text-secondary text-sm font-medium mb-2">
            Tipo
          </legend>
          <div className="flex gap-2">
            {[
              { id: "giornata", label: "Giornata" },
              { id: "ore", label: "Ore" },
            ].map((voce) => (
              <button
                key={voce.id}
                type="button"
                className={`min-h-[48px] flex-1 rounded-[16px] font-semibold ${
                  tipo === voce.id
                    ? "bg-yellow-400 text-black"
                    : "btn-secondary"
                }`}
                data-testid={`giornata-manodopera-tipo-${voce.id}`}
                onClick={() => {
                  setTipo(voce.id);
                  const nextOre = voce.id === "giornata" ? ore || "8" : ore;
                  if (voce.id === "giornata" && !ore) setOre("8");
                  ricalcolaCosto(voce.id, nextOre, operaioId);
                }}
              >
                {voce.label}
              </button>
            ))}
          </div>
        </fieldset>

        <label className="block">
          <span className="ds-text-secondary text-sm font-medium">Ore</span>
          <NumericInput
            className="input-pro mt-2 min-h-[52px] text-base w-full"
            value={ore}
            inputMode="decimal"
            data-testid="giornata-manodopera-ore"
            onChange={(v) => {
              setOre(v);
              ricalcolaCosto(tipo, v, operaioId);
            }}
          />
        </label>

        <label className="block">
          <span className="ds-text-secondary text-sm font-medium">
            Costo (€) — modificabile
          </span>
          <NumericInput
            className="input-pro mt-2 min-h-[52px] text-base w-full"
            value={costo}
            inputMode="decimal"
            data-testid="giornata-manodopera-costo"
            onChange={(v) => {
              setCostoManuale(true);
              setCosto(v);
            }}
          />
        </label>

        <button
          type="button"
          className={`w-full min-h-[52px] rounded-[16px] font-semibold border ${
            pagato
              ? "bg-emerald-500/20 border-emerald-400/40 text-emerald-200"
              : "bg-amber-500/15 border-amber-400/30 text-amber-100"
          }`}
          data-testid="giornata-manodopera-pagato-toggle"
          onClick={() => setPagato((p) => !p)}
        >
          {pagato ? "✅ Pagato" : "⚠️ Da pagare"}
        </button>

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
          data-testid="giornata-manodopera-salva"
        >
          {busy ? "Salvataggio…" : "Salva"}
        </button>
      </div>
    </BottomSheet>
  );
}
