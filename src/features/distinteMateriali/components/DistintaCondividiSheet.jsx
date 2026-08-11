import { useState } from "react";
import { Copy, FileText, MessageCircle } from "lucide-react";

import BottomSheet from "../../../components/BottomSheet";
import { generaPdfDistintaMateriali } from "../distintaPdfService";
import {
  apriWhatsAppConTesto,
  copiaTestoNegliAppunti,
  generaTestoDistinta,
} from "../distintaTestoService";

/**
 * Condivisione distinta: WhatsApp, copia testo, PDF.
 */
export default function DistintaCondividiSheet({
  open,
  onClose,
  distinta,
  onMessaggio,
}) {
  const [mostraPrezzi, setMostraPrezzi] = useState(false);
  const [busy, setBusy] = useState(false);

  const testo = generaTestoDistinta(distinta, { mostraPrezzi });

  async function gestisciWhatsApp() {
    apriWhatsAppConTesto(testo);
    onMessaggio?.("Aperto WhatsApp.");
    onClose?.();
  }

  async function gestisciCopia() {
    const ok = await copiaTestoNegliAppunti(testo);
    onMessaggio?.(ok ? "Testo copiato." : "Impossibile copiare il testo.");
    if (ok) onClose?.();
  }

  async function gestisciPdf() {
    if (!distinta) return;
    setBusy(true);
    try {
      const risultato = await generaPdfDistintaMateriali({
        distinta,
        mostraPrezzi,
        salva: true,
      });
      onMessaggio?.(`PDF generato: ${risultato.nomeFile}`);
      onClose?.();
    } catch {
      onMessaggio?.("Impossibile generare il PDF.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Condividi"
      descrizione="WhatsApp, testo o PDF della distinta."
    >
      <div className="space-y-4 pb-2">
        <label className="flex items-center justify-between gap-3 min-h-[48px] px-1">
          <span className="ds-text-primary text-sm">Mostra prezzi</span>
          <input
            type="checkbox"
            className="h-5 w-5"
            checked={mostraPrezzi}
            onChange={(e) => setMostraPrezzi(e.target.checked)}
            aria-label="Mostra prezzi"
          />
        </label>

        <pre className="pro-panel px-3.5 py-3 text-xs text-slate-300 whitespace-pre-wrap max-h-40 overflow-y-auto">
          {testo}
        </pre>

        <button
          type="button"
          onClick={gestisciWhatsApp}
          className="btn-primary w-full min-h-[52px] font-bold flex items-center justify-center gap-2"
        >
          <MessageCircle size={18} aria-hidden="true" />
          WhatsApp
        </button>

        <button
          type="button"
          onClick={gestisciCopia}
          className="btn-secondary w-full min-h-[48px] font-bold flex items-center justify-center gap-2"
        >
          <Copy size={18} aria-hidden="true" />
          Copia testo
        </button>

        <button
          type="button"
          onClick={gestisciPdf}
          disabled={busy}
          className="btn-secondary w-full min-h-[48px] font-bold flex items-center justify-center gap-2"
        >
          <FileText size={18} aria-hidden="true" />
          {busy ? "Generazione…" : "PDF"}
        </button>
      </div>
    </BottomSheet>
  );
}
