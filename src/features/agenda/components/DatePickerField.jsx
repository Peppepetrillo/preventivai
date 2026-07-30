import { useId, useRef } from "react";

import { formattaDataLocale } from "../../lavori/schedulingDomain";

/**
 * Selettore data: Oggi · Domani · Scegli la data
 * "Scegli la data" apre il date picker nativo via showPicker()/click().
 */
export default function DatePickerField({
  value = "",
  onChange,
  oggi = new Date(),
  label = "Data",
}) {
  const inputId = useId();
  const inputRef = useRef(null);
  const oggiStr = formattaDataLocale(oggi);
  const domaniStr = formattaDataLocale(aggiungiGiorniDate(oggi, 1));
  const preset =
    value === oggiStr ? "oggi" : value === domaniStr ? "domani" : "scegli";

  function apriCalendario() {
    const input = inputRef.current;
    if (!input) return;

    // showPicker() su Chromium/Safari moderni; fallback click() dallo stesso user gesture.
    if (typeof input.showPicker === "function") {
      try {
        input.showPicker();
        return;
      } catch {
        // NotAllowedError / non supportato nel contesto corrente
      }
    }
    input.focus();
    input.click();
  }

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

        <div className="relative inline-flex">
          <button
            type="button"
            onClick={apriCalendario}
            aria-controls={inputId}
            aria-haspopup="dialog"
            className={`min-h-[44px] px-4 rounded-full text-sm font-black ${
              preset === "scegli"
                ? "bg-yellow-400 text-black"
                : "bg-white/10 text-slate-300"
            }`}
          >
            Scegli la data
          </button>
          {/*
            Non usare .sr-only (clip 1×1): impedisce l'apertura del picker nativo.
            L'input resta fuori dal hit-test; lo apre il button via showPicker/click.
          */}
          <input
            ref={inputRef}
            id={inputId}
            type="date"
            value={dataItToIso(value)}
            onChange={(e) => {
              const iso = e.target.value;
              if (!iso) return;
              onChange?.(isoToDataIt(iso));
            }}
            className="pointer-events-none absolute left-0 top-0 h-11 w-11 opacity-0"
            aria-label="Seleziona una data dal calendario"
            tabIndex={-1}
          />
        </div>
      </div>
      {value ? (
        <p className="text-sm text-slate-400 px-1">{value}</p>
      ) : null}
    </fieldset>
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
