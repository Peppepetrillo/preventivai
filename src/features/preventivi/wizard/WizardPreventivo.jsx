import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";

import { ROUTES } from "../../../app/routes";
import ConfirmDialog from "../../../components/ConfirmDialog";
import { setNavigazioneIndietroHandler } from "../../../navigation/navigateBack";
import { leggiClienti } from "../../../repositories/clientiRepository";
import { leggiCantieri } from "../../../repositories/cantieriRepository";
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

/**
 * True se la bozza ha contenuto che andrebbe perso uscendo.
 * @param {object} stato
 */
export function wizardBozzaHaDati(stato = {}) {
  if (String(stato.cliente || "").trim()) return true;
  if ((stato.lavorazioni || []).length > 0) return true;
  if (String(stato.condizioni?.note || "").trim()) return true;
  return false;
}

export default function WizardPreventivo() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { attivaWizard, disattivaWizard } = useWizardContext();
  const clienteIdElaborato = useRef(false);
  const [confermaUscita, setConfermaUscita] = useState(false);
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
    impostaTipologiaImpianto,
    totaleStep,
    reset,
  } = useWizardPreventivoState();

  const esitoSuccesso = Boolean(salvataggio.preventivoSalvato);
  const indiceCorrente = indiceStep(stato.stepId);
  const puoAndareIndietro = indiceCorrente > 0;
  const stepCorrente = WIZARD_STEPS[indiceCorrente] || WIZARD_STEPS[0];

  const esciDalWizard = useCallback(() => {
    salvataggio.resetEsito();
    reset();
    setConfermaUscita(false);
    navigate(ROUTES.preventivi);
  }, [navigate, reset, salvataggio]);

  const gestisciIndietro = useCallback(() => {
    if (esitoSuccesso) {
      esciDalWizard();
      return;
    }

    if (puoAndareIndietro) {
      indietro();
      return;
    }

    if (wizardBozzaHaDati(stato)) {
      setConfermaUscita(true);
      return;
    }

    esciDalWizard();
  }, [esciDalWizard, esitoSuccesso, indietro, puoAndareIndietro, stato]);

  useEffect(() => {
    attivaWizard(stato.stepId);
    return () => disattivaWizard();
  }, [attivaWizard, disattivaWizard, stato.stepId]);

  useEffect(() => {
    setNavigazioneIndietroHandler(() => {
      gestisciIndietro();
    });
    return () => setNavigazioneIndietroHandler(null);
  }, [gestisciIndietro]);

  useEffect(() => {
    const clienteId = searchParams.get("clienteId");
    const cantiereId = searchParams.get("cantiereId");
    const clienteNome = searchParams.get("cliente");
    if (clienteIdElaborato.current) return;

    if (clienteId) {
      const cliente = leggiClienti().find((item) => String(item.id) === clienteId);
      if (cliente?.nome) {
        clienteIdElaborato.current = true;
        impostaCliente({ nome: cliente.nome, id: cliente.id });
        vaiAStep("componi");
        return;
      }
    }

    if (cantiereId) {
      const cantiere = leggiCantieri().find(
        (item) => String(item.id) === String(cantiereId)
      );
      const nome =
        String(cantiere?.cliente || clienteNome || "").trim() || "";
      if (nome) {
        clienteIdElaborato.current = true;
        impostaCliente({
          nome,
          id: cantiere?.clienteId ?? null,
        });
        vaiAStep("componi");
        return;
      }
    }

    if (clienteNome?.trim()) {
      clienteIdElaborato.current = true;
      impostaCliente({ nome: clienteNome.trim(), id: null });
      vaiAStep("componi");
    }
  }, [searchParams, impostaCliente, vaiAStep]);

  useEffect(() => {
    if (stato.stepId !== "conferma") {
      salvataggio.resetEsito();
    }
    // salvataggio: oggetto hook; resetEsito è stabile a sufficienza per lo step corrente
  }, [stato.stepId, salvataggio]);

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
            tipologiaImpianto={stato.tipologiaImpianto}
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
            onImpostaTipologiaImpianto={impostaTipologiaImpianto}
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
            onSalva={() =>
              salvataggio.salvaEGeneraPdf({
                ...stato,
                cantiereId: searchParams.get("cantiereId") || null,
              })
            }
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

      <ConfirmDialog
        open={confermaUscita}
        title="Vuoi uscire?"
        description="La bozza non salvata andrà persa."
        confirmLabel="Esci"
        cancelLabel="Continua"
        danger
        onConfirm={esciDalWizard}
        onCancel={() => setConfermaUscita(false)}
        testId="wizard-conferma-uscita"
      />
    </div>
  );
}
