import { memo } from "react";
import { ArrowLeft } from "lucide-react";

function WizardHeader({
  title,
  subtitle,
  indiceCorrente,
  totaleStep,
  puoAndareIndietro,
  onIndietro,
}) {
  return (
    <header className="sticky top-0 z-30 bg-slate-950/[0.94] backdrop-blur-xl border-b border-white/10 safe-top">
      <div className="px-4 pt-4 pb-3 flex items-start gap-3">
        {puoAndareIndietro ? (
          <button
            type="button"
            onClick={onIndietro}
            className="w-11 h-11 rounded-[14px] bg-white/8 text-white flex items-center justify-center shrink-0"
            aria-label="Torna al passo precedente"
          >
            <ArrowLeft size={20} />
          </button>
        ) : (
          <div className="w-11 shrink-0" aria-hidden="true" />
        )}

        <div className="min-w-0 flex-1">
          <p className="section-label">
            Nuovo preventivo · {indiceCorrente + 1}/{totaleStep}
          </p>
          <h1 className="text-2xl font-black tracking-tight truncate">{title}</h1>
          {subtitle ? (
            <p className="text-sm text-slate-400 mt-0.5 truncate">{subtitle}</p>
          ) : null}
        </div>
      </div>
    </header>
  );
}

export default memo(WizardHeader);
