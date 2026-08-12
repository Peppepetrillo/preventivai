import { useCallback, useReducer } from "react";

import {
  creaContestoPreventivo,
  aggiornaContestoPreventivo,
} from "../contesto/contestoPreventivoModel";
import {
  CONDIZIONI_DEFAULT,
  indiceStep,
  stepDaIndice,
  TIPO_LAVORO,
  TIPO_LAVORO_DEFAULT,
  WIZARD_STEPS,
} from "./wizardConfig";
import { leggiPrefillWizard } from "../utils/wizardExtensions";

export const WIZARD_AZIONI = {
  impostaTipoLavoro: "impostaTipoLavoro",
  selezionaCliente: "selezionaCliente",
  avanti: "avanti",
  indietro: "indietro",
  vaiAStep: "vaiAStep",
  aggiornaLavorazioni: "aggiornaLavorazioni",
  aggiornaCondizioni: "aggiornaCondizioni",
  aggiornaContesto: "aggiornaContesto",
  impostaExpressAutoOpen: "impostaExpressAutoOpen",
  impostaCliente: "impostaCliente",
  applicaPrefill: "applicaPrefill",
  reset: "reset",
};

function statoIniziale() {
  const prefill = leggiPrefillWizard();

  return {
    stepId: WIZARD_STEPS[0].id,
    tipoLavoro: prefill?.tipoLavoro || TIPO_LAVORO_DEFAULT,
    cliente: prefill?.cliente || "",
    lavorazioni: prefill?.lavorazioni || [],
    condizioni: {
      ...CONDIZIONI_DEFAULT,
      ...(prefill?.condizioni || {}),
    },
    contesto: creaContestoPreventivo(prefill?.contesto || {}),
    expressAutoOpen: Boolean(prefill?.expressAutoOpen),
    prefillSource: prefill?.source || null,
  };
}

function prossimoStepId(stepId) {
  const indice = indiceStep(stepId);
  return stepDaIndice(indice + 1).id;
}

function precedenteStepId(stepId) {
  const indice = indiceStep(stepId);
  return stepDaIndice(Math.max(indice - 1, 0)).id;
}

function wizardReducer(stato, azione) {
  switch (azione.type) {
    case WIZARD_AZIONI.impostaTipoLavoro: {
      const tipoLavoro = azione.payload;
      const isExpress = tipoLavoro === TIPO_LAVORO.express;

      return {
        ...stato,
        tipoLavoro,
        expressAutoOpen: isExpress ? stato.expressAutoOpen : false,
      };
    }

    case WIZARD_AZIONI.selezionaCliente:
      return {
        ...stato,
        cliente: azione.payload,
        stepId: prossimoStepId(stato.stepId),
      };

    case WIZARD_AZIONI.avanti:
      return {
        ...stato,
        stepId: prossimoStepId(stato.stepId),
      };

    case WIZARD_AZIONI.indietro:
      return {
        ...stato,
        stepId: precedenteStepId(stato.stepId),
      };

    case WIZARD_AZIONI.vaiAStep:
      return {
        ...stato,
        stepId: azione.payload,
      };

    case WIZARD_AZIONI.aggiornaLavorazioni:
      return {
        ...stato,
        lavorazioni:
          typeof azione.payload === "function"
            ? azione.payload(stato.lavorazioni)
            : azione.payload,
      };

    case WIZARD_AZIONI.aggiornaCondizioni:
      return {
        ...stato,
        condizioni: {
          ...stato.condizioni,
          ...azione.payload,
        },
      };

    case WIZARD_AZIONI.aggiornaContesto:
      return {
        ...stato,
        contesto: aggiornaContestoPreventivo(stato.contesto, azione.payload),
      };

    case WIZARD_AZIONI.impostaExpressAutoOpen:
      return {
        ...stato,
        expressAutoOpen: Boolean(azione.payload),
      };

    case WIZARD_AZIONI.impostaCliente:
      return {
        ...stato,
        cliente: azione.payload,
      };

    case WIZARD_AZIONI.applicaPrefill:
      return {
        ...stato,
        ...azione.payload,
        tipoLavoro: azione.payload?.tipoLavoro || stato.tipoLavoro || TIPO_LAVORO_DEFAULT,
        condizioni: {
          ...CONDIZIONI_DEFAULT,
          ...(azione.payload?.condizioni || {}),
        },
        contesto: creaContestoPreventivo(azione.payload?.contesto || {}),
      };

    case WIZARD_AZIONI.reset:
      return statoIniziale();

    default:
      return stato;
  }
}

export function useWizardPreventivoState() {
  const [stato, dispatch] = useReducer(wizardReducer, undefined, statoIniziale);

  const impostaTipoLavoro = useCallback((tipoLavoro) => {
    dispatch({ type: WIZARD_AZIONI.impostaTipoLavoro, payload: tipoLavoro });
  }, []);

  const selezionaCliente = useCallback((cliente) => {
    dispatch({ type: WIZARD_AZIONI.selezionaCliente, payload: cliente });
  }, []);

  const avanti = useCallback(() => {
    dispatch({ type: WIZARD_AZIONI.avanti });
  }, []);

  const indietro = useCallback(() => {
    dispatch({ type: WIZARD_AZIONI.indietro });
  }, []);

  const vaiAStep = useCallback((stepId) => {
    dispatch({ type: WIZARD_AZIONI.vaiAStep, payload: stepId });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: WIZARD_AZIONI.reset });
  }, []);

  const aggiornaLavorazioni = useCallback((lavorazioni) => {
    dispatch({ type: WIZARD_AZIONI.aggiornaLavorazioni, payload: lavorazioni });
  }, []);

  const impostaExpressAutoOpen = useCallback((valore) => {
    dispatch({
      type: WIZARD_AZIONI.impostaExpressAutoOpen,
      payload: valore,
    });
  }, []);

  const impostaCliente = useCallback((cliente) => {
    dispatch({ type: WIZARD_AZIONI.impostaCliente, payload: cliente });
  }, []);

  const aggiornaCondizioni = useCallback((condizioni) => {
    dispatch({ type: WIZARD_AZIONI.aggiornaCondizioni, payload: condizioni });
  }, []);

  const aggiornaContesto = useCallback((patch) => {
    dispatch({ type: WIZARD_AZIONI.aggiornaContesto, payload: patch });
  }, []);

  const indiceCorrente = indiceStep(stato.stepId);
  const puoAndareIndietro = indiceCorrente > 0;
  const puoAndareAvanti = indiceCorrente < WIZARD_STEPS.length - 1;
  const isPercorsoExpress = stato.tipoLavoro === TIPO_LAVORO.express;

  return {
    stato,
    dispatch,
    impostaTipoLavoro,
    selezionaCliente,
    avanti,
    indietro,
    vaiAStep,
    reset,
    aggiornaLavorazioni,
    impostaExpressAutoOpen,
    impostaCliente,
    aggiornaCondizioni,
    aggiornaContesto,
    indiceCorrente,
    puoAndareIndietro,
    puoAndareAvanti,
    isPercorsoExpress,
    totaleStep: WIZARD_STEPS.length,
  };
}
