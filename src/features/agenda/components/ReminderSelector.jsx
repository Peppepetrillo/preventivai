import { useState } from "react";

import { REMINDER_PRESETS } from "../../lavori/schedulingDomain";

/**
 * Selettore reminder: 15m / 30m / 1h / giorno prima / personalizzato.
 */
export default function ReminderSelector({
  enabled = false,
  minutes = 60,
  onChangeEnabled,
  onChangeMinutes,
}) {
  const [personalizzato, setPersonalizzato] = useState("");
  const presetAttivo =
    REMINDER_PRESETS.find(
      (p) => p.minutes != null && Number(p.minutes) === Number(minutes)
    )?.id || "personalizzato";

  return (
    <fieldset className="space-y-3">
      <legend className="ds-text-secondary text-xs font-bold uppercase tracking-wide">
        Reminder
      </legend>

      <label className="flex items-center gap-3 min-h-[44px]">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onChangeEnabled?.(e.target.checked)}
          className="w-5 h-5"
        />
        <span className="ds-text-primary text-sm">Attiva notifica</span>
      </label>

      {enabled ? (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {REMINDER_PRESETS.filter((p) => p.id !== "personalizzato").map(
              (preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onChangeMinutes?.(preset.minutes)}
                  className={`min-h-[44px] px-3 rounded-full text-xs font-black ${
                    presetAttivo === preset.id
                      ? "bg-yellow-400 text-black"
                      : "bg-white/10 text-slate-300"
                  }`}
                >
                  {preset.label}
                </button>
              )
            )}
          </div>
          <label className="block">
            <span className="ds-text-secondary text-xs">
              Personalizzato (minuti prima)
            </span>
            <input
              type="number"
              min={1}
              max={7 * 24 * 60}
              className="mt-1.5 w-full min-h-[48px] rounded-[16px] border border-white/10 bg-black/30 px-4 text-white"
              value={
                presetAttivo === "personalizzato"
                  ? personalizzato || minutes || ""
                  : personalizzato
              }
              placeholder="Es. 45"
              onChange={(e) => {
                const val = e.target.value;
                setPersonalizzato(val);
                const n = Number(val);
                if (Number.isFinite(n) && n > 0) onChangeMinutes?.(n);
              }}
            />
          </label>
        </div>
      ) : null}
    </fieldset>
  );
}
