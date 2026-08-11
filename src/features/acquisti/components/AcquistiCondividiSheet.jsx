import { useMemo, useState } from "react";
import { Copy, FileText, MessageCircle } from "lucide-react";

import BottomSheet from "../../../components/BottomSheet";
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
 * Condivisione Acquisti: WhatsApp, copia testo, PDF.
 * Usa solo listaSpesa (voci passate dal parent).
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
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Condividi"
      descrizione="WhatsApp, testo o PDF della lista acquisti."
    >
      <div className="space-y-4 pb-2" data-testid="acquisti-condividi-sheet">
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
                className={`ds-chip ${attivo ? "ds-chip-active" : ""}`}
                data-testid={`acquisti-condividi-modalita-${voce.id}`}
              >
                {voce.etichetta}
              </button>
            );
          })}
        </div>

        <label className="flex items-center justify-between gap-3 min-h-[48px] px-1">
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

        <label className="flex items-center justify-between gap-3 min-h-[48px] px-1">
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

        <pre
          className="pro-panel px-3.5 py-3 text-xs text-slate-300 whitespace-pre-wrap max-h-40 overflow-y-auto"
          data-testid="acquisti-condividi-preview"
        >
          {testo}
        </pre>

        <button
          type="button"
          onClick={gestisciWhatsApp}
          className="btn-primary w-full min-h-[52px] font-bold flex items-center justify-center gap-2"
          data-testid="acquisti-condividi-whatsapp"
        >
          <MessageCircle size={18} aria-hidden="true" />
          WhatsApp
        </button>

        <button
          type="button"
          onClick={gestisciCopia}
          className="btn-secondary w-full min-h-[48px] font-bold flex items-center justify-center gap-2"
          data-testid="acquisti-condividi-copia"
        >
          <Copy size={18} aria-hidden="true" />
          Copia testo
        </button>

        <button
          type="button"
          onClick={gestisciPdf}
          disabled={busy}
          className="btn-secondary w-full min-h-[48px] font-bold flex items-center justify-center gap-2"
          data-testid="acquisti-condividi-pdf"
        >
          <FileText size={18} aria-hidden="true" />
          {busy ? "Generazione…" : "PDF"}
        </button>
      </div>
    </BottomSheet>
  );
}
