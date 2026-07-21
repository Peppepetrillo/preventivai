import { useCallback, useState } from "react";

import { leggiDatiAzienda } from "../../../repositories/impostazioniRepository";
import {
  leggiPreventivi,
  salvaNuovoPreventivo,
} from "../../../repositories/preventiviRepository";
import { generaPdfPreventivo } from "../../../services/preventiviPdfService";
import { calcolaTotali } from "../../../utils/preventivi";
import { creaPreventivo } from "../preventiviDomain";
import { salvaUltimoPreventivo } from "../utils/wizardExtensions";

export function useSalvaEGeneraPdf() {
  const [inElaborazione, setInElaborazione] = useState(false);
  const [errore, setErrore] = useState("");
  const [preventivoSalvato, setPreventivoSalvato] = useState(null);

  const salvaEGeneraPdf = useCallback(async (statoWizard) => {
    const { cliente, tipoLavoro, lavorazioni, condizioni } = statoWizard;

    if (!cliente?.trim()) {
      setErrore("Seleziona un cliente prima di generare il PDF.");
      return null;
    }

    if (!lavorazioni?.length) {
      setErrore("Aggiungi almeno una lavorazione al preventivo.");
      return null;
    }

    setInElaborazione(true);
    setErrore("");

    try {
      const archivio = leggiPreventivi();
      const preventivo = creaPreventivo({
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

      const totali = calcolaTotali(
        lavorazioni,
        condizioni.sconto,
        condizioni.iva
      );

      const datiAzienda = leggiDatiAzienda();

      await generaPdfPreventivo({
        preventivo,
        datiAzienda,
        cliente: preventivo.cliente,
        stato: preventivo.stato,
        lavorazioni,
        validita: condizioni.validita,
        pagamento: condizioni.pagamento,
        note: condizioni.note,
        sconto: condizioni.sconto,
        iva: condizioni.iva,
        acconto: condizioni.acconto,
        totali,
      });

      salvaUltimoPreventivo({
        cliente: preventivo.cliente,
        tipoLavoro,
        lavorazioni,
        condizioni,
      });

      setPreventivoSalvato(preventivo);
      return preventivo;
    } catch {
      setErrore("Non è stato possibile salvare o generare il PDF. Riprova.");
      return null;
    } finally {
      setInElaborazione(false);
    }
  }, []);

  const resetEsito = useCallback(() => {
    setPreventivoSalvato(null);
    setErrore("");
  }, []);

  return {
    inElaborazione,
    errore,
    preventivoSalvato,
    salvaEGeneraPdf,
    resetEsito,
  };
}
