import { useState } from "react";
import { Check, ClipboardList, Play, Plus, X } from "lucide-react";

import NumericInput from "../../../components/NumericInput";
import { formatEuro } from "../../../utils/preventivi";
import {
  STATI_VARIANTE,
  STATI_VARIANTE_LABEL,
  TIPI_VARIANTE,
  TIPI_VARIANTE_LABEL,
  calcolaTotaleCantiere,
  importoSegnatoVariante,
  ottieniTimelineVarianti,
} from "../../../domain/varianti";

const FORM_INIZIALE = {
  tipo: TIPI_VARIANTE.AGGIUNTA,
  titolo: "",
  descrizione: "",
  quantita: "1",
  prezzoUnitario: "",
  unita: "cad",
  note: "",
};

function badgeClasseStato(stato) {
  switch (stato) {
    case STATI_VARIANTE.PROPOSTA:
      return "bg-yellow-500/20 text-yellow-100 border-yellow-400/30";
    case STATI_VARIANTE.APPROVATA:
      return "bg-sky-500/20 text-sky-100 border-sky-400/30";
    case STATI_VARIANTE.ESEGUITA:
      return "bg-emerald-500/20 text-emerald-100 border-emerald-400/30";
    case STATI_VARIANTE.ANNULLATA:
      return "bg-red-500/20 text-red-100 border-red-400/30";
    default:
      return "bg-white/10 text-slate-300 border-white/10";
  }
}

/**
 * Sezione Varianti — totale dinamico, preventivo immutabile.
 */
