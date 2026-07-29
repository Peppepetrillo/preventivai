import {
  buildCantiereReport,
  nomeFileReportCantiere,
} from "../features/report/builder/buildCantiereReport";
import { renderCantiereReportPdf } from "../features/report/pdf/renderCantiereReportPdf";

/**
 * Genera il PDF del report finale cantiere.
 * @param {{ cantiere: object, datiAzienda?: object, salva?: boolean }} opzioni
 */
export async function generaPdfReportCantiere({
  cantiere,
  datiAzienda = {},
  salva = false,
} = {}) {
  const document = buildCantiereReport({ cantiere, datiAzienda });
  const nomeFile = nomeFileReportCantiere(document);
  return renderCantiereReportPdf(document, { salva, nomeFile });
}

export { buildCantiereReport, renderCantiereReportPdf };
