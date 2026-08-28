import { HardHat } from "lucide-react";

/**
 * Banner post-accettazione — spinge verso Inizia cantiere.
 */
export default function BannerPostAccettazione({ onIniziaCantiere }) {
  return (
    <div
      className="pro-panel p-4 mb-4 border-yellow-300/35 bg-yellow-400/8 space-y-3"
      data-testid="banner-post-accettazione"
      role="status"
    >
      <div>
        <p className="ds-card-title">Preventivo accettato</p>
        <p className="ds-text-secondary text-sm mt-1">
          Pronto per partire. Crea il cantiere per lavorare sul campo. I
          pagamenti si registrano nel tab Pagamenti del cantiere.
        </p>
      </div>
      <button
        type="button"
        onClick={onIniziaCantiere}
        className="w-full btn-primary min-h-[48px] flex items-center justify-center gap-2"
        data-testid="banner-inizia-cantiere"
      >
        <HardHat size={18} aria-hidden="true" />
        Inizia cantiere
      </button>
    </div>
  );
}
