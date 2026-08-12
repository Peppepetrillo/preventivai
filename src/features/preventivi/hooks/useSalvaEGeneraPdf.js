import { useCallback, useRef, useState } from "react";

import { leggiDatiAzienda } from "../../../repositories/impostazioniRepository";
import {
  aggiornaPreventivo,
  leggiPreventivi,
  salvaNuovoPreventivo,
} from "../../../repositories/preventiviRepository";
import { generaPdfPreventivo } from "../../../services/preventiviPdfService";
import { calcolaTotali } from "../../../utils/preventivi";
import { creaPreventivo, preparaDatiPreventivo } from "../preventiviDomain";
import { salvaUltimoPreventivo } from "../utils/wizardExtensions";

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
    lavorazioni: statoWizard.lavorazioni,
    condizioni: statoWizard.condizioni,
  });
}

export function useSalvaEGeneraPdf() {
  const [inElaborazione, setInElaborazione] = useState(false);
  const [errore, setErrore] = useState("");
  const [avvisoPdf, setAvvisoPdf] = useState("");
  const [preventivoSalvato, setPreventivoSalvato] = useState(null);
  const [pdfGenerato, setPdfGenerato] = useState(false);
  const idSalvatoRef = useRef(null);

  const resetEsito = useCallback(() => {
    idSalvatoRef.current = null;
    setPreventivoSalvato(null);
    setPdfGenerato(false);
    setErrore("");
    setAvvisoPdf("");
  }, []);

  const salvaPreventivo = useCallback(async (statoWizard) => {
    const messaggio = validaStatoWizard(statoWizard);
    if (messaggio) {
      setErrore(messaggio);
      return null;
    }

    const { cliente, tipoLavoro, lavorazioni, condizioni } = statoWizard;
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
          stato: esistente.stato || "Bozza",
          lavorazioni,
          sconto: condizioni.sconto,
          iva: condizioni.iva,
          validita: condizioni.validita,
          pagamento: condizioni.pagamento,
          acconto: condizioni.acconto,
          note: condizioni.note,
          tipoLavoro,
        });
        aggiornaPreventivo(idEsistente, () => preventivo);
      }
    }

    if (!preventivo) {
      preventivo = creaPreventivo({
        archivio,
        cliente: cliente.trim(),
        lavorazioni,
        sconto: condizioni.sconto,
        iva: condizioni.iva,
        validita: condizioni.validita,
        pagamento: condizioni.pagamento,
        acconto: condizioni.acconto,
        note: condizioni.note,
        tipoLavoro,
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

    await generaPdfPreventivo({
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
    });

    setPdfGenerato(true);
    setAvvisoPdf("");
    return true;
  }, []);

  const salvaEGeneraPdf = useCallback(
    async (statoWizard) => {
      setInElaborazione(true);
      setErrore("");
      setAvvisoPdf("");

      try {
        const preventivo = await salvaPreventivo(statoWizard);
        if (!preventivo) return null;

        try {
          await generaPdf(preventivo, statoWizard.condizioni);
        } catch {
          setAvvisoPdf(
            "Preventivo salvato come bozza. PDF non generato. Puoi riprovare."
          );
          setPdfGenerato(false);
        }

        return preventivo;
      } catch {
        setErrore("Non è stato possibile salvare il preventivo. Riprova.");
        return null;
      } finally {
        setInElaborazione(false);
      }
    },
    [generaPdf, salvaPreventivo]
  );

  const riprovaPdf = useCallback(
    async (condizioni) => {
      if (!preventivoSalvato) return false;

      setInElaborazione(true);
      setAvvisoPdf("");

      try {
        await generaPdf(preventivoSalvato, condizioni);
        return true;
      } catch {
        setAvvisoPdf(
          "Preventivo salvato come bozza. PDF non generato. Puoi riprovare."
        );
        setPdfGenerato(false);
        return false;
      } finally {
        setInElaborazione(false);
      }
    },
    [generaPdf, preventivoSalvato]
  );

  return {
    inElaborazione,
    errore,
    avvisoPdf,
    preventivoSalvato,
    pdfGenerato,
    salvaPreventivo,
    generaPdf,
    salvaEGeneraPdf,
    riprovaPdf,
    resetEsito,
  };
}
