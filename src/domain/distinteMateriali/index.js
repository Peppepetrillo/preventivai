export { DISTINTA_STORAGE_KEY } from "./distintaMaterialiTypes";

export {
  normalizzaQuantita,
  normalizzaCollegamenti,
  normalizzaVoceDistinta,
  normalizzaDistinta,
  normalizzaElencoDistinte,
  creaDistinta,
  aggiornaDistinta,
  aggiungiVoce,
  modificaVoce,
  rimuoviVoce,
  duplicaDistinta,
  collegaPreventivo,
  scollegaPreventivo,
  collegaCantiere,
  scollegaCantiere,
  calcolaTotaleMateriali,
  validaDistinta,
} from "./distintaMaterialiDomain";

export {
  distinteMaterialiRepository,
  exists as esistonoDistinteMateriali,
  load as loadDistinteMateriali,
  loadRaw as loadRawDistinteMateriali,
  save as saveDistinteMateriali,
  replace as replaceDistinteMateriali,
  reset as resetDistinteMaterialiRepo,
} from "./distinteMaterialiRepository";

export {
  inizializzaDistinteMateriali,
  caricaDistinteMateriali,
  persistiDistinteMateriali,
  resetDistinteMateriali,
  trovaDistintaPerId,
  creaDistintaMateriali,
  aggiornaDistintaMateriali,
  eliminaDistintaMateriali,
  aggiungiVoceDistinta,
  modificaVoceDistinta,
  rimuoviVoceDistinta,
  duplicaDistintaMateriali,
  collegaDistintaAPreventivo,
  scollegaDistintaDaPreventivo,
  collegaDistintaACantiere,
  scollegaDistintaDaCantiere,
  cercaDistinteMateriali,
  totaleDistintaMateriali,
} from "./distintaMaterialiService";

export {
  proiettaVociDistintaSuMaterialiCantiere,
  applicaModificaManualeMateriale,
} from "./distintaProiezione";

export {
  sincronizzaDistintaSuCantiere,
  collegaESincronizzaDistintaACantiere,
  scollegaDistintaDaCantiereSoft,
  risincronizzaDistintaSeCollegata,
  elencaCantieriPerCollegamento,
} from "./distintaCantiereService";
