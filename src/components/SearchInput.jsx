import { Search } from "lucide-react";
import { useId } from "react";

/**
 * Ricerca unica Design System v1.0 — sempre stessa altezza/radius/animazione.
 */
export default function SearchInput({
  value,
  onChange,
  label,
  placeholder,
  className = "",
  inputClassName = "",
  id,
}) {
  const idGenerato = useId();
  const inputId = id || idGenerato;

  return (
    <div className={className}>
      <label htmlFor={inputId} className="sr-only">
        {label}
      </label>
      <div className="relative">
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-yellow-300 pointer-events-none"
          aria-hidden="true"
        />
        <input
          id={inputId}
          type="search"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          aria-label={label}
          className={`ds-search ${inputClassName}`.trim()}
        />
      </div>
    </div>
  );
}
