import { memo } from "react";

import {
  TIPO_LAVORO,
  TIPO_LAVORO_DEFAULT,
  TIPO_LAVORO_OPZIONI_SEGMENTO,
} from "../wizardConfig";

function TipoLavoroSelector({ tipoLavoro, onSeleziona }) {
  const selezione =
    tipoLavoro === TIPO_LAVORO.express ? TIPO_LAVORO_DEFAULT : tipoLavoro;

  return (
    <div
      className="flex gap-2"
      role="group"
      aria-label="Tipo lavoro"
      data-testid="tipo-lavoro-selector"
    >
      {TIPO_LAVORO_OPZIONI_SEGMENTO.map((opzione) => {
        const attivo = selezione === opzione.id;

        return (
          <button
            key={opzione.id}
            type="button"
            onClick={() => onSeleziona(opzione.id)}
            aria-pressed={attivo}
            className={`flex-1 min-h-[44px] px-3 py-2 rounded-[16px] text-sm font-semibold transition ${
              attivo
                ? "bg-yellow-400 text-slate-950"
                : "bg-white/8 text-slate-300 border border-white/10"
            }`}
          >
            {opzione.titolo}
          </button>
        );
      })}
    </div>
  );
}

export default memo(TipoLavoroSelector);
