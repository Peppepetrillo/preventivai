import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";

import { ROUTES } from "../../../app/routes";
import { leggiClienti } from "../../../repositories/clientiRepository";
import { useWizardContext } from "./useWizardContext";
import { useWizardPreventivoState } from "./useWizardPreventivoState";
import { WIZARD_STEPS, indiceStep } from "./wizardConfig";
import WizardHeader from "./components/WizardHeader";
import WizardProgress from "./components/WizardProgress";
import StepTipoLavoro from "./steps/StepTipoLavoro";
import StepCliente from "./steps/StepCliente";
import StepComponi from "./steps/StepComponi";
import StepConferma from "./steps/StepConferma";

const VARIANTI_STEP = {
  iniziale: { opacity: 0, x: 24 },
  animato: { opacity: 1, x: 0 },
  uscita: { opacity: 0, x: -24 },
};

export default function WizardPreventivo() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { attivaWizard, disattivaWizard } = useWizardContext();
  const {
    stato,
    selezionaTipoLavoro,
    selezionaCliente,
    avanti,
    indietro,
    aggiornaLavorazioni,
    aggiornaCondizioni,
    aggiornaContesto,
    impostaExpressAutoOpen,
    impostaCliente,
    totaleStep,
    reset,
  } = useWizardPreventivoState();

  const indiceCorrente = indiceStep(stato.stepId);
  const puoAndareIndietro = indiceCorrente > 0;
  const stepCorrente = WIZARD_STEPS[indiceCorrente] || WIZARD_STEPS[0];

  useEffect(() => {
    attivaWizard(stato.stepId);
    return () => disattivaWizard();
  }, [attivaWizard, disattivaWizard, stato.stepId]);

  useEffect(() => {
    const clienteId = searchParams.get("clienteId");
    if (!clienteId || stato.cliente) return;

    const cliente = leggiClienti().find((item) => String(item.id) === clienteId);
    if (cliente?.nome) {
      impostaCliente(cliente.nome);
    }
  }, [searchParams, stato.cliente, impostaCliente]);

  function gestisciIndietro() {
    if (puoAndareIndietro) {
      indietro();
      return;
    }

    reset();
    navigate(ROUTES.dashboard);
  }

  function renderStep() {
    switch (stato.stepId) {
      case "tipo-lavoro":
        return <StepTipoLavoro onSeleziona={selezionaTipoLavoro} />;

      case "cliente":
        return <StepCliente onSelezionaCliente={selezionaCliente} />;

      case "componi":
        return (
          <StepComponi
            tipoLavoro={stato.tipoLavoro}
            cliente={stato.cliente}
            expressAutoOpen={stato.expressAutoOpen}
            lavorazioni={stato.lavorazioni}
            condizioni={stato.condizioni}
            contesto={stato.contesto}
            onAggiornaLavorazioni={aggiornaLavorazioni}
            onAggiornaCondizioni={aggiornaCondizioni}
            onAggiornaContesto={aggiornaContesto}
            onImpostaCliente={impostaCliente}
            onImpostaExpressAutoOpen={impostaExpressAutoOpen}
            onAvanti={avanti}
          />
        );

      case "conferma":
        return (
          <StepConferma stato={stato} onNuovoPreventivo={reset} />
        );

      default:
        return null;
    }
  }

  const sottotitolo =
    stato.stepId === "componi" && stato.cliente
      ? `${stato.cliente}`
      : undefined;

  return (
    <div className="min-h-screen text-white pb-36">
      <WizardHeader
        title={stepCorrente.title}
        subtitle={sottotitolo}
        indiceCorrente={indiceCorrente}
        totaleStep={totaleStep}
        puoAndareIndietro={puoAndareIndietro || stato.stepId === "tipo-lavoro"}
        onIndietro={gestisciIndietro}
      />

      <WizardProgress stepId={stato.stepId} />

      <AnimatePresence mode="wait">
        <motion.div
          key={stato.stepId}
          initial="iniziale"
          animate="animato"
          exit="uscita"
          variants={VARIANTI_STEP}
          transition={{ duration: 0.22, ease: "easeOut" }}
        >
          {renderStep()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
