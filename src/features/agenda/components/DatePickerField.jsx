import { formattaDataLocale } from "../../lavori/schedulingDomain";

/**
 * Selettore data: Oggi · Domani · Scegli la data
 */
export default function DatePickerField({
  value = "",
  onChange,
  oggi = new Date(),
  label = "Data",
}) {
  const oggiStr = formattaDataLocale(oggi);
  const domaniStr = formattaDataLocale(aggiungiGiorniDate(oggi, 1));
  const preset =
    value === oggiStr ? "oggi" : value === domaniStr ? "domani" : "scegli";

  return (
    <fieldset className="space-y-2">
      <legend className="ds-text-secondary text-xs font-bold uppercase tracking-wide">
        {label}
      </legend>
      <div className="flex gap-2 flex-wrap">
        {[
          { id: "oggi", label: "Oggi", data: oggiStr },
          { id: "domani", label: "Domani", data: domaniStr },
        ].map((voce) => (
          <button
            key={voce.id}
            type="button"
            onClick={() => onChange?.(voce.data)}
            className={`min-h-[44px] px-4 rounded-full text-sm font-black ${
              preset === voce.id
                ? "bg-yellow-400 text-black"
                : "bg-white/10 text-slate-300"
            }`}
          >
            {voce.label}
          </button>
        ))}
        <label
          className={`min-h-[44px] px-4 rounded-full text-sm font-black flex items-center cursor-pointer ${
            preset === "scegli"
              ? "bg-yellow-400 text-black"
              : "bg-white/10 text-slate-300"
          }`}
        >
          Scegli la data
          <input
            type="date"
            className="sr-only"
            value={dataItToIso(value)}
            onChange={(e) => {
              const iso = e.target.value;
              if (!iso) return;
              onChange?.(isoToDataIt(iso));
            }}
          />
        </label>
      </div>
      {value ? (
        <p className="text-sm text-slate-400 px-1">{value}</p>
      ) : null}
    </fieldset>
  );
}

function aggiungiGiorniDate(data, giorni) {
  const d = new Date(data);
  d.setDate(d.getDate() + giorni);
  d.setHours(0, 0, 0, 0);
  return d;
}

function dataItToIso(dataIt = "") {
  const m = String(dataIt).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return "";
  return `${m[3]}-${String(m[2]).padStart(2, "0")}-${String(m[1]).padStart(2, "0")}`;
}

function isoToDataIt(iso = "") {
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return "";
  return `${Number(m[3])}/${Number(m[2])}/${m[1]}`;
}
