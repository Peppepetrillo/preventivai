import { useCallback, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";

import { leggiDatiAzienda } from "../../../repositories/impostazioniRepository";
import {
  aggiornaPreventivo,
  leggiPreventivi,
  salvaNuovoPreventivo,
} from "../../../repositories/preventiviRepository";
import { generaPdfPreventivo } from "../../../services/preventiviPdfService";
import { calcolaTotali } from "../../../utils/preventivi";
import { creaPreventivo, preparaDatiPreventivo } from "../preventiviDomain";
import { oggettoPdfTipologia } from "../tipologiaImpiantoUtils";
import { salvaUltimoPreventivo } from "../utils/wizardExtensions";

const AVVISO_PDF =
  "Preventivo salvato come bozza. PDF non generato. Puoi riprovare.";

function validaStatoWizard(statoWizard) {
  const { cliente, lavorazioni } = statoWizard || {};

  if (!cliente?.trim()) {
    return "Seleziona un cliente prima di salvare.";
  }

  if (!lavorazioni?.length) {
    return "Aggiungi almeno una lavorazione al preventivo.";
  }

  return "";
}

function snapshotUltimo(preventivo, statoWizard) {
  salvaUltimoPreventivo({
    cliente: preventivo.cliente,
    tipoLavoro: statoWizard.tipoLavoro,
    tipologiaImpianto: statoWizard.tipologiaImpianto,
    lavorazioni: statoWizard.lavorazioni,
    condizioni: statoWizard.condizioni,
  });
}

function deveScaricarePdfAutomatico() {
  try {
    return !Capacitor.isNativePlatform();
  } catch {
    return true;
  }
}

export function useSalvaEGeneraPdf() {
  const [inElaborazione, setInElaborazione] = useState(false);
  const [pdfInCorso, setPdfInCorso] = useState(false);
  const [errore, setErrore] = useState("");
  const [avvisoPdf, setAvvisoPdf] = useState("");
  const [preventivoSalvato, setPreventivoSalvato] = useState(null);
  const [pdfGenerato, setPdfGenerato] = useState(false);
  const [pdfBlob, setPdfBlob] = useState(null);
  const [pdfNomeFile, setPdfNomeFile] = useState("");
  const idSalvatoRef = useRef(null);
  const pdfRunIdRef = useRef(0);

  const resetEsito = useCallback(() => {
    pdfRunIdRef.current += 1;
    idSalvatoRef.current = null;
    setPreventivoSalvato(null);
    setPdfGenerato(false);
    setPdfBlob(null);
    setPdfNomeFile("");
    setErrore("");
    setAvvisoPdf("");
    setPdfInCorso(false);
    setInElaborazione(false);
  }, []);

  const salvaPreventivo = useCallback(async (statoWizard) => {
    const messaggio = validaStatoWizard(statoWizard);
    if (messaggio) {
      setErrore(messaggio);
      return null;
    }

    const { cliente, clienteId, tipoLavoro, tipologiaImpianto, lavorazioni, condizioni } =
      statoWizard;
    setErrore("");

    const archivio = leggiPreventivi();
    const idEsistente = idSalvatoRef.current;

    let preventivo;

    if (idEsistente) {
      const esistente = archivio.find(
        (item) => String(item.id) === String(idEsistente)
      );

      if (esistente) {
        preventivo = preparaDatiPreventivo({
          preventivo: esistente,
          cliente: cliente.trim(),
          clienteId: clienteId ?? esistente.clienteId,
          stato: esistente.stato || "Bozza",
          lavorazioni,
          sconto: condizioni.sconto,
          iva: condizioni.iva,
          validita: condizioni.validita,
          pagamento: condizioni.pagamento,
          acconto: condizioni.acconto,
          note: condizioni.note,
          tipoLavoro,
          tipologiaImpianto,
        });
        aggiornaPreventivo(idEsistente, () => preventivo);
      }
    }

    if (!preventivo) {
      preventivo = creaPreventivo({
        archivio,
        cliente: cliente.trim(),
        clienteId,
        lavorazioni,
        sconto: condizioni.sconto,
        iva: condizioni.iva,
        validita: condizioni.validita,
        pagamento: condizioni.pagamento,
        acconto: condizioni.acconto,
        note: condizioni.note,
        tipoLavoro,
        tipologiaImpianto,
      });
      salvaNuovoPreventivo(preventivo);
      idSalvatoRef.current = preventivo.id;
    }

    snapshotUltimo(preventivo, statoWizard);
    setPreventivoSalvato(preventivo);
    return preventivo;
  }, []);

  const generaPdf = useCallback(async (preventivo, condizioni) => {
    if (!preventivo) {
      setAvvisoPdf("Salva il preventivo prima di generare il PDF.");
      return false;
    }

    const totali = calcolaTotali(
      preventivo.lavorazioni,
      condizioni.sconto,
      condizioni.iva
    );
    const datiAzienda = leggiDatiAzienda();

    const esito = await generaPdfPreventivo({
      preventivo,
      datiAzienda,
      cliente: preventivo.cliente,
      stato: preventivo.stato,
      lavorazioni: preventivo.lavorazioni,
      validita: condizioni.validita,
      pagamento: condizioni.pagamento,
      note: condizioni.note,
      sconto: condizioni.sconto,
      iva: condizioni.iva,
      acconto: condizioni.acconto,
      totali,
      oggetto: oggettoPdfTipologia(preventivo),
      // Su Capacitor doc.save() può restare pending: non bloccare il wizard.
      salva: deveScaricarePdfAutomatico(),
    });

    if (esito?.blob) {
      setPdfBlob(esito.blob);
      setPdfNomeFile(esito.nomeFile || "");
    }

    setPdfGenerato(true);
    setAvvisoPdf("");
    return true;
  }, []);

  const avviaPdfInBackground = useCallback(
    (preventivo, condizioni) => {
      const runId = ++pdfRunIdRef.current;
      setPdfInCorso(true);
      setAvvisoPdf("");

      void (async () => {
        try {
          await generaPdf(preventivo, condizioni);
        } catch {
          if (runId !== pdfRunIdRef.current) return;
          setAvvisoPdf(AVVISO_PDF);
          setPdfGenerato(false);
          setPdfBlob(null);
          setPdfNomeFile("");
        } finally {
          if (runId === pdfRunIdRef.current) {
            setPdfInCorso(false);
          }
        }
      })();
    },
    [generaPdf]
  );

  const salvaEGeneraPdf = useCallback(
    async (statoWizard) => {
      setInElaborazione(true);
      setErrore("");
      setAvvisoPdf("");

      try {
        const preventivo = await salvaPreventivo(statoWizard);
        if (!preventivo) return null;

        // Successo UI immediato: il PDF non deve bloccare né nascondere lo stato.
        setInElaborazione(false);
        avviaPdfInBackground(preventivo, statoWizard.condizioni);
        return preventivo;
      } catch {
        setErrore("Non è stato possibile salvare il preventivo. Riprova.");
        return null;
      } finally {
        setInElaborazione(false);
      }
    },
    [avviaPdfInBackground, salvaPreventivo]
  );

  const riprovaPdf = useCallback(
    async (condizioni) => {
      if (!preventivoSalvato) return false;

      setPdfInCorso(true);
      setAvvisoPdf("");

      try {
        await generaPdf(preventivoSalvato, condizioni);
        return true;
      } catch {
        setAvvisoPdf(AVVISO_PDF);
        setPdfGenerato(false);
        setPdfBlob(null);
        setPdfNomeFile("");
        return false;
      } finally {
        setPdfInCorso(false);
      }
    },
    [generaPdf, preventivoSalvato]
  );

  return {
    inElaborazione,
    pdfInCorso,
    errore,
    avvisoPdf,
    preventivoSalvato,
    pdfGenerato,
    pdfBlob,
    pdfNomeFile,
    salvaPreventivo,
    generaPdf,
    salvaEGeneraPdf,
    riprovaPdf,
    resetEsito,
  };
}
