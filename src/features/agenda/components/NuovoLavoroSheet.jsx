import { useEffect, useState } from "react";

import BottomSheet from "../../../components/BottomSheet";
import { TIPO_LAVORO } from "../../lavori/lavoriTypes";
import {
  DURATE_SUGGERITE,
  formattaDataLocale,
  PRIORITA_LAVORO,
} from "../../lavori/schedulingDomain";
import DatePickerField from "./DatePickerField";
import ReminderSelector from "./ReminderSelector";
import TimePickerField from "./TimePickerField";

const TIPI_FORM = [
  { id: TIPO_LAVORO.CANTIERE, label: "Cantiere" },
  { id: TIPO_LAVORO.INTERVENTO, label: "Intervento" },
  { id: TIPO_LAVORO.SOPRALLUOGO, label: "Sopralluogo" },
];

function statoIniziale(dataDefault) {
  return {
    tipoLavoro: TIPO_LAVORO.INTERVENTO,
    titolo: "",
    cliente: "",
    scheduledDate: dataDefault || formattaDataLocale(new Date()),
    scheduledTime: "09:00",
    estimatedDuration: 60,
    priorita: PRIORITA_LAVORO.MEDIA,
    note: "",
    reminderEnabled: false,
    reminderMinutes: 60,
  };
}

/**
 * Sheet creazione rapida lavoro dall'Agenda.
 */
export default function NuovoLavoroSheet({
  aperto,
  onChiudi,
  onSalva,
  dataDefault = "",
  title = "Nuovo cantiere",
  descrizione = "Crea un nuovo cantiere o intervento.",
}) {
  const [form, setForm] = useState(() => statoIniziale(dataDefault));

  useEffect(() => {
    if (aperto) setForm(statoIniziale(dataDefault));
  }, [aperto, dataDefault]);

  function aggiorna(campo, valore) {
    setForm((prev) => ({ ...prev, [campo]: valore }));
  }

  function invia(event) {
    event.preventDefault();
    if (!form.titolo.trim() && !form.cliente.trim()) return;
    onSalva?.(form);
    onChiudi?.();
  }

  return (
    <BottomSheet
      open={aperto}
      onClose={onChiudi}
      title={title}
      descrizione={descrizione}
    >
      <form onSubmit={invia} className="space-y-5 pb-2">
        <fieldset>
          <legend className="ds-text-secondary text-xs font-bold uppercase tracking-wide mb-2">
            Tipo
          </legend>
          <div className="grid grid-cols-3 gap-2">
            {TIPI_FORM.map((tipo) => (
              <button
                key={tipo.id}
                type="button"
                onClick={() => aggiorna("tipoLavoro", tipo.id)}
                className={`min-h-[48px] rounded-[14px] text-sm font-black border ${
                  form.tipoLavoro === tipo.id
                    ? "border-yellow-400 bg-yellow-400/20 text-yellow-100"
                    : "border-white/10 bg-black/20 text-slate-300"
                }`}
              >
                {tipo.label}
              </button>
            ))}
          </div>
        </fieldset>

        <label className="block">
          <span className="ds-text-secondary text-xs font-bold uppercase tracking-wide">
            Titolo
          </span>
          <input
            className="mt-1.5 w-full min-h-[48px] rounded-[16px] border border-white/10 bg-black/30 px-4 text-white"
            value={form.titolo}
            onChange={(e) => aggiorna("titolo", e.target.value)}
            placeholder="Es. Quadro elettrico"
            autoFocus
          />
        </label>

        <label className="block">
          <span className="ds-text-secondary text-xs font-bold uppercase tracking-wide">
            Cliente
          </span>
          <input
            className="mt-1.5 w-full min-h-[48px] rounded-[16px] border border-white/10 bg-black/30 px-4 text-white"
            value={form.cliente}
            onChange={(e) => aggiorna("cliente", e.target.value)}
            placeholder="Es. Rossi"
            required
          />
        </label>

        <DatePickerField
          value={form.scheduledDate}
          onChange={(v) => aggiorna("scheduledDate", v)}
        />

        <TimePickerField
          value={form.scheduledTime}
          onChange={(v) => aggiorna("scheduledTime", v)}
        />

        <fieldset>
          <legend className="ds-text-secondary text-xs font-bold uppercase tracking-wide mb-2">
            Durata prevista
          </legend>
          <div className="flex flex-wrap gap-2">
            {DURATE_SUGGERITE.map((d) => (
              <button
                key={d.minuti}
                type="button"
                onClick={() => aggiorna("estimatedDuration", d.minuti)}
                className={`min-h-[44px] px-3 rounded-full text-sm font-black ${
                  form.estimatedDuration === d.minuti
                    ? "bg-yellow-400 text-black"
                    : "bg-white/10 text-slate-300"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </fieldset>

        <label className="block">
          <span className="ds-text-secondary text-xs font-bold uppercase tracking-wide">
            Priorità
          </span>
          <select
            className="mt-1.5 w-full min-h-[48px] rounded-[16px] border border-white/10 bg-black/30 px-3 text-white"
            value={form.priorita}
            onChange={(e) => aggiorna("priorita", e.target.value)}
          >
            <option value={PRIORITA_LAVORO.BASSA}>Bassa</option>
            <option value={PRIORITA_LAVORO.MEDIA}>Media</option>
            <option value={PRIORITA_LAVORO.ALTA}>Alta</option>
          </select>
        </label>

        <ReminderSelector
          enabled={form.reminderEnabled}
          minutes={form.reminderMinutes}
          onChangeEnabled={(v) => aggiorna("reminderEnabled", v)}
          onChangeMinutes={(v) => aggiorna("reminderMinutes", v)}
        />

        <label className="block">
          <span className="ds-text-secondary text-xs font-bold uppercase tracking-wide">
            Note
          </span>
          <textarea
            className="mt-1.5 w-full min-h-[72px] rounded-[16px] border border-white/10 bg-black/30 px-4 py-3 text-white"
            value={form.note}
            onChange={(e) => aggiorna("note", e.target.value)}
            placeholder="Dettagli utili sul lavoro"
          />
        </label>

        <button type="submit" className="btn-primary w-full min-h-[52px] font-black">
          Salva in agenda
        </button>
      </form>
    </BottomSheet>
  );
}
