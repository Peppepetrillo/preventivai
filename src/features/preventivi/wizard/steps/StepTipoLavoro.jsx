import { Home, Sparkles, Wrench } from "lucide-react";

import { TIPO_LAVORO_OPZIONI } from "../wizardConfig";

const ICONE = {
  home: Home,
  wrench: Wrench,
  sparkles: Sparkles,
};

export default function StepTipoLavoro({ onSeleziona }) {
  return (
    <div className="px-4 py-2 space-y-3">
      <p className="text-slate-400 text-sm px-1">
        Scegli il tipo di lavoro. Potrai sempre modificare le voci dopo.
      </p>

      {TIPO_LAVORO_OPZIONI.map((opzione) => {
        const Icona = ICONE[opzione.icona] || Home;
        const isExpress = Boolean(opzione.percorsoExpress);

        return (
          <button
            key={opzione.id}
            type="button"
            onClick={() => onSeleziona(opzione.id)}
            className={`w-full text-left pro-panel p-4 active:scale-[0.99] transition hover:border-yellow-300/40 ${
              isExpress ? "border-yellow-300/30 bg-yellow-400/5" : ""
            }`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`w-12 h-12 rounded-[14px] flex items-center justify-center shrink-0 ${
                  isExpress
                    ? "bg-yellow-400 text-slate-950"
                    : "bg-white/10 text-yellow-200"
                }`}
              >
                <Icona size={22} />
              </div>

              <div className="min-w-0">
                <h2 className="text-lg font-black leading-tight">
                  {isExpress ? "✨ " : ""}
                  {opzione.titolo}
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  {opzione.descrizione}
                </p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
