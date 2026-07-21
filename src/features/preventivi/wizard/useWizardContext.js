import { useContext } from "react";

import { WizardContext } from "./wizardContextInstance";

export function useWizardContext() {
  const contesto = useContext(WizardContext);

  if (!contesto) {
    throw new Error("useWizardContext deve essere usato dentro WizardProvider");
  }

  return contesto;
}
