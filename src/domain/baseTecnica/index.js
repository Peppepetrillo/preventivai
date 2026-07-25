export {
  BASE_TECNICA_CATEGORIE,
  BASE_TECNICA_PRIORITA,
  BASE_TECNICA_ORIGINE_TIPO,
  BASE_TECNICA_AFFIDABILITA,
  creaSchedaTecnica,
  condizioniSchedaSoddisfatte,
} from "./baseTecnicaTypes";

export {
  BASE_TECNICA_SCHEDE,
  BASE_TECNICA_BY_ID,
  BASE_TECNICA_SEZIONI,
} from "./baseTecnicaData";

export {
  leggiSchede,
  trovaPerId,
  trovaPerCategoria,
  leggiSezioni,
  contaSchede,
} from "./baseTecnicaRepository";

export {
  elencaSchedeTecniche,
  ottieniSchedaTecnica,
  ottieniMotivazione,
  ottieniOrigine,
  ottieniVerificheProfessionista,
  elencaPerCategoria,
  elencaSezioni,
  consultaBaseTecnica,
  mappaCatalogoIdASchedaTecnica,
  risolviSchedaTecnicaId,
  catalogoIdsDaBaseTecnica,
  statisticheBaseTecnica,
} from "./baseTecnicaService";

export {
  STATO_COVERAGE,
  statoCoverageCatalogoId,
  reportCoverageBaseTecnica,
  riepilogoCoverage,
  validaSchedeBaseTecnica,
} from "./baseTecnicaCoverage";
