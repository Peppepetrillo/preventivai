import { useCallback, useEffect, useState } from "react";

import { generaPdfReportCantiere } from "../../../services/cantiereReportPdfService";

export function useCantiereReport(cantiere, datiAzienda) {
  const [blobUrl, setBlobUrl] = useState("");
  const [pdfBlob, setPdfBlob] = useState(null);
  const [nomeFile, setNomeFile] = useState("");
  const [inElaborazione, setInElaborazione] = useState(false);
  const [anteprimaAperta, setAnteprimaAperta] = useState(false);

  useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [blobUrl]);

  const genera = useCallback(
    async ({ salva = false, apriAnteprima = false } = {}) => {
      if (!cantiere) return null;
      setInElaborazione(true);
      try {
        const risultato = await generaPdfReportCantiere({
          cantiere,
          datiAzienda,
          salva,
        });
        if (blobUrl) URL.revokeObjectURL(blobUrl);
        setBlobUrl(risultato.blobUrl);
        setPdfBlob(risultato.blob || null);
        setNomeFile(risultato.nomeFile);
        if (apriAnteprima) setAnteprimaAperta(true);
        return risultato;
      } finally {
        setInElaborazione(false);
      }
    },
    [blobUrl, cantiere, datiAzienda]
  );

  return {
    pronto: Boolean(blobUrl),
    blobUrl,
    pdfBlob,
    nomeFile,
    inElaborazione,
    anteprimaAperta,
    setAnteprimaAperta,
    genera,
  };
}
