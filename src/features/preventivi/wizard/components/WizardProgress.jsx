import { memo } from "react";

import { WIZARD_STEPS } from "../wizardConfig";

function WizardProgress({ stepId }) {
  const indiceAttivo = WIZARD_STEPS.findIndex((step) => step.id === stepId);

  return (
    <div
      className="px-4 pb-4 flex items-center justify-center gap-2"
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={WIZARD_STEPS.length}
      aria-valuenow={indiceAttivo + 1}
      aria-label={`Passo ${indiceAttivo + 1} di ${WIZARD_STEPS.length}`}
    >
      {WIZARD_STEPS.map((step, indice) => {
        const attivo = indice === indiceAttivo;
        const completato = indice < indiceAttivo;

        return (
          <span
            key={step.id}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              attivo
                ? "w-8 bg-yellow-400"
                : completato
                  ? "w-4 bg-yellow-400/55"
                  : "w-4 bg-white/15"
            }`}
            aria-hidden="true"
          />
        );
      })}
    </div>
  );
}

export default memo(WizardProgress);
