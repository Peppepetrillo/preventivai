import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";

import { ROUTES } from "../../../app/routes";
import { leggiClienti } from "../../../repositories/clientiRepository";
import { useSalvaEGeneraPdf } from "../hooks/useSalvaEGeneraPdf";
import { useWizardContext } from "./useWizardContext";
import { useWizardPreventivoState } from "./useWizardPreventivoState";
import { WIZARD_STEPS, indiceStep } from "./wizardConfig";
import WizardHeader from "./components/WizardHeader";
import WizardProgress from "./components/WizardProgress";
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
  const clienteIdElaborato = useRef(false);
  const salvataggio = useSalvaEGeneraPdf();
  const {
    stato,
    selezionaCliente,
    avanti,
    indietro,
    vaiAStep,
    aggiornaLavorazioni,
    aggiornaCondizioni,
    aggiornaContesto,
    impostaExpressAutoOpen,
    impostaCliente,
    impostaTipoLavoro,
    totaleStep,
    reset,
  } = useWizardPreventivoState();

  const esitoSuccesso = Boolean(salvataggio.preventivoSalvato);
  const indiceCorrente = indiceStep(stato.stepId);
  const puoAndareIndietro = indiceCorrente > 0;
  const stepCorrente = WIZARD_STEPS[indiceCorrente] || WIZARD_STEPS[0];

  useEffect(() => {
    attivaWizard(stato.stepId);
    return () => disattivaWizard();
  }, [attivaWizard, disattivaWizard, stato.stepId]);

  useEffect(() => {
    const clienteId = searchParams.get("clienteId");
    if (!clienteId || clienteIdElaborato.current) return;

    const cliente = leggiClienti().find((item) => String(item.id) === clienteId);
    if (!cliente?.nome) return;

    clienteIdElaborato.current = true;
    impostaCliente(cliente.nome);
    vaiAStep("componi");
  }, [searchParams, impostaCliente, vaiAStep]);

  useEffect(() => {
    if (stato.stepId !== "conferma") {
      salvataggio.resetEsito();
    }
  }, [stato.stepId, salvataggio.resetEsito]);

  function gestisciIndietro() {
    if (esitoSuccesso) {
      salvataggio.resetEsito();
      reset();
      navigate(ROUTES.dashboard);
      return;
    }

    if (puoAndareIndietro) {
      indietro();
      return;
    }

    reset();
    navigate(ROUTES.dashboard);
  }

  function gestisciNuovoPreventivo() {
    salvataggio.resetEsito();
    reset();
  }

  function renderStep() {
    switch (stato.stepId) {
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
            onImpostaTipoLavoro={impostaTipoLavoro}
            onImpostaExpressAutoOpen={impostaExpressAutoOpen}
            onAvanti={avanti}
          />
        );

      case "conferma":
        return (
          <StepConferma
            stato={stato}
            inElaborazione={salvataggio.inElaborazione}
            pdfInCorso={salvataggio.pdfInCorso}
            errore={salvataggio.errore}
            avvisoPdf={salvataggio.avvisoPdf}
            preventivoSalvato={salvataggio.preventivoSalvato}
            pdfGenerato={salvataggio.pdfGenerato}
            pdfBlob={salvataggio.pdfBlob}
            pdfNomeFile={salvataggio.pdfNomeFile}
            onSalva={() => salvataggio.salvaEGeneraPdf(stato)}
            onRiprovaPdf={() => salvataggio.riprovaPdf(stato.condizioni)}
            onNuovoPreventivo={gestisciNuovoPreventivo}
            onModificaComposizione={indietro}
          />
        );

      default:
        return null;
    }
  }

  const sottotitolo =
    stato.stepId === "componi" && stato.cliente
      ? `${stato.cliente}`
      : undefined;

  const titoloHeader = esitoSuccesso ? "Creato" : stepCorrente.title;

  return (
    <div className="min-h-screen text-white pb-36">
      <WizardHeader
        title={titoloHeader}
        subtitle={sottotitolo}
        indiceCorrente={indiceCorrente}
        totaleStep={totaleStep}
        puoAndareIndietro={
          esitoSuccesso ||
          puoAndareIndietro ||
          stato.stepId === "cliente"
        }
        onIndietro={gestisciIndietro}
      />

      {!esitoSuccesso ? <WizardProgress stepId={stato.stepId} /> : null}

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
