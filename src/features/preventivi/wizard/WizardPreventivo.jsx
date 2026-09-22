import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";

import { ROUTES } from "../../../app/routes";
import ConfirmDialog from "../../../components/ConfirmDialog";
import { leggiClienti } from "../../../repositories/clientiRepository";
import {
  eseguiNavigazioneIndietro,
  setGuardiaNavigazioneIndietro,
} from "../../../navigation/navigateBack";
import { useSalvaEGeneraPdf } from "../hooks/useSalvaEGeneraPdf";
import { useWizardContext } from "./useWizardContext";
import { useWizardPreventivoState } from "./useWizardPreventivoState";
import { wizardHaBozzaConDati } from "./wizardBozza";
import { TIPO_LAVORO, WIZARD_STEPS, indiceStep } from "./wizardConfig";
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
  const expressElaborato = useRef(false);
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
  const [confermaUscitaAperta, setConfermaUscitaAperta] = useState(false);
  /** @type {React.MutableRefObject<{ tipo: 'path'|'indietro', path?: string }|null>} */
  const pendingUscitaRef = useRef(null);
  const bozzaSporca = !esitoSuccesso && wizardHaBozzaConDati(stato);
  const puoAndareIndietroRef = useRef(puoAndareIndietro);
  const indietroRef = useRef(indietro);
  const bozzaSporcaRef = useRef(bozzaSporca);
  puoAndareIndietroRef.current = puoAndareIndietro;
  indietroRef.current = indietro;
  bozzaSporcaRef.current = bozzaSporca;

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
    impostaCliente({ nome: cliente.nome, id: cliente.id });
    vaiAStep("componi");
  }, [searchParams, impostaCliente, vaiAStep]);

  /** Quick quote: /preventivi/nuovo?express=1 apre Preventivo vocale. */
  useEffect(() => {
    const express =
      searchParams.get("express") === "1" ||
      searchParams.get("vocale") === "1";
    if (!express || expressElaborato.current) return;

    expressElaborato.current = true;
    impostaTipoLavoro(TIPO_LAVORO.express);
    impostaExpressAutoOpen(true);
    if (stato.cliente || searchParams.get("clienteId")) {
      vaiAStep("componi");
    }
  }, [
    searchParams,
    impostaTipoLavoro,
    impostaExpressAutoOpen,
    vaiAStep,
    stato.cliente,
  ]);

  useEffect(() => {
    if (stato.stepId !== "conferma") {
      salvataggio.resetEsito();
    }
    // salvataggio: oggetto hook; resetEsito è stabile a sufficienza per lo step corrente
  }, [stato.stepId, salvataggio]);

  useEffect(() => {
    setGuardiaNavigazioneIndietro(({ opzioni } = {}) => {
      // Edge/Android: allinea al pulsante header — step indietro prima di uscire.
      if (puoAndareIndietroRef.current) {
        indietroRef.current();
        return { blocca: true };
      }
      if (!bozzaSporcaRef.current) {
        return undefined;
      }
      pendingUscitaRef.current = opzioni?.destinazioneEsplicita
        ? { tipo: "path", path: String(opzioni.destinazioneEsplicita) }
        : { tipo: "indietro" };
      setConfermaUscitaAperta(true);
      return { blocca: true };
    });

    return () => setGuardiaNavigazioneIndietro(null);
  }, [stato.stepId, bozzaSporca]);

  function esciDalWizard(destinazione = ROUTES.preventivi) {
    setConfermaUscitaAperta(false);
    pendingUscitaRef.current = null;
    setGuardiaNavigazioneIndietro(null);
    salvataggio.resetEsito();
    reset();
    navigate(destinazione);
  }

  function confermaUscitaWizard() {
    const pending = pendingUscitaRef.current;
    pendingUscitaRef.current = null;
    setConfermaUscitaAperta(false);
    setGuardiaNavigazioneIndietro(null);
    salvataggio.resetEsito();
    reset();
    if (pending?.tipo === "path" && pending.path) {
      navigate(pending.path);
      return;
    }
    // Completa Back/edge/Android senza riattivare la guardia
    eseguiNavigazioneIndietro(navigate, ROUTES.nuovoPreventivo, {
      forceParent: true,
    });
  }

  function gestisciIndietro() {
    if (esitoSuccesso) {
      esciDalWizard(ROUTES.preventivi);
      return;
    }

    if (puoAndareIndietro) {
      indietro();
      return;
    }

    if (bozzaSporca) {
      pendingUscitaRef.current = { tipo: "path", path: ROUTES.preventivi };
      setConfermaUscitaAperta(true);
      return;
    }

    esciDalWizard(ROUTES.preventivi);
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

      <ConfirmDialog
        open={confermaUscitaAperta}
        title="Uscire dal preventivo?"
        description="Hai una bozza con dati non salvati. Se esci, andranno persi."
        confirmLabel="Esci"
        cancelLabel="Resta"
        danger
        testId="wizard-conferma-uscita"
        onCancel={() => {
          pendingUscitaRef.current = null;
          setConfermaUscitaAperta(false);
        }}
        onConfirm={confermaUscitaWizard}
      />
    </div>
  );
}
