import { useCallback, useMemo, useState } from "react";

import { WIZARD_STEPS } from "./wizardConfig";
import { WizardContext } from "./wizardContextInstance";

export function WizardProvider({ children }) {
  const [attivo, setAttivo] = useState(false);
  const [stepCorrente, setStepCorrente] = useState(WIZARD_STEPS[0].id);

  const attivaWizard = useCallback((stepId = WIZARD_STEPS[0].id) => {
    setAttivo(true);
    setStepCorrente(stepId);
  }, []);

  const disattivaWizard = useCallback(() => {
    setAttivo(false);
    setStepCorrente(WIZARD_STEPS[0].id);
  }, []);

  const aggiornaStepWizard = useCallback((stepId) => {
    setStepCorrente(stepId);
  }, []);

  const valore = useMemo(
    () => ({
      attivo,
      stepCorrente,
      attivaWizard,
      disattivaWizard,
      aggiornaStepWizard,
      totaleStep: WIZARD_STEPS.length,
    }),
    [attivo, stepCorrente, attivaWizard, disattivaWizard, aggiornaStepWizard]
  );

  return (
    <WizardContext.Provider value={valore}>{children}</WizardContext.Provider>
  );
}
