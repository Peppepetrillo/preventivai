import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";

import BottomSheet from "../../../components/BottomSheet";
import ConfirmDialog from "../../../components/ConfirmDialog";
import NumericInput from "../../../components/NumericInput";
import DatePickerField from "../../agenda/components/DatePickerField";
import {
  STATI_GIORNATA,
  ETICHETTE_STATO_GIORNATA,
  calcolaOreUomo,
} from "../services/programmazioneCantiereService";

const FORM_VUOTO = {
  data: "",
  operai: "2",
  orePreviste: "8",
  attivita: "",
  note: "",
  stato: STATI_GIORNATA.programmata,
};

/**
 * Sheet crea/modifica giornata programmata (UX-7.3).
 */
export default function GiornataProgrammataSheet({
  open,
  onClose,
  giornata = null,
  onSalva,
  onElimina,
}) {
  const inModifica = Boolean(giornata?.id);
  const [form, setForm] = useState(FORM_VUOTO);
  const [errore, setErrore] = useState("");
  const [confermaElimina, setConfermaElimina] = useState(false);
  const [salvataggioInCorso, setSalvataggioInCorso] = useState(false);

  useEffect(() => {
    if (!open) {
      setSalvataggioInCorso(false);
      return;
    }
    setErrore("");
    setConfermaElimina(false);
    setSalvataggioInCorso(false);
    if (giornata) {
      setForm({
        data: giornata.data || "",
        operai: String(giornata.operai ?? 1),
        orePreviste: String(giornata.orePreviste ?? 0),
        attivita: giornata.attivita || "",
        note: giornata.note || "",
        stato: giornata.stato || STATI_GIORNATA.programmata,
      });
    } else {
      setForm({
        ...FORM_VUOTO,
        data: new Date().toLocaleDateString("it-IT"),
      });
    }
  }, [open, giornata]);

  function aggiorna(campo, valore) {
    setForm((prev) => ({ ...prev, [campo]: valore }));
  }

  function gestisciSalva() {
    if (salvataggioInCorso) return;
    const data = String(form.data || "").trim();
    if (!data) {
      setErrore("Seleziona una data.");
      return;
    }
    const operai = Math.max(1, Math.round(Number(form.operai) || 1));
    const orePreviste = Math.max(0, Number(form.orePreviste) || 0);
    setSalvataggioInCorso(true);
    onSalva?.({
      ...(inModifica ? { id: giornata.id } : {}),
      data,
      operai,
      orePreviste,
      attivita: String(form.attivita || "").trim(),
      note: String(form.note || "").trim(),
      stato: form.stato || STATI_GIORNATA.programmata,
    });
    onClose?.();
  }

  const oreUomo = calcolaOreUomo({
    orePreviste: Number(form.orePreviste) || 0,
    operai: Number(form.operai) || 1,
  });

  return (
    <>
      <BottomSheet
        open={open && !confermaElimina}
        onClose={onClose}
        title={inModifica ? "Modifica giornata" : "Nuova giornata"}
      >
        <div className="space-y-4 pb-4" data-testid="giornata-programmata-sheet">
          <DatePickerField
            label="Data"
            value={form.data}
            onChange={(data) => aggiorna("data", data)}
          />

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="ds-text-secondary text-xs font-bold uppercase tracking-wide">
                Operai
              </span>
              <NumericInput
                value={form.operai}
                onChange={(valore) => aggiorna("operai", valore)}
                min={1}
                step={1}
                inputMode="numeric"
                className="mt-1 w-full min-h-[48px]"
                data-testid="giornata-operai"
              />
            </label>
            <label className="block">
              <span className="ds-text-secondary text-xs font-bold uppercase tracking-wide">
                Ore previste
              </span>
              <NumericInput
                value={form.orePreviste}
                onChange={(valore) => aggiorna("orePreviste", valore)}
                min={0}
                step={0.5}
                className="mt-1 w-full min-h-[48px]"
                data-testid="giornata-ore"
              />
            </label>
          </div>

          <p className="ds-text-secondary text-sm">
            Ore uomo: <span className="ds-text-primary font-medium">{oreUomo}</span>
          </p>

          <label className="block">
            <span className="ds-text-secondary text-xs font-bold uppercase tracking-wide">
              Attività
            </span>
            <input
              type="text"
              value={form.attivita}
              onChange={(e) => aggiorna("attivita", e.target.value)}
              placeholder="Es. Tracce e tubazioni"
              className="mt-1 w-full min-h-[48px] rounded-[16px] bg-white/5 border border-white/10 px-4 ds-text-primary"
              data-testid="giornata-attivita"
            />
          </label>

          <label className="block">
            <span className="ds-text-secondary text-xs font-bold uppercase tracking-wide">
              Note
            </span>
            <textarea
              value={form.note}
              onChange={(e) => aggiorna("note", e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-[16px] bg-white/5 border border-white/10 px-4 py-3 ds-text-primary"
              data-testid="giornata-note"
            />
          </label>

          <fieldset>
            <legend className="ds-text-secondary text-xs font-bold uppercase tracking-wide mb-2">
              Stato
            </legend>
            <div className="flex flex-wrap gap-2">
              {Object.values(STATI_GIORNATA).map((stato) => (
                <button
                  key={stato}
                  type="button"
                  onClick={() => aggiorna("stato", stato)}
                  className={`min-h-[44px] px-3 rounded-full text-sm font-semibold ${
                    form.stato === stato
                      ? "bg-yellow-400 text-black"
                      : "bg-white/10 text-slate-300"
                  }`}
                  data-testid={`giornata-stato-${stato}`}
                >
                  {ETICHETTE_STATO_GIORNATA[stato]}
                </button>
              ))}
            </div>
          </fieldset>

          {errore ? (
            <p className="text-sm text-red-300" role="alert">
              {errore}
            </p>
          ) : null}

          <button
            type="button"
            onClick={gestisciSalva}
            disabled={salvataggioInCorso}
            className="btn-primary w-full min-h-[48px] disabled:opacity-60"
            data-testid="giornata-salva"
          >
            {salvataggioInCorso ? "Salvataggio…" : "Salva"}
          </button>

          {inModifica ? (
            <button
              type="button"
              onClick={() => setConfermaElimina(true)}
              className="btn-danger w-full min-h-[48px] flex items-center justify-center gap-2"
              data-testid="giornata-elimina"
            >
              <Trash2 size={18} aria-hidden="true" />
              Elimina giornata
            </button>
          ) : null}
        </div>
      </BottomSheet>

      <ConfirmDialog
        open={confermaElimina}
        title="Eliminare questa giornata?"
        description="La giornata sparirà anche dall'Agenda. Il cantiere resta invariato."
        confirmLabel="Elimina"
        cancelLabel="Annulla"
        onConfirm={() => {
          onElimina?.(giornata.id);
          setConfermaElimina(false);
          onClose?.();
        }}
        onCancel={() => setConfermaElimina(false)}
        testId="conferma-elimina-giornata"
      />
    </>
  );
}
