import {
  Check,
  HardHat,
  PenLine,
  Send,
  Share2,
} from "lucide-react";

import { HERO_CTA } from "../utils/preventivoHeroCta";

const ICONE = {
  [HERO_CTA.MODIFICA]: PenLine,
  [HERO_CTA.INVIA_DI_NUOVO]: Send,
  [HERO_CTA.ACCETTA]: Check,
  [HERO_CTA.CONVERTI_CANTIERE]: HardHat,
  [HERO_CTA.APRI_CANTIERE]: HardHat,
  [HERO_CTA.SEGNA_INVIATO]: Send,
  [HERO_CTA.CONDIVIDI]: Share2,
};

/**
 * CTA primaria hero — una sola azione principale per stato.
 */
export default function PreventivoHeroCta({ hero, onAzione, disabled = false }) {
  if (!hero) return null;

  const Icona = ICONE[hero.id] || PenLine;

  return (
    <button
      type="button"
      onClick={() => onAzione?.(hero.id)}
      disabled={disabled}
      className="w-full btn-primary min-h-[52px] text-base font-bold flex items-center justify-center gap-2 mb-3 disabled:opacity-60"
      data-testid="preventivo-hero-cta"
      aria-busy={disabled || undefined}
    >
      <Icona size={20} aria-hidden="true" />
      {hero.label}
    </button>
  );
}
