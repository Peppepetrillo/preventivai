export {
  APP_VERSION,
  PDF_PAGE,
  PDF_SETTINGS_DEFAULT,
  creaPreventivoPdfDocument,
  risolviPdfSettings,
} from "./pdfTypes";

export {
  areaUtile,
  spazioRimanente,
  assicuratiSpazio,
  colonneLavorazioni,
  applicaFont,
} from "./pdfLayoutService";

export {
  buildPreventivoPdfDocument,
  renderPreventivoPdf,
  generaPreventivoPdfDaInput,
} from "./pdfTemplateService";
