import { useState } from "react";
import {
  Download,
  Eye,
  Mail,
  MessageCircle,
  Share2,
  Check,
  X,
} from "lucide-react";

import {
  condividi,
  condividiEmail,
  condividiWhatsApp,
  downloadPdf,
  ottieniStorico,
  ottieniStatistiche,
  risolviDocumentoDaCondividere,
  TIPI_CONDIVISIONE,
  TIPI_CONDIVISIONE_LABEL,
} from "../../../domain/condivisione";

const ICONE_TIPO = {
  [TIPI_CONDIVISIONE.EMAIL]: Mail,
  [TIPI_CONDIVISIONE.WHATSAPP]: MessageCircle,
  [TIPI_CONDIVISIONE.SHARE]: Share2,
  [TIPI_CONDIVISIONE.DOWNLOAD]: Download,
};

function formatDataOra(timestamp) {
  const d = new Date(Number(timestamp) || Date.now());
  return {
    data: d.toLocaleDateString("it-IT"),
    ora: d.toLocaleTimeString("it-IT", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

/**
 * Sezione Condivisione — UI pura.
 * Non conosce Web Share / mailto / wa.me.
 * Riceve il PDF già pronto via `preparaDocumento`.
 */
export default function CondivisioneSection({
  preventivo,
  onMessaggio,
  preparaDocumento,
  onVisualizzaPdf,
  inElaborazione = false,
  embedded = false,
}) {
  const [tick, setTick] = useState(0);
  const [busy, setBusy] = useState(false);
  const [emailDest, setEmailDest] = useState("");
  const [waDest, setWaDest] = useState("");

  void tick;
  const storico = ottieniStorico(preventivo?.id);
  const stats = ottieniStatistiche(preventivo?.id);
  const docInfo = risolviDocumentoDaCondividere(preventivo?.id, preventivo);

  function refresh() {
    setTick((n) => n + 1);
  }

  async function conDocumento(azione) {
    if (!preventivo?.id || busy || inElaborazione) return;
    setBusy(true);
    try {
      const doc = await preparaDocumento?.({
        firmato: docInfo.firmato,
        nomeFile: docInfo.nomeFile,
      });
      if (!doc?.blob && !doc?.file) {
        onMessaggio?.(
          "Nessun PDF pronto. Genera o visualizza il documento prima."
        );
        return;
      }
      const file = doc.file || doc.blob;
      const esito = await azione(file);
      refresh();
      if (esito?.success) {
        const canale = esito.fallback
          ? ` (fallback ${esito.canale})`
          : "";
        onMessaggio?.(
          `Condivisione ${TIPI_CONDIVISIONE_LABEL[esito.condivisione?.tipo] || ""} completata${canale}.`
        );
      } else if (esito?.error === "annullato") {
        onMessaggio?.("Condivisione annullata.");
      } else {
        onMessaggio?.(esito?.message || "Condivisione non riuscita.");
      }
    } catch {
      onMessaggio?.("Condivisione non riuscita.");
    } finally {
      setBusy(false);
    }
  }

  const disabilitato = busy || inElaborazione;
  const Wrapper = embedded ? "div" : "section";

  return (
    <Wrapper
      className={embedded ? "space-y-4" : "pro-panel p-5 mb-5 space-y-4"}
      data-testid="preventivo-condivisione-section"
    >
      {!embedded ? (
        <div>
          <p className="section-label">Documento</p>
          <h2 className="ds-section-title mt-1">Condivisione</h2>
          <p className="ds-text-secondary mt-2">
            Condivide il PDF già pronto
            {docInfo.firmato ? " (versione firmata)" : " (versione originale)"}.
            Non rigenera automaticamente.
          </p>
          <p className="text-xs text-slate-500 mt-1 truncate">
            File: {docInfo.nomeFile}
          </p>
        </div>
      ) : (
        <>
          <p className="ds-text-secondary text-sm">
            Condivide il PDF già pronto
            {docInfo.firmato ? " (versione firmata)" : " (versione originale)"}.
          </p>
          <p className="text-xs text-slate-500 truncate">
            File: {docInfo.nomeFile}
          </p>
        </>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs text-slate-400">Email destinatario</span>
          <input
            type="email"
            value={emailDest}
            onChange={(e) => setEmailDest(e.target.value)}
            placeholder="cliente@email.it"
            className="mt-1.5 input-pro"
            autoComplete="email"
          />
        </label>
        <label className="block">
          <span className="text-xs text-slate-400">WhatsApp (telefono)</span>
          <input
            type="tel"
            value={waDest}
            onChange={(e) => setWaDest(e.target.value)}
            placeholder="es. 3331234567"
            className="mt-1.5 input-pro"
            autoComplete="tel"
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={disabilitato}
          onClick={() =>
            conDocumento((file) =>
              condividiEmail({
                preventivoId: preventivo.id,
                preventivo,
                file,
                destinatario: emailDest || preventivo.cliente || "",
              })
            )
          }
          className="btn-secondary min-h-[48px] px-4 text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
        >
          <Mail size={16} aria-hidden="true" />
          Invia Email
        </button>
        <button
          type="button"
          disabled={disabilitato}
          onClick={() =>
            conDocumento((file) =>
              condividiWhatsApp({
                preventivoId: preventivo.id,
                preventivo,
                file,
                destinatario: waDest || preventivo.cliente || "",
              })
            )
          }
          className="btn-secondary min-h-[48px] px-4 text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
          data-testid="preventivo-condividi-whatsapp"
        >
          <MessageCircle size={16} aria-hidden="true" />
          Invia WhatsApp
        </button>
        <button
          type="button"
          disabled={disabilitato}
          onClick={() =>
            conDocumento((file) =>
              condividi({
                preventivoId: preventivo.id,
                preventivo,
                file,
                titolo: `Preventivo ${preventivo.numero || ""}`.trim(),
                destinatario: preventivo.cliente || "Sistema",
              })
            )
          }
          className="btn-secondary min-h-[48px] px-4 text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
        >
          <Share2 size={16} aria-hidden="true" />
          Condividi
        </button>
        <button
          type="button"
          disabled={disabilitato}
          onClick={() =>
            conDocumento((file) =>
              downloadPdf({
                preventivoId: preventivo.id,
                preventivo,
                file,
              })
            )
          }
          className="btn-secondary min-h-[48px] px-4 text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
        >
          <Download size={16} aria-hidden="true" />
          Scarica PDF
        </button>
        <button
          type="button"
          disabled={disabilitato}
          onClick={() => onVisualizzaPdf?.()}
          className="btn-secondary min-h-[48px] px-4 text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
        >
          <Eye size={16} aria-hidden="true" />
          Anteprima PDF
        </button>
      </div>

      <StoricoCondivisioniCard
        storico={storico}
        stats={stats}
      />
    </Wrapper>
  );
}

function StoricoCondivisioniCard({ storico, stats }) {
  const ultimaLabel = stats.ultima
    ? new Date(stats.ultima).toLocaleString("it-IT")
    : "—";

  return (
    <div className="rounded-[16px] border border-white/[0.08] bg-white/[0.03] px-4 py-4 space-y-3">
      <div>
        <p className="text-sm font-semibold text-white">
          Storico condivisioni
        </p>
        <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-[12px] border border-white/[0.06] bg-black/20 px-2 py-2">
            <dt className="text-[10px] text-slate-500 uppercase tracking-wide">
              Totale
            </dt>
            <dd className="text-sm font-bold tabular-nums text-white mt-0.5">
              {stats.numero}
            </dd>
          </div>
          <div className="rounded-[12px] border border-white/[0.06] bg-black/20 px-2 py-2">
            <dt className="text-[10px] text-slate-500 uppercase tracking-wide">
              Preferito
            </dt>
            <dd className="text-sm font-bold text-white mt-0.5 truncate">
              {stats.canalePreferitoLabel}
            </dd>
          </div>
          <div className="rounded-[12px] border border-white/[0.06] bg-black/20 px-2 py-2">
            <dt className="text-[10px] text-slate-500 uppercase tracking-wide">
              Ultima
            </dt>
            <dd className="text-[11px] font-semibold text-slate-200 mt-0.5 leading-tight">
              {ultimaLabel}
            </dd>
          </div>
        </dl>
      </div>

      {storico.length === 0 ? (
        <p className="text-sm text-slate-400">Nessuna condivisione ancora.</p>
      ) : (
        <ul className="space-y-2" role="list">
          {storico.map((voce) => {
            const Icona = ICONE_TIPO[voce.tipo] || Share2;
            const { data, ora } = formatDataOra(voce.data);
            const ok =
              voce.stato !== "fallito" &&
              voce.stato !== "annullato" &&
              voce.esito !== "Fallito" &&
              voce.esito !== "Annullato";

            return (
              <li
                key={voce.id}
                className="rounded-[14px] border border-white/[0.06] bg-white/[0.03] px-3.5 py-3"
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-full shrink-0 ${
                      ok
                        ? "bg-emerald-400/15 text-emerald-200"
                        : "bg-red-400/15 text-red-200"
                    }`}
                    aria-hidden="true"
                  >
                    {ok ? <Check size={14} /> : <X size={14} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Icona
                        size={14}
                        className="text-yellow-200/90 shrink-0"
                        aria-hidden="true"
                      />
                      <p className="text-sm font-semibold text-white">
                        {TIPI_CONDIVISIONE_LABEL[voce.tipo] || voce.tipo}
                      </p>
                      {voce.firmato ? (
                        <span className="text-[10px] uppercase tracking-wide text-yellow-200/80 font-semibold">
                          Firmato
                        </span>
                      ) : null}
                    </div>
                    <p className="text-xs text-slate-400 mt-1 tabular-nums">
                      {data}
                      <span className="mx-1.5 text-slate-600">·</span>
                      {ora}
                    </p>
                    <p className="text-sm text-slate-200 mt-1 truncate">
                      {voce.destinatario || "Locale"}
                    </p>
                    <p className="text-xs font-semibold text-slate-400 mt-1">
                      {voce.esito}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
