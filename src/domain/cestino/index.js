export {
  TIPI_CESTINO,
  FILTRI_CESTINO,
  isRecordCestinato,
  filtraRecordAttivi,
  filtraRecordCestinati,
  creaDeletedAtIso,
  senzaDeletedAt,
} from "./cestinoTypes";

export {
  spostaNelCestino,
  ripristina,
  eliminaDefinitivamente,
  ottieniElementiCestinati,
  isClienteCestinato,
  isPreventivoCestinato,
  isCantiereCestinato,
} from "./cestinoService";
