import {
  BatteryCharging,
  Box,
  Cable,
  Cctv,
  Cylinder,
  DoorOpen,
  Home,
  LayoutGrid,
  Lightbulb,
  Link2,
  Network,
  Plug,
  Shield,
  Siren,
  SquareStack,
  Sun,
  Tv,
  Wrench,
  Zap,
} from "lucide-react";

import {
  CATEGORIA_MATERIALE,
  CATEGORIE_NAVIGAZIONE_MATERIALE,
  ETICHETTE_CATEGORIA_MATERIALE,
  UNITA_MATERIALE_CANONICHE,
} from "../../domain/catalogoMateriali/materialiTypes";

export const ICONE_CATEGORIA_MATERIALE = Object.freeze({
  [CATEGORIA_MATERIALE.ELETTRICO]: Zap,
  [CATEGORIA_MATERIALE.CAVI]: Cable,
  [CATEGORIA_MATERIALE.TUBI]: Cylinder,
  [CATEGORIA_MATERIALE.CANALIZZAZIONI]: SquareStack,
  [CATEGORIA_MATERIALE.CASSETTE]: Box,
  [CATEGORIA_MATERIALE.SERIE_CIVILE]: LayoutGrid,
  [CATEGORIA_MATERIALE.QUADRI]: Shield,
  [CATEGORIA_MATERIALE.MORSETTI]: Link2,
  [CATEGORIA_MATERIALE.ILLUMINAZIONE]: Lightbulb,
  [CATEGORIA_MATERIALE.RETE_DATI]: Network,
  [CATEGORIA_MATERIALE.TV_SAT]: Tv,
  [CATEGORIA_MATERIALE.VIDEOSORVEGLIANZA]: Cctv,
  [CATEGORIA_MATERIALE.ALLARME]: Siren,
  [CATEGORIA_MATERIALE.DOMOTICA]: Home,
  [CATEGORIA_MATERIALE.FOTOVOLTAICO]: Sun,
  [CATEGORIA_MATERIALE.GENERALE]: Wrench,
  [CATEGORIA_MATERIALE.INDUSTRIALE]: Plug,
  [CATEGORIA_MATERIALE.EV]: BatteryCharging,
  [CATEGORIA_MATERIALE.AUTOMAZIONE]: DoorOpen,
});

export function metaCategoriaMateriale(categoriaId) {
  const id = String(categoriaId || "").trim();
  return {
    id,
    label: ETICHETTE_CATEGORIA_MATERIALE[id] || id,
    Icon: ICONE_CATEGORIA_MATERIALE[id] || Cable,
  };
}

/**
 * @param {{ includiElettricoLegacy?: boolean, catalogo?: Array<{ categoria?: string }> }=} opzioni
 */
export function elencaMetaCategorieMateriale(opzioni = {}) {
  const ids = [...CATEGORIE_NAVIGAZIONE_MATERIALE];
  const includiLegacy =
    opzioni.includiElettricoLegacy === true ||
    (Array.isArray(opzioni.catalogo) &&
      opzioni.catalogo.some(
        (f) => f?.categoria === CATEGORIA_MATERIALE.ELETTRICO
      ));
  if (includiLegacy) {
    ids.push(CATEGORIA_MATERIALE.ELETTRICO);
  }
  return ids.map((id) => metaCategoriaMateriale(id));
}

export const UNITA_OPZIONI_UI = UNITA_MATERIALE_CANONICHE;
