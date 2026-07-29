import {
  ClipboardList,
  HardHat,
  MapPin,
  Wrench,
} from "lucide-react";

import { TIPO_LAVORO } from "../../lavori/lavoriTypes";

/**
 * @param {import("../../lavori/lavoriTypes").TipoLavoro} tipo
 */
export function iconaTipoLavoro(tipo) {
  switch (tipo) {
    case TIPO_LAVORO.INTERVENTO:
      return Wrench;
    case TIPO_LAVORO.SOPRALLUOGO:
      return MapPin;
    case TIPO_LAVORO.MANUTENZIONE:
      return ClipboardList;
    case TIPO_LAVORO.CANTIERE:
    default:
      return HardHat;
  }
}

/**
 * @param {import("../../lavori/lavoriTypes").TipoLavoro} tipo
 */
export function classeIconaTipoLavoro(tipo) {
  switch (tipo) {
    case TIPO_LAVORO.INTERVENTO:
      return "bg-blue-400/15 text-blue-200";
    case TIPO_LAVORO.SOPRALLUOGO:
      return "bg-purple-400/15 text-purple-200";
    case TIPO_LAVORO.MANUTENZIONE:
      return "bg-amber-400/15 text-amber-200";
    case TIPO_LAVORO.CANTIERE:
    default:
      return "bg-yellow-400/15 text-yellow-200";
  }
}
