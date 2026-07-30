import { ORARI_SUGGERITI } from "../../lavori/schedulingDomain";

/**
 * Selettore ora a chip rapide + input time.
 */
export default function TimePickerField({
  value = "",
  onChange,
  label = "Ora",
  orari = ORARI_SUGGERITI,
}) {
  const principali = orari.filter((o) => o.endsWith(":00")).slice(0, 12);

  return (
    <fieldset className="space-y-2">
      <legend className="ds-text-secondary text-xs font-bold uppercase tracking-wide">
        {label}
      </legend>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {principali.map((ora) => (
          <button
            key={ora}
            type="button"
            onClick={() => onChange?.(ora)}
            className={`min-h-[44px] min-w-[64px] px-3 rounded-full text-sm font-black shrink-0 ${
              value === ora
                ? "bg-yellow-400 text-black"
                : "bg-white/10 text-slate-300"
            }`}
          >
            {ora}
          </button>
        ))}
      </div>
      <input
        type="time"
        className="w-full min-h-[48px] rounded-[16px] border border-white/10 bg-black/30 px-4 text-white"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
      />
    </fieldset>
  );
}