export default function CantiereVarianti({
  cantiere,
  sezioneRef,
  onCreaVariante,
  onSincronizzaVariantePreventivo,
  onApprovaVariante,
  onEseguiVariante,
  onAnnullaVariante,
  refreshKey = 0,
}) {
  const [mostraForm, setMostraForm] = useState(false);
  const [form, setForm] = useState(FORM_INIZIALE);
  const [errore, setErrore] = useState("");
  const [dialogoPreventivo, setDialogoPreventivo] = useState(null);

  // refreshKey forza il re-render dal parent dopo mutazioni workflow
  void refreshKey;
  const riepilogo = calcolaTotaleCantiere(cantiere);
  const timeline = cantiere?.id ? ottieniTimelineVarianti(cantiere.id) : [];

  function aggiornaCampo(campo, valore) {
    setForm((precedente) => ({ ...precedente, [campo]: valore }));
  }

  function resetForm() {
    setForm(FORM_INIZIALE);
    setErrore("");
    setMostraForm(false);
  }

  function salvaVariante(event) {
    event.preventDefault();
    try {
      const titolo = String(form.titolo || form.descrizione || "").trim();
      if (!titolo) {
        setErrore("Inserisci un titolo per il lavoro extra.");
        return;
      }
      const risultato = onCreaVariante?.({
        tipo: form.tipo,
        titolo,
        descrizione: String(form.descrizione || titolo).trim(),
        quantita: form.quantita,
        prezzoUnitario: form.prezzoUnitario,
        unita: form.unita,
        note: form.note,
      });
      if (risultato && risultato.success === false) {
        setErrore(risultato.error || "Impossibile salvare il lavoro extra.");
        return;
      }
      resetForm();
      if (
        risultato?.success &&
        risultato.variante &&
        cantiere?.preventivoId &&
        typeof onSincronizzaVariantePreventivo === "function"
      ) {
        setDialogoPreventivo(risultato.variante);
      }
    } catch (e) {
      setErrore(e.message || "Impossibile salvare il lavoro extra.");
    }
  }

  function aggiornaAnchePreventivo() {
    if (dialogoPreventivo) {
      onSincronizzaVariantePreventivo?.(dialogoPreventivo);
    }
    setDialogoPreventivo(null);
  }

  const deltaLabel =
    riepilogo.deltaVarianti >= 0
      ? `+${formatEuro(riepilogo.deltaVarianti)}`
      : formatEuro(riepilogo.deltaVarianti);

  return (
    <section
      id="sezione-varianti"
      ref={sezioneRef}
      className="pro-panel p-5 scroll-mt-24 space-y-5"
      aria-labelledby="varianti-title"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <ClipboardList size={22} className="text-yellow-300" aria-hidden="true" />
          <div>
            <h3 id="varianti-title" className="text-xl font-black">
              Lavori extra
            </h3>
            <p className="text-sm text-slate-400 mt-1">
              Extra e modifiche richieste dal cliente.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setMostraForm((v) => !v)}
          className="btn-primary px-4 py-3 min-h-11 flex items-center gap-2"
        >
          <Plus size={18} aria-hidden="true" />
          Nuovo lavoro extra
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-[14px] border border-white/10 bg-black/[0.14] p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500 font-bold">
            Preventivo originale
          </p>
          <p className="text-2xl font-black mt-2">
            {formatEuro(riepilogo.preventivoOriginale)}
          </p>
        </div>
        <div className="rounded-[14px] border border-white/10 bg-black/[0.14] p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500 font-bold">
            Lavori extra
          </p>
          <p
            className={`text-2xl font-black mt-2 ${
              riepilogo.deltaVarianti >= 0 ? "text-emerald-300" : "text-red-200"
            }`}
          >
            {deltaLabel}
          </p>
        </div>
        <div className="rounded-[14px] border border-yellow-300/25 bg-yellow-400/10 p-4">
          <p className="text-xs uppercase tracking-wide text-yellow-100/80 font-bold">
            Totale attuale
          </p>
          <p className="text-2xl font-black mt-2 text-yellow-100">
            {formatEuro(riepilogo.totaleAggiornato)}
          </p>
        </div>
      </div>

      {mostraForm ? (
        <form
          onSubmit={salvaVariante}
          className="rounded-[14px] border border-white/10 bg-black/[0.18] p-4 space-y-3"
        >
          <div className="grid grid-cols-3 gap-2">
            {[
              TIPI_VARIANTE.AGGIUNTA,
              TIPI_VARIANTE.MODIFICA,
              TIPI_VARIANTE.RIMOZIONE,
            ].map((tipo) => (
              <button
                key={tipo}
                type="button"
                onClick={() => aggiornaCampo("tipo", tipo)}
                className={`min-h-11 rounded-[12px] text-xs font-black ${
                  form.tipo === tipo
                    ? tipo === TIPI_VARIANTE.RIMOZIONE
                      ? "bg-red-400 text-slate-950"
                      : "bg-emerald-400 text-slate-950"
                    : "bg-white/5 text-slate-300"
                }`}
              >
                {TIPI_VARIANTE_LABEL[tipo]}
              </button>
            ))}
          </div>

          <input
            value={form.titolo}
            onChange={(e) => aggiornaCampo("titolo", e.target.value)}
            placeholder="Titolo"
            className="input-pro"
            required
          />
          <input
            value={form.descrizione}
            onChange={(e) => aggiornaCampo("descrizione", e.target.value)}
            placeholder="Descrizione (opzionale)"
            className="input-pro"
          />
          <div className="grid gap-3 sm:grid-cols-3">
            <NumericInput
              min="0"
              value={form.quantita}
              inputMode="decimal"
              onChange={(valore) => aggiornaCampo("quantita", valore)}
              placeholder="Quantità"
              className="input-pro"
            />
            <NumericInput
              min="0"
              value={form.prezzoUnitario}
              inputMode="decimal"
              onChange={(valore) => aggiornaCampo("prezzoUnitario", valore)}
              placeholder="Prezzo unitario"
              className="input-pro"
            />
            <input
              value={form.unita}
              onChange={(e) => aggiornaCampo("unita", e.target.value)}
              placeholder="Unità"
              className="input-pro"
            />
          </div>
          <textarea
            value={form.note}
            onChange={(e) => aggiornaCampo("note", e.target.value)}
            placeholder="Note"
            rows={3}
            className="input-pro resize-none"
          />

          {errore ? (
            <p className="text-sm font-bold text-red-200">{errore}</p>
          ) : null}

          <div className="grid gap-2 sm:grid-cols-2">
            <button type="button" onClick={resetForm} className="btn-secondary min-h-11">
              Annulla
            </button>
            <button type="submit" className="btn-primary min-h-11">
              Salva proposta
            </button>
          </div>
        </form>
      ) : null}

      <div>
        <p className="text-sm font-black uppercase tracking-wide text-slate-400 mb-3">
          Elenco varianti
        </p>
        {riepilogo.varianti.length === 0 ? (
          <p className="text-slate-500 text-center py-4">
            Nessun lavoro extra registrato.
          </p>
        ) : (
          <ul className="space-y-2">
            {riepilogo.varianti.map((variante) => {
              const importo = importoSegnatoVariante(variante);
              const segno = importo >= 0 ? "+" : "";
              return (
                <li
                  key={variante.id}
                  className="rounded-[14px] border border-white/10 bg-black/[0.14] p-3 space-y-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs text-slate-500 font-bold">
                        {variante.dataCreazione}
                      </p>
                      <p className="font-black mt-1 truncate">
                        {variante.titolo || variante.descrizione}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {TIPI_VARIANTE_LABEL[variante.tipo] || variante.tipo}
                        {variante.quantita
                          ? ` · ${variante.quantita} ${variante.unita || "cad"}`
                          : null}
                      </p>
                    </div>
                    <div className="text-right shrink-0 space-y-1">
                      <span
                        className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${badgeClasseStato(variante.stato)}`}
                      >
                        {STATI_VARIANTE_LABEL[variante.stato] || variante.stato}
                      </span>
                      <p
                        className={`font-black ${
                          importo >= 0 ? "text-emerald-300" : "text-red-200"
                        }`}
                      >
                        {segno}
                        {formatEuro(Math.abs(importo))}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {variante.stato === STATI_VARIANTE.PROPOSTA ? (
                      <>
                        <button
                          type="button"
                          onClick={() => onApprovaVariante?.(variante.id)}
                          className="btn-secondary min-h-[40px] px-3 text-xs font-semibold flex items-center gap-1.5"
                        >
                          <Check size={14} aria-hidden="true" />
                          Approva
                        </button>
                        <button
                          type="button"
                          onClick={() => onAnnullaVariante?.(variante.id)}
                          className="btn-secondary min-h-[40px] px-3 text-xs font-semibold flex items-center gap-1.5 text-red-200"
                        >
                          <X size={14} aria-hidden="true" />
                          Annulla
                        </button>
                      </>
                    ) : null}
                    {variante.stato === STATI_VARIANTE.APPROVATA ? (
                      <>
                        <button
                          type="button"
                          onClick={() => onEseguiVariante?.(variante.id)}
                          className="btn-secondary min-h-[40px] px-3 text-xs font-semibold flex items-center gap-1.5"
                        >
                          <Play size={14} aria-hidden="true" />
                          Esegui
                        </button>
                        <button
                          type="button"
                          onClick={() => onAnnullaVariante?.(variante.id)}
                          className="btn-secondary min-h-[40px] px-3 text-xs font-semibold flex items-center gap-1.5 text-red-200"
                        >
                          <X size={14} aria-hidden="true" />
                          Annulla
                        </button>
                      </>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {timeline.length > 0 ? (
        <div className="pt-2 border-t border-white/[0.06]">
          <h4 className="text-[12px] font-medium text-slate-400 mb-2">
            Timeline varianti
          </h4>
          <ol className="space-y-1" aria-label="Timeline varianti">
            {timeline.slice(0, 8).map((evento) => (
              <li key={evento.id} className="text-xs text-slate-300 flex gap-2">
                <span className="text-yellow-200/80">•</span>
                <span>{evento.label || evento.tipo}</span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      {dialogoPreventivo ? (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 px-4 safe-bottom"
          role="dialog"
          aria-modal="true"
          aria-labelledby="variante-preventivo-title"
        >
          <div className="w-full max-w-md pro-panel-strong p-5 space-y-4 mb-4 sm:mb-0 ux-sheet">
            <h2 id="variante-preventivo-title" className="text-xl font-black">
              Aggiornare anche il preventivo?
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Il lavoro extra è già sul cantiere. Puoi copiarlo anche sul
              preventivo collegato.
            </p>
            <div className="grid gap-2">
              <button
                type="button"
                onClick={aggiornaAnchePreventivo}
                className="btn-primary min-h-[52px] font-black"
              >
                Aggiorna
              </button>
              <button
                type="button"
                onClick={() => setDialogoPreventivo(null)}
                className="btn-secondary min-h-[48px] font-bold"
              >
                Solo cantiere
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
