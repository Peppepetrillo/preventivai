import { useMemo, useState } from "react";
import { Copy, FileText, MessageCircle } from "lucide-react";

import ShareSheet from "../../../components/sharing/ShareSheet";
import { generaPdfAcquisti } from "../acquistiPdfService";
import {
  apriWhatsAppConTesto,
  copiaTestoNegliAppunti,
  generaTestoAcquisti,
  MODALITA_CONDIVIDI_ACQUISTI,
} from "../acquistiTestoService";

const MODALITA = [
  { id: MODALITA_CONDIVIDI_ACQUISTI.perLavoro, etichetta: "Per lavoro" },
  { id: MODALITA_CONDIVIDI_ACQUISTI.perFornitore, etichetta: "Per fornitore" },
];

/**
 * Condivisione Acquisti: delega UI a ShareSheet, logica ai servizi acquisti.
 */
export default function AcquistiCondividiSheet({
  open,
  onClose,
  voci = [],
  modalitaIniziale = MODALITA_CONDIVIDI_ACQUISTI.perLavoro,
  cantieri = [],
  onMessaggio,
}) {
  const [modalita, setModalita] = useState(modalitaIniziale);
  const [mostraPrezzi, setMostraPrezzi] = useState(false);
  const [includiAcquistati, setIncludiAcquistati] = useState(false);
  const [busy, setBusy] = useState(false);

  const testo = useMemo(
    () =>
      generaTestoAcquisti(voci, {
        modalita,
        mostraPrezzi,
        includiAcquistati,
        cantieri,
      }),
    [voci, modalita, mostraPrezzi, includiAcquistati, cantieri]
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
    setBusy(true);
    try {
      const risultato = await generaPdfAcquisti({
        voci,
        modalita,
        mostraPrezzi,
        includiAcquistati,
        cantieri,
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
      sheetTestId="acquisti-condividi-sheet"
      preview={testo}
      previewTestId="acquisti-condividi-preview"
      options={
        <>
          <div
            className="flex gap-2 overflow-x-auto pb-0.5"
            role="tablist"
            aria-label="Modalità condivisione"
          >
            {MODALITA.map((voce) => {
              const attivo = modalita === voce.id;
              return (
                <button
                  key={voce.id}
                  type="button"
                  role="tab"
                  aria-selected={attivo}
                  onClick={() => setModalita(voce.id)}
                  className={`ds-chip min-h-[44px] ${attivo ? "ds-chip-active" : ""}`}
                  data-testid={`acquisti-condividi-modalita-${voce.id}`}
                >
                  {voce.etichetta}
                </button>
              );
            })}
          </div>

          <label className="flex items-center justify-between gap-3 min-h-[44px] px-1">
            <span className="ds-text-primary text-sm">Mostra prezzi</span>
            <input
              type="checkbox"
              className="h-5 w-5"
              checked={mostraPrezzi}
              onChange={(e) => setMostraPrezzi(e.target.checked)}
              aria-label="Mostra prezzi"
              data-testid="acquisti-condividi-prezzi"
            />
          </label>

          <label className="flex items-center justify-between gap-3 min-h-[44px] px-1">
            <span className="ds-text-primary text-sm">Mostra anche acquistati</span>
            <input
              type="checkbox"
              className="h-5 w-5"
              checked={includiAcquistati}
              onChange={(e) => setIncludiAcquistati(e.target.checked)}
              aria-label="Mostra anche acquistati"
              data-testid="acquisti-condividi-acquistati"
            />
          </label>
        </>
      }
      actions={[
        {
          id: "whatsapp",
          label: "WhatsApp",
          icon: MessageCircle,
          variant: "primary",
          onPress: gestisciWhatsApp,
          testId: "acquisti-condividi-whatsapp",
        },
        {
          id: "copy",
          label: "Copia testo",
          icon: Copy,
          variant: "secondary",
          onPress: gestisciCopia,
          testId: "acquisti-condividi-copia",
        },
        {
          id: "pdf",
          label: "PDF",
          icon: FileText,
          variant: "secondary",
          onPress: gestisciPdf,
          disabled: busy,
          loadingLabel: "Generazione…",
          testId: "acquisti-condividi-pdf",
        },
      ]}
    />
  );
}
