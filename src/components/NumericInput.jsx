import {
  useState,
} from "react";

function normalizzaTestoNumerico(valore, inputMode) {
  const testo = String(valore ?? "");

  if (inputMode === "numeric") {
    return testo.replace(/\D/g, "");
  }

  const pulito = testo.replace(/[^\d,.]/g, "");
  const parti = pulito.split(/[,.]/);

  if (parti.length <= 1) return pulito;

  const separatore = pulito.includes(",") ? "," : ".";
  return `${parti[0]}${separatore}${parti.slice(1).join("")}`;
}

function valoreVisualizzato(valore) {
  if (valore === undefined || valore === null) return "";
  return String(valore);
}

function valoreNumerico(valore) {
  const testo = String(valore ?? "").trim().replace(",", ".");
  if (!testo) return 0;

  const numero = Number(testo);
  return Number.isFinite(numero) ? numero : 0;
}

export default function NumericInput({
  value,
  onChange,
  onBlur,
  inputMode = "decimal",
  selectOnFocus = true,
  className = "",
  ...props
}) {
  // Garantisce font-size ≥ 16px su iOS (previene zoom automatico WKWebView).
  // I chiamanti possono sovrascrivere aggiungendo classi text-* nella loro className.
  const classeBase = className.includes("text-") ? className : `text-base ${className}`.trim();
  const [inModifica, setInModifica] = useState(false);
  const [testo, setTesto] = useState(() => valoreVisualizzato(value));
  const valoreInput = inModifica ? testo : valoreVisualizzato(value);

  function gestisciFocus(evento) {
    setInModifica(true);

    if (valoreNumerico(evento.currentTarget.value) === 0) {
      setTesto("");
    } else {
      setTesto(valoreVisualizzato(value));
      if (selectOnFocus) {
        const campo = evento.currentTarget;
        // setTimeout > queueMicrotask su WKWebView: la tastiera iOS è pronta dopo ~100ms
        setTimeout(() => {
          try {
            campo.select();
          } catch {
            /* ignore */
          }
        }, 150);
      }
    }

    props.onFocus?.(evento);
  }

  function gestisciChange(evento) {
    const prossimoTesto = normalizzaTestoNumerico(
      evento.target.value,
      inputMode
    );

    setTesto(prossimoTesto);
    onChange?.(prossimoTesto);
  }

  function confermaValore(evento) {
    const prossimoValore = valoreNumerico(testo);

    setInModifica(false);
    setTesto(String(prossimoValore));
    onChange?.(prossimoValore);
    onBlur?.(evento);
  }

  function gestisciBlur(evento) {
    confermaValore(evento);
  }

  function gestisciKeyDown(evento) {
    if (evento.key === "Enter") {
      evento.preventDefault();
      evento.currentTarget.blur();
    }
    props.onKeyDown?.(evento);
  }

  return (
    <input
      {...props}
      className={classeBase}
      type="text"
      inputMode={inputMode}
      value={valoreInput}
      onFocus={gestisciFocus}
      onChange={gestisciChange}
      onBlur={gestisciBlur}
      onKeyDown={gestisciKeyDown}
    />
  );
}
