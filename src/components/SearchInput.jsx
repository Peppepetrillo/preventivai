import { Search } from "lucide-react";
import { useId } from "react";

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
          className={`w-full h-11 rounded-[14px] bg-slate-950/50 border border-white/10 pl-11 pr-4 outline-none focus:border-yellow-300/50 ${inputClassName}`}
        />
      </div>
    </div>
  );
}
