import { useState } from "react";
import { Eye, FileSignature, PenLine, RefreshCw, Trash2 } from "lucide-react";

import SignatureCanvas from "../../../components/SignatureCanvas";
import BottomSheet from "../../../components/BottomSheet";
import {
  creaFirma,
  salvaFirma,
  rimuoviFirma,
  documentoFirmato,
  puoFirmarePreventivo,
} from "../../../domain/firma";

/**
 * Sezione Firma Cliente — UI only. Non conosce il motore PDF.
 */
export default function FirmaClienteSection({
  preventivo,
  onMessaggio,
  onRigeneraPdf,
  pdfInElaborazione = false,
}) {
  const [tick, setTick] = useState(0);
  const [sheetAperto, setSheetAperto] = useState(false);
  const [anteprimaAperta, setAnteprimaAperta] = useState(false);
  const [firmatario, setFirmatario] = useState(
    () => preventivo?.cliente || ""
  );

  // tick forza re-read dopo mutazioni
  void tick;
  const info = documentoFirmato(preventivo?.id);
  const firma = info.firma || null;
  const puoFirmare = puoFirmarePreventivo(preventivo?.stato);
  const haFirma = Boolean(firma?.immagineFirma);

  function aggiorna() {
    setTick((n) => n + 1);
  }

  function apriFirma() {
    if (!puoFirmare) {
      onMessaggio?.(
        "È possibile firmare solo preventivi Inviato o Accettato."
      );
      return;
    }
    setFirmatario(preventivo?.cliente || firmatario || "");
    setSheetAperto(true);
  }

  function confermaFirma(immagineFirma) {
    const creato = creaFirma({
      preventivo,
      firmatario,
      immagineFirma,
    });
    if (!creato.success) {
      onMessaggio?.(creato.message || "Firma non riuscita.");
      return;
    }
    const salvato = salvaFirma(creato.firma, {
      preventivo,
      registraFirmato: true,
    });
    if (!salvato.success) {
      onMessaggio?.("Impossibile salvare la firma.");
      return;
    }
    setSheetAperto(false);
    aggiorna();
    onMessaggio?.("Firma cliente salvata.");
  }

  function eliminaFirmaCliente() {
    if (!haFirma) return;
    const conferma = window.confirm("Rimuovere la firma del cliente?");
    if (!conferma) return;
    const esito = rimuoviFirma(preventivo.id);
    if (!esito.success) {
      onMessaggio?.("Nessuna firma da rimuovere.");
      return;
    }
    setAnteprimaAperta(false);
    aggiorna();
    onMessaggio?.("Firma rimossa.");
  }

  async function rigeneraPdfFirmato() {
    await onRigeneraPdf?.({ firmato: haFirma });
  }

  const dataLabel = firma?.dataFirma
    ? new Date(firma.dataFirma).toLocaleString("it-IT")
    : "—";

  return (
    <section className="pro-panel p-5 mb-5 space-y-4">
      <div>
        <p className="section-label">Documento</p>
        <h2 className="text-xl font-black mt-1">Firma Cliente</h2>
        <p className="text-sm text-slate-400 mt-2">
          La firma genera una versione PDF firmata. Il preventivo non viene
          modificato.
        </p>
      </div>

      <dl className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-[14px] border border-white/[0.06] bg-white/[0.03] px-3.5 py-3">
          <dt className="text-[12px] font-medium text-slate-400">Stato firma</dt>
          <dd className="mt-1 text-sm font-semibold text-white">
            {haFirma ? "Firmato" : "Non firmato"}
          </dd>
        </div>
        <div className="rounded-[14px] border border-white/[0.06] bg-white/[0.03] px-3.5 py-3">
          <dt className="text-[12px] font-medium text-slate-400">Data</dt>
          <dd className="mt-1 text-sm font-semibold text-white tabular-nums">
            {dataLabel}
          </dd>
        </div>
        <div className="rounded-[14px] border border-white/[0.06] bg-white/[0.03] px-3.5 py-3">
          <dt className="text-[12px] font-medium text-slate-400">Firmatario</dt>
          <dd className="mt-1 text-sm font-semibold text-white truncate">
            {firma?.firmatario || "—"}
          </dd>
        </div>
      </dl>

      {info.originale || info.documento ? (
        <div className="rounded-[14px] border border-white/[0.06] bg-white/[0.03] px-3.5 py-3 text-xs text-slate-400 space-y-1">
          {info.originale ? (
            <p>
              Originale:{" "}
              <span className="text-slate-200">{info.originale.nomeFile}</span>
            </p>
          ) : null}
          {info.documento ? (
            <p>
              Firmato:{" "}
              <span className="text-slate-200">{info.documento.nomeFile}</span>
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={apriFirma}
          disabled={!puoFirmare}
          className="btn-primary min-h-[48px] px-4 text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
        >
          <PenLine size={16} aria-hidden="true" />
          Firma ora
        </button>
        <button
          type="button"
          onClick={() => setAnteprimaAperta((v) => !v)}
          disabled={!haFirma}
          className="btn-secondary min-h-[48px] px-4 text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
        >
          <Eye size={16} aria-hidden="true" />
          Visualizza firma
        </button>
        <button
          type="button"
          onClick={eliminaFirmaCliente}
          disabled={!haFirma}
          className="btn-secondary min-h-[48px] px-4 text-sm font-semibold flex items-center gap-2 text-red-200 disabled:opacity-50"
        >
          <Trash2 size={16} aria-hidden="true" />
          Rimuovi firma
        </button>
        <button
          type="button"
          onClick={rigeneraPdfFirmato}
          disabled={pdfInElaborazione}
          className="btn-secondary min-h-[48px] px-4 text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw size={16} aria-hidden="true" />
          Rigenera PDF
        </button>
      </div>

      {!puoFirmare ? (
        <p className="text-xs text-amber-100/90 flex items-start gap-2">
          <FileSignature size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
          Firma disponibile solo per preventivi Inviato o Accettato.
        </p>
      ) : null}

      {anteprimaAperta && haFirma ? (
        <div className="rounded-[14px] border border-white/10 bg-white p-3">
          <img
            src={firma.immagineFirma}
            alt={`Firma di ${firma.firmatario}`}
            className="w-full max-h-40 object-contain"
          />
        </div>
      ) : null}

      <BottomSheet
        open={sheetAperto}
        onClose={() => setSheetAperto(false)}
        title="Firma Cliente"
        descrizione="Disegna la firma sul dispositivo"
      >
        <div className="space-y-4 pb-2">
          <label className="block">
            <span className="text-sm text-slate-400">Firmatario</span>
            <input
              value={firmatario}
              onChange={(e) => setFirmatario(e.target.value)}
              className="mt-2 input-pro"
              placeholder="Nome e cognome"
              autoComplete="name"
            />
          </label>
          <SignatureCanvas
            onConferma={confermaFirma}
            onAnnulla={() => setSheetAperto(false)}
          />
        </div>
      </BottomSheet>
    </section>
  );
}
