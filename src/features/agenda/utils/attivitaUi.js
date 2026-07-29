import {
  Check,
  Phone,
  ShoppingCart,
  StickyNote,
  User,
  Bell,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";

import { CATEGORIA_ATTIVITA } from "../../../domain/attivita/attivitaTypes";

/**
 * @param {string} categoria
 */
export function iconaCategoriaAttivita(categoria) {
  switch (categoria) {
    case CATEGORIA_ATTIVITA.TELEFONATA:
      return Phone;
    case CATEGORIA_ATTIVITA.ACQUISTI:
      return ShoppingCart;
    case CATEGORIA_ATTIVITA.PROMEMORIA:
      return Bell;
    case CATEGORIA_ATTIVITA.PERSONALE:
      return User;
    case CATEGORIA_ATTIVITA.AMMINISTRATIVA:
      return StickyNote;
    default:
      return MoreHorizontal;
  }
}

/**
 * @param {string} priorita
 */
export function classePrioritaAttivita(priorita) {
  if (priorita === "alta") return "ds-badge text-red-200 bg-red-400/15";
  if (priorita === "bassa") return "ds-badge text-slate-300 bg-slate-500/20";
  return "ds-badge text-amber-200 bg-amber-400/15";
}

/**
 * @param {string} priorita
 */
export function etichettaPriorita(priorita) {
  if (priorita === "alta") return "Alta";
  if (priorita === "bassa") return "Bassa";
  return "Media";
}

export { Check, Pencil, Trash2 };
