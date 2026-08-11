export {
  CATEGORIA_MATERIALE,
  CATEGORIE_MATERIALE,
  ETICHETTE_CATEGORIA_MATERIALE,
  UNITA_MATERIALE,
  UNITA_MATERIALE_CANONICHE,
  UNITA_MATERIALE_ALIAS,
  isCategoriaMateriale,
  isUnitaCanonica,
  normalizzaUnitaMateriale,
} from "./materialiTypes";

export { CATALOGO_MATERIALI_SEED } from "./materialiCatalogoSeed";

export {
  FAMIGLIE_BY_ID,
  VARIANTI_BY_ID,
  elencaFamiglieMateriali,
  elencaFamigliePerCategoria,
  trovaFamigliaMateriale,
  trovaVarianteMateriale,
  isFamigliaMaterialeId,
  isVarianteMaterialeId,
  nomeMaterialeDaCatalogo,
  creaRiferimentoMateriale,
  validaRiferimentoMateriale,
  analizzaIntegritaSeed,
  contaCatalogoMaterialiSeed,
  clonaSeedCatalogoMateriali,
  normalizzaCatalogoMateriali,
  normalizzaFamigliaMateriale,
  normalizzaVarianteMateriale,
  isCatalogoMaterialiPopolato,
  cercaFamiglieMateriali,
  creaFamigliaPersonalizzata,
  creaVarianteMateriale,
} from "./materialiCatalogDomain";

export {
  catalogoMaterialiRepository,
  exists as esisteCatalogoMateriali,
  load as loadCatalogoMateriali,
  loadRaw as loadRawCatalogoMateriali,
  save as saveCatalogoMateriali,
  replace as replaceCatalogoMateriali,
  reset as resetCatalogoMaterialiRepo,
} from "./catalogoMaterialiRepository";

export {
  inizializzaCatalogoMateriali,
  assicuraSeedCatalogoMateriali,
  caricaCatalogoMateriali,
  persistiCatalogoMateriali,
  resetCatalogoMateriali,
  creaFamigliaCatalogo,
  aggiornaFamigliaCatalogo,
  eliminaFamigliaCatalogo,
  impostaAttivaFamigliaCatalogo,
  creaVarianteCatalogo,
  aggiornaVarianteCatalogo,
  eliminaVarianteCatalogo,
  impostaAttivaVarianteCatalogo,
  cercaCatalogoMateriali,
  filtraCatalogoPerCategoria,
  trovaFamigliaCatalogo,
  trovaVarianteCatalogo,
  elencaCategorieCatalogoMateriali,
  sostituisciConSeedCatalogoMateriali,
} from "./materialiCatalogService";
