import { useMemo, useState } from "react";
import { ClipboardList, Download, Plus, Trash2 } from "lucide-react";

import NumericInput from "../../../components/NumericInput";
import { formatEuro } from "../../../utils/preventivi";
import {
  creaVarianteCantiere,
  importoSegnatoVariante,
  riepilogoEconomicoCantiere,
} from "../cantiereVariantiDomain";

const FORM_INIZIALE = {
  tipo: "aggiunta",
  descrizione: "",
  categoria: "",
  quantita: "1",
  prezzoUnitario: "",
  note: "",
};

/**
 * Card Varianti di Cantiere: riepilogo, form aggiunta, storico, PDF.
 */
export default function CantiereVarianti({
  cantiere,
  sezioneRef,
  onAggiungiVariante,
  onEliminaVariante,
  onEsportaPdf,
}) {
  const [mostraForm, setMostraForm] = useState(false);
  const [form, setForm] = useState(FORM_INIZIALE);
  const [errore, setErrore] = useState("");
  const [esportazione, setEsportazione] = useState(false);

  const riepilogo = useMemo(
    () => riepilogoEconomicoCantiere(cantiere),
    [cantiere]
  );

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
      const variante = creaVarianteCantiere(form);
      onAggiungiVariante?.(variante);
      resetForm();
    } catch (e) {
      setErrore(e.message || "Impossibile salvare la variante.");
    }
  }

  async function esportaPdf() {
    if (!onEsportaPdf) return;
    setEsportazione(true);
    try {
      await onEsportaPdf();
    } finally {
      setEsportazione(false);
    }
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
              Varianti di Cantiere
            </h3>
            <p className="text-sm text-slate-400 mt-1">
              Extra e modifiche dopo l&apos;accordo iniziale. Il preventivo resta
              invariato.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {onEsportaPdf ? (
            <button
              type="button"
              onClick={esportaPdf}
              disabled={esportazione}
              className="btn-secondary px-4 py-3 min-h-11 flex items-center gap-2 disabled:opacity-45"
            >
              <Download size={18} />
              PDF
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setMostraForm((v) => !v)}
            className="btn-primary px-4 py-3 min-h-11 flex items-center gap-2"
          >
            <Plus size={18} />
            Aggiungi Variante
          </button>
        </div>
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
            Varianti
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
            Totale aggiornato
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
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => aggiornaCampo("tipo", "aggiunta")}
              className={`min-h-11 rounded-[12px] font-black ${
                form.tipo === "aggiunta"
                  ? "bg-emerald-400 text-slate-950"
                  : "bg-white/5 text-slate-300"
              }`}
            >
              (+) Aggiunta
            </button>
            <button
              type="button"
              onClick={() => aggiornaCampo("tipo", "rimozione")}
              className={`min-h-11 rounded-[12px] font-black ${
                form.tipo === "rimozione"
                  ? "bg-red-400 text-slate-950"
                  : "bg-white/5 text-slate-300"
              }`}
            >
              (−) Rimozione
            </button>
          </div>

          <input
            value={form.descrizione}
            onChange={(e) => aggiornaCampo("descrizione", e.target.value)}
            placeholder="Descrizione"
            className="input-pro"
            required
          />
          <input
            value={form.categoria}
            onChange={(e) => aggiornaCampo("categoria", e.target.value)}
            placeholder="Categoria (opzionale)"
            className="input-pro"
          />
          <div className="grid gap-3 sm:grid-cols-2">
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
              Salva variante
            </button>
          </div>
        </form>
      ) : null}

      <div>
        <p className="text-sm font-black uppercase tracking-wide text-slate-400 mb-3">
          Storico
        </p>
        {riepilogo.varianti.length === 0 ? (
          <p className="text-slate-500 text-center py-4">
            Nessuna variante registrata.
          </p>
        ) : (
          <ul className="space-y-2">
            {[...riepilogo.varianti].reverse().map((variante) => {
              const importo = importoSegnatoVariante(variante);
              const segno = importo >= 0 ? "+" : "";
              return (
                <li
                  key={variante.id}
                  className="rounded-[14px] border border-white/10 bg-black/[0.14] p-3 flex items-start justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 font-bold">{variante.data}</p>
                    <p className="font-black mt-1 truncate">
                      {variante.tipo === "rimozione" ? "− " : "+ "}
                      {variante.descrizione}
                    </p>
                    {variante.categoria ? (
                      <p className="text-sm text-slate-400 mt-1">
                        {variante.categoria}
                        {variante.quantita
                          ? ` · ${variante.quantita} × ${formatEuro(variante.prezzoUnitario)}`
                          : null}
                      </p>
                    ) : null}
                    {variante.note ? (
                      <p className="text-sm text-slate-500 mt-1">{variante.note}</p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`font-black ${
                        importo >= 0 ? "text-emerald-300" : "text-red-200"
                      }`}
                    >
                      {segno}
                      {formatEuro(Math.abs(importo))}
                    </span>
                    <button
                      type="button"
                      onClick={() => onEliminaVariante?.(variante.id)}
                      className="min-h-11 min-w-11 rounded-[12px] bg-red-500/10 text-red-100 flex items-center justify-center"
                      aria-label="Elimina variante"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
