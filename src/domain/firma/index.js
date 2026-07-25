export {
  STATI_FIRMA_CONSENTITI,
  VERSIONE_DOCUMENTO,
  creaIdFirma,
  creaFirmaModel,
  puoFirmarePreventivo,
  calcolaHashDocumento,
  nomeFilePdfPreventivo,
  mappaFirmaPerPdf,
  snapshotHashPreventivo,
  hashTesto,
} from "./firmaTypes";

export {
  creaFirma,
  salvaFirma,
  rimuoviFirma,
  ottieniFirma,
  documentoFirmato,
  creaFirmaService,
} from "./firmaService";

export {
  leggiTutteFirme,
  trovaFirmaPerPreventivo,
  resetFirme,
} from "./firmaRepository";
