/**
 * Campi e layout condivisi per i calcolatori elettrici.
 */

export function NumericField({
  id,
  label,
  value,
  onChange,
  unit,
  placeholder = "",
  hint,
}) {
  return (
    <label htmlFor={id} className="block">
      <span className="ds-text-secondary text-sm font-medium">{label}</span>
      <div className="mt-2 flex items-stretch gap-2">
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          enterKeyHint="done"
          className="input-pro flex-1 text-lg font-semibold tabular-nums min-h-[52px]"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          aria-describedby={hint ? `${id}-hint` : undefined}
        />
        {unit ? (
          <span className="inline-flex items-center justify-center min-w-[52px] px-3 rounded-[16px] bg-white/5 border border-white/10 ds-text-secondary text-sm font-medium">
            {unit}
          </span>
        ) : null}
      </div>
      {hint ? (
        <span id={`${id}-hint`} className="mt-1 block text-xs text-slate-500">
          {hint}
        </span>
      ) : null}
    </label>
  );
}

export function SegmentedControl({ label, value, options, onChange, name }) {
  return (
    <fieldset>
      <legend className="ds-text-secondary text-sm font-medium mb-2">
        {label}
      </legend>
      <div className="grid grid-cols-2 gap-2" role="group" aria-label={label}>
        {options.map((opt) => {
          const selected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              name={name}
              aria-pressed={selected}
              onClick={() => onChange(opt.value)}
              className={`min-h-[48px] rounded-[16px] px-3 text-sm font-semibold border transition-colors ${
                selected
                  ? "bg-yellow-400/20 border-yellow-400/50 text-yellow-200"
                  : "bg-white/5 border-white/10 text-slate-300"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export function UnitSelect({ id, label, value, options, onChange }) {
  return (
    <label htmlFor={id} className="block">
      <span className="ds-text-secondary text-sm font-medium">{label}</span>
      <select
        id={id}
        className="input-pro mt-2 min-h-[52px] text-base"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function RisultatoBox({ titolo = "Risultato", children, errore }) {
  if (errore) {
    return (
      <div
        className="pro-panel p-5 border border-rose-400/30 bg-rose-500/10"
        role="alert"
        data-testid="calcolo-errore"
      >
        <p className="ds-text-primary text-rose-200">{errore}</p>
      </div>
    );
  }
  return (
    <div
      className="pro-panel-strong p-5 border border-yellow-400/25"
      data-testid="calcolo-risultato"
    >
      <p className="section-label">{titolo}</p>
      <div className="mt-3 space-y-2">{children}</div>
    </div>
  );
}

export function FormulaBox({ formula, children }) {
  if (!formula && !children) return null;
  return (
    <div className="pro-panel p-4" data-testid="calcolo-formula">
      <p className="section-label">Formula utilizzata</p>
      {formula ? (
        <p className="ds-text-primary mt-2 font-mono text-sm">{formula}</p>
      ) : null}
      {children}
    </div>
  );
}

export function AvvisoBox({ children }) {
  if (!children) return null;
  return (
    <div
      className="rounded-[16px] border border-amber-400/25 bg-amber-400/10 p-4 text-sm text-amber-100/90 leading-relaxed"
      data-testid="calcolo-avviso"
    >
      {children}
    </div>
  );
}

export function CalcoloActions({ onCalcola, onReset, calcolaLabel = "Calcola" }) {
  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={onCalcola}
        className="btn-primary w-full min-h-[52px] text-base font-semibold"
        data-testid="calcolo-submit"
      >
        {calcolaLabel}
      </button>
      <button
        type="button"
        onClick={onReset}
        className="btn-secondary w-full min-h-[48px]"
        data-testid="calcolo-reset"
      >
        Nuovo calcolo
      </button>
    </div>
  );
}
