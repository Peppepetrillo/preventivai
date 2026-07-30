import { useState } from "react";

import { formattaDataLocale } from "../../lavori/schedulingDomain";
import DateCalendarSheet from "./DateCalendarSheet";

/**
 * Selettore data: Oggi · Domani · Scegli la data
 * "Scegli la data" apre un calendario custom in BottomSheet.
 */
export default function DatePickerField({
  value = "",
  onChange,
  oggi = new Date(),
  label = "Data",
}) {
  const [calendarioAperto, setCalendarioAperto] = useState(false);
  const oggiStr = formattaDataLocale(oggi);
  const domaniStr = formattaDataLocale(aggiungiGiorniDate(oggi, 1));
  const preset =
    value === oggiStr ? "oggi" : value === domaniStr ? "domani" : "scegli";

  return (
    <>
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

          <button
            type="button"
            onClick={() => setCalendarioAperto(true)}
            aria-haspopup="dialog"
            className={`min-h-[44px] px-4 rounded-full text-sm font-black ${
              preset === "scegli"
                ? "bg-yellow-400 text-black"
                : "bg-white/10 text-slate-300"
            }`}
          >
            Scegli la data
          </button>
        </div>
        {value ? (
          <p className="text-sm text-slate-400 px-1">{value}</p>
        ) : null}
      </fieldset>

      <DateCalendarSheet
        open={calendarioAperto}
        onClose={() => setCalendarioAperto(false)}
        value={value}
        onSelect={onChange}
        oggi={oggi}
      />
    </>
  );
}

export function aggiungiGiorniDate(data, giorni) {
  const d = new Date(data);
  d.setDate(d.getDate() + giorni);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function dataItToIso(dataIt = "") {
  const m = String(dataIt).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return "";
  return `${m[3]}-${String(m[2]).padStart(2, "0")}-${String(m[1]).padStart(2, "0")}`;
}

export function isoToDataIt(iso = "") {
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return "";
  return `${Number(m[3])}/${Number(m[2])}/${m[1]}`;
}
