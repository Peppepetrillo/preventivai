import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";

import BottomSheet from "../../../components/BottomSheet";
import ConfirmDialog from "../../../components/ConfirmDialog";
import NumericInput from "../../../components/NumericInput";
import DatePickerField from "../../agenda/components/DatePickerField";
import {
  CATEGORIE_SPESA,
  ETICHETTE_CATEGORIA_SPESA,
  ETICHETTE_METODO_PAGAMENTO_SPESA,
  METODI_PAGAMENTO_SPESA,
} from "../services/speseCantiereService";
import { leggiProgrammazione } from "../services/programmazioneCantiereService";

const FORM_VUOTO = {
  descrizione: "",
  importo: "",
  data: "",
  categoria: CATEGORIE_SPESA.materiali,
  fornitore: "",
  metodoPagamento: "",
  giornataId: "",
  note: "",
};

/**
 * Bottom sheet crea/modifica spesa cantiere (UX-Spese v1).
 */
export default function SpesaSheet({
  open,
  onClose,
  spesa = null,
  cantiere = {},
  onSalva,
  onElimina,
}) {
  const inModifica = Boolean(spesa?.id);
  const [form, setForm] = useState(FORM_VUOTO);
  const [errore, setErrore] = useState("");
  const [confermaElimina, setConfermaElimina] = useState(false);
  const [salvataggioInCorso, setSalvataggioInCorso] = useState(false);

  const giornate = leggiProgrammazione(cantiere);

  useEffect(() => {
    if (!open) {
      setSalvataggioInCorso(false);
      return;
    }
    setErrore("");
    setConfermaElimina(false);
    setSalvataggioInCorso(false);
    if (spesa) {
      setForm({
        descrizione: spesa.descrizione || "",
        importo: spesa.importo != null ? String(spesa.importo) : "",
        data: spesa.data || "",
        categoria: spesa.categoria || CATEGORIE_SPESA.altro,
        fornitore: spesa.fornitore || "",
        metodoPagamento: spesa.metodoPagamento || "",
        giornataId: spesa.giornataId || "",
        note: spesa.note || "",
      });
    } else {
      setForm({
        ...FORM_VUOTO,
        data: new Date().toLocaleDateString("it-IT"),
      });
    }
  }, [open, spesa]);

  function aggiorna(campo, valore) {
    setForm((prev) => ({ ...prev, [campo]: valore }));
  }

  function gestisciSalva() {
    if (salvataggioInCorso) return;
    const descrizione = String(form.descrizione || "").trim();
    if (!descrizione) {
      setErrore("Inserisci una descrizione.");
      return;
    }
    const data = String(form.data || "").trim();
    if (!data) {
      setErrore("Seleziona una data.");
      return;
    }
    const importo = Number(String(form.importo || "").replace(",", "."));
    if (!(importo > 0)) {
      setErrore("Inserisci un importo maggiore di zero.");
      return;
    }

    setSalvataggioInCorso(true);
    onSalva?.({
      ...(inModifica ? { id: spesa.id } : {}),
      descrizione,
      data,
      importo,
      categoria: form.categoria,
      fornitore: String(form.fornitore || "").trim(),
      metodoPagamento: form.metodoPagamento || "",
      giornataId: form.giornataId || "",
      note: String(form.note || "").trim(),
    });
    onClose?.();
  }

  return (
    <>
      <BottomSheet
        open={open && !confermaElimina}
        onClose={onClose}
        title={inModifica ? "Modifica spesa" : "Aggiungi spesa"}
      >
        <div className="space-y-4 pb-4" data-testid="spesa-sheet">
          <label className="block">
            <span className="ds-text-secondary text-xs font-bold uppercase tracking-wide">
              Descrizione
            </span>
            <input
              type="text"
              value={form.descrizione}
              onChange={(e) => aggiorna("descrizione", e.target.value)}
              placeholder="Es. Carburante furgone"
              className="mt-1 w-full min-h-[48px] rounded-[16px] bg-white/5 border border-white/10 px-4 ds-text-primary"
              data-testid="spesa-descrizione"
            />
          </label>

          <label className="block">
            <span className="ds-text-secondary text-xs font-bold uppercase tracking-wide">
              Importo
            </span>
            <NumericInput
              value={form.importo}
              onChange={(valore) => aggiorna("importo", valore)}
              min={0}
              className="mt-1 w-full min-h-[48px]"
              data-testid="spesa-importo"
            />
          </label>

          <DatePickerField
            label="Data"
            value={form.data}
            onChange={(data) => aggiorna("data", data)}
          />

          <fieldset>
            <legend className="ds-text-secondary text-xs font-bold uppercase tracking-wide">
              Categoria
            </legend>
            <div
              className="mt-2 grid grid-cols-2 gap-2"
              data-testid="spesa-categoria"
            >
              {Object.values(CATEGORIE_SPESA).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => aggiorna("categoria", cat)}
                  className={`min-h-[44px] rounded-[16px] border px-2 text-sm font-medium ${
                    form.categoria === cat
                      ? "border-yellow-400/50 bg-yellow-400/15 text-yellow-100"
                      : "border-white/10 bg-white/5 ds-text-primary"
                  }`}
                  aria-pressed={form.categoria === cat}
                >
                  {ETICHETTE_CATEGORIA_SPESA[cat]}
                </button>
              ))}
            </div>
          </fieldset>

          <label className="block">
            <span className="ds-text-secondary text-xs font-bold uppercase tracking-wide">
              Fornitore (opzionale)
            </span>
            <input
              type="text"
              value={form.fornitore}
              onChange={(e) => aggiorna("fornitore", e.target.value)}
              placeholder="Es. Bricoman"
              className="mt-1 w-full min-h-[48px] rounded-[16px] bg-white/5 border border-white/10 px-4 ds-text-primary"
              data-testid="spesa-fornitore"
            />
          </label>

          <fieldset>
            <legend className="ds-text-secondary text-xs font-bold uppercase tracking-wide">
              Metodo pagamento (opzionale)
            </legend>
            <div
              className="mt-2 grid grid-cols-2 gap-2"
              data-testid="spesa-metodo"
            >
              <button
                type="button"
                onClick={() => aggiorna("metodoPagamento", "")}
                className={`min-h-[44px] rounded-[16px] border px-2 text-sm font-medium ${
                  !form.metodoPagamento
                    ? "border-yellow-400/50 bg-yellow-400/15 text-yellow-100"
                    : "border-white/10 bg-white/5 ds-text-primary"
                }`}
              >
                —
              </button>
              {Object.values(METODI_PAGAMENTO_SPESA).map((metodo) => (
                <button
                  key={metodo}
                  type="button"
                  onClick={() => aggiorna("metodoPagamento", metodo)}
                  className={`min-h-[44px] rounded-[16px] border px-2 text-sm font-medium ${
                    form.metodoPagamento === metodo
                      ? "border-yellow-400/50 bg-yellow-400/15 text-yellow-100"
                      : "border-white/10 bg-white/5 ds-text-primary"
                  }`}
                  aria-pressed={form.metodoPagamento === metodo}
                >
                  {ETICHETTE_METODO_PAGAMENTO_SPESA[metodo]}
                </button>
              ))}
            </div>
          </fieldset>

          {giornate.length > 0 ? (
            <label className="block">
              <span className="ds-text-secondary text-xs font-bold uppercase tracking-wide">
                Giornata (opzionale)
              </span>
              <select
                value={form.giornataId}
                onChange={(e) => aggiorna("giornataId", e.target.value)}
                className="mt-1 w-full min-h-[48px] rounded-[16px] bg-white/5 border border-white/10 px-4 ds-text-primary"
                data-testid="spesa-giornata"
              >
                <option value="">Nessuna giornata</option>
                {giornate.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.data}
                    {g.attivita ? ` — ${g.attivita}` : ""}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <label className="block">
            <span className="ds-text-secondary text-xs font-bold uppercase tracking-wide">
              Note (opzionale)
            </span>
            <textarea
              value={form.note}
              onChange={(e) => aggiorna("note", e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-[16px] bg-white/5 border border-white/10 px-4 py-3 ds-text-primary"
              data-testid="spesa-note"
            />
          </label>

          {errore ? (
            <p className="text-sm text-red-300" role="alert" data-testid="spesa-errore">
              {errore}
            </p>
          ) : null}

          <button
            type="button"
            onClick={gestisciSalva}
            disabled={salvataggioInCorso}
            className="btn-primary w-full min-h-[48px] disabled:opacity-60"
            data-testid="spesa-salva"
          >
            {salvataggioInCorso ? "Salvataggio…" : "Salva"}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="btn-secondary w-full min-h-[48px]"
            data-testid="spesa-annulla"
          >
            Annulla
          </button>

          {inModifica ? (
            <button
              type="button"
              onClick={() => setConfermaElimina(true)}
              className="btn-danger w-full min-h-[48px] flex items-center justify-center gap-2"
              data-testid="spesa-elimina"
            >
              <Trash2 size={18} aria-hidden="true" />
              Elimina spesa
            </button>
          ) : null}
        </div>
      </BottomSheet>

      <ConfirmDialog
        open={confermaElimina}
        title="Eliminare questa spesa?"
        description="La spesa verrà rimossa dal registro del cantiere."
        confirmLabel="Elimina"
        cancelLabel="Annulla"
        onConfirm={() => {
          onElimina?.(spesa.id);
          setConfermaElimina(false);
          onClose?.();
        }}
        onCancel={() => setConfermaElimina(false)}
        testId="conferma-elimina-spesa"
      />
    </>
  );
}
