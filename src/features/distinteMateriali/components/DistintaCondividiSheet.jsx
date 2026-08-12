import { useMemo, useState } from "react";
import { Copy, FileText, MessageCircle } from "lucide-react";

import ShareSheet from "../../../components/sharing/ShareSheet";
import { generaPdfDistintaMateriali } from "../distintaPdfService";
import {
  apriWhatsAppConTesto,
  copiaTestoNegliAppunti,
  generaTestoDistinta,
} from "../distintaTestoService";

/**
 * Condivisione distinta: delega UI a ShareSheet, logica ai servizi distinta.
 */
export default function DistintaCondividiSheet({
  open,
  onClose,
  distinta,
  onMessaggio,
}) {
  const [mostraPrezzi, setMostraPrezzi] = useState(false);
  const [busy, setBusy] = useState(false);

  const testo = useMemo(
    () => generaTestoDistinta(distinta, { mostraPrezzi }),
    [distinta, mostraPrezzi]
  );

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
    <ShareSheet
      open={open}
      onClose={onClose}
      sheetTestId="distinta-condividi-sheet"
      preview={testo}
      previewTestId="distinta-condividi-preview"
      options={
        <label className="flex items-center justify-between gap-3 min-h-[44px] px-1">
          <span className="ds-text-primary text-sm">Mostra prezzi</span>
          <input
            type="checkbox"
            className="h-5 w-5"
            checked={mostraPrezzi}
            onChange={(e) => setMostraPrezzi(e.target.checked)}
            aria-label="Mostra prezzi"
            data-testid="distinta-condividi-prezzi"
          />
        </label>
      }
      actions={[
        {
          id: "whatsapp",
          label: "WhatsApp",
          icon: MessageCircle,
          variant: "primary",
          onPress: gestisciWhatsApp,
          testId: "distinta-condividi-whatsapp",
        },
        {
          id: "copy",
          label: "Copia testo",
          icon: Copy,
          variant: "secondary",
          onPress: gestisciCopia,
          testId: "distinta-condividi-copia",
        },
        {
          id: "pdf",
          label: "PDF",
          icon: FileText,
          variant: "secondary",
          onPress: gestisciPdf,
          disabled: busy,
          loadingLabel: "Generazione…",
          testId: "distinta-condividi-pdf",
        },
      ]}
    />
  );
}
