import {
  Cable,
  Cctv,
  Home,
  Lightbulb,
  Network,
  Siren,
  Sun,
  Wrench,
  Zap,
} from "lucide-react";

import {
  CATEGORIA_MATERIALE,
  CATEGORIE_MATERIALE,
  ETICHETTE_CATEGORIA_MATERIALE,
  UNITA_MATERIALE_CANONICHE,
} from "../../domain/catalogoMateriali/materialiTypes";

export const ICONE_CATEGORIA_MATERIALE = Object.freeze({
  [CATEGORIA_MATERIALE.ELETTRICO]: Zap,
  [CATEGORIA_MATERIALE.ALLARME]: Siren,
  [CATEGORIA_MATERIALE.VIDEOSORVEGLIANZA]: Cctv,
  [CATEGORIA_MATERIALE.RETE_DATI]: Network,
  [CATEGORIA_MATERIALE.ILLUMINAZIONE]: Lightbulb,
  [CATEGORIA_MATERIALE.DOMOTICA]: Home,
  [CATEGORIA_MATERIALE.FOTOVOLTAICO]: Sun,
  [CATEGORIA_MATERIALE.GENERALE]: Wrench,
});

export function metaCategoriaMateriale(categoriaId) {
  const id = String(categoriaId || "").trim();
  return {
    id,
    label: ETICHETTE_CATEGORIA_MATERIALE[id] || id,
    Icon: ICONE_CATEGORIA_MATERIALE[id] || Cable,
  };
}

export function elencaMetaCategorieMateriale() {
  return CATEGORIE_MATERIALE.map((id) => metaCategoriaMateriale(id));
}

export const UNITA_OPZIONI_UI = UNITA_MATERIALE_CANONICHE;
