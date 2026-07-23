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
    <header className="sticky z-30 bg-slate-950/[0.94] backdrop-blur-xl border-b border-white/10 safe-top top-0">
      <div className="px-4 pt-3 pb-3 flex items-start gap-3">
        {puoAndareIndietro ? (
          <button
            type="button"
            onClick={onIndietro}
            className="w-11 h-11 rounded-[16px] bg-white/8 text-white flex items-center justify-center shrink-0"
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
          <h1 className="ds-page-title truncate">{title}</h1>
          {subtitle ? (
            <p className="ds-text-secondary mt-0.5 truncate">{subtitle}</p>
          ) : null}
        </div>
      </div>
    </header>
  );
}

export default memo(WizardHeader);
