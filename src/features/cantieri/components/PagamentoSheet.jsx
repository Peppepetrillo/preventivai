import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";

import BottomSheet from "../../../components/BottomSheet";
import ConfirmDialog from "../../../components/ConfirmDialog";
import NumericInput from "../../../components/NumericInput";
import DatePickerField from "../../agenda/components/DatePickerField";
import { formatEuro, normalizzaNumero } from "../../../utils/preventivi";
import {
  ETICHETTE_METODO_PAGAMENTO,
  ETICHETTE_TIPO_PAGAMENTO,
  METODI_PAGAMENTO,
  TIPI_PAGAMENTO,
} from "../services/pagamentiCantiereService";

const FORM_VUOTO = {
  importo: "",
  data: "",
  tipo: TIPI_PAGAMENTO.acconto,
  metodo: METODI_PAGAMENTO.contanti,
  note: "",
};

/**
 * Bottom sheet crea/modifica pagamento cantiere (UX-7.5).
 */
export default function PagamentoSheet({
  open,
  onClose,
  pagamento = null,
  rimanenza = 0,
  importoIniziale = null,
  tipoIniziale = null,
  onSalva,
  onElimina,
}) {
  const inModifica = Boolean(pagamento?.id);
  const [form, setForm] = useState(FORM_VUOTO);
  const [errore, setErrore] = useState("");
  const [warningOverpay, setWarningOverpay] = useState(false);
  const [confermaElimina, setConfermaElimina] = useState(false);
  const [salvataggioInCorso, setSalvataggioInCorso] = useState(false);
  useEffect(() => {
    if (!open) {
      setSalvataggioInCorso(false);
      return;
    }
    setErrore("");
    setWarningOverpay(false);
    setConfermaElimina(false);
    setSalvataggioInCorso(false);
    if (pagamento) {
      setForm({
        importo: pagamento.importo != null ? String(pagamento.importo) : "",
        data: pagamento.data || "",
        tipo: pagamento.tipo || TIPI_PAGAMENTO.acconto,
        metodo: pagamento.metodo || METODI_PAGAMENTO.contanti,
        note: pagamento.note || "",
      });
    } else {
      const importo =
        importoIniziale != null && Number(importoIniziale) > 0
          ? String(importoIniziale)
          : "";
      const tipo =
        tipoIniziale && Object.values(TIPI_PAGAMENTO).includes(tipoIniziale)
          ? tipoIniziale
          : TIPI_PAGAMENTO.acconto;
      setForm({
        ...FORM_VUOTO,
        data: new Date().toLocaleDateString("it-IT"),
        importo,
        tipo,
      });
    }
  }, [open, pagamento, importoIniziale, tipoIniziale]);

  function aggiorna(campo, valore) {
    setForm((prev) => ({ ...prev, [campo]: valore }));
    setWarningOverpay(false);
  }

  function gestisciSalva({ forzaOverpay = false } = {}) {
    if (salvataggioInCorso) return;
    const data = String(form.data || "").trim();
    if (!data) {
      setErrore("Seleziona una data.");
      return;
    }
    const importo = normalizzaNumero(form.importo);
    if (!(importo > 0)) {
      setErrore("Inserisci un importo maggiore di zero.");
      return;
    }

    const importoPrecedente = inModifica
      ? normalizzaNumero(pagamento?.importo)
      : 0;
    const rimanenzaEffettiva = Math.max(rimanenza + importoPrecedente, 0);
    if (!forzaOverpay && importo > rimanenzaEffettiva && rimanenzaEffettiva >= 0) {
      setWarningOverpay(true);
      setErrore(
        `L'importo supera la rimanenza (${formatEuro(rimanenzaEffettiva)}). Puoi salvare comunque.`
      );
      return;
    }

    setSalvataggioInCorso(true);
    onSalva?.({
      ...(inModifica ? { id: pagamento.id } : {}),
      data,
      importo,
      tipo: form.tipo,
      metodo: form.metodo,
      note: String(form.note || "").trim(),
    });
    onClose?.();
  }

  const titoloSheet = inModifica
    ? "Modifica pagamento"
    : tipoIniziale === TIPI_PAGAMENTO.saldo && importoIniziale != null
      ? "Registra saldo"
      : "Registra pagamento";
  const descrizioneSheet =
    !inModifica &&
    tipoIniziale === TIPI_PAGAMENTO.saldo &&
    importoIniziale != null
      ? "Importo e tipo Saldo già impostati. Controlla e salva."
      : undefined;

  return (
    <>
      <BottomSheet
        open={open && !confermaElimina}
        onClose={onClose}
        title={titoloSheet}
        descrizione={descrizioneSheet}
      >
        <div className="space-y-4 pb-4" data-testid="pagamento-sheet">
          <label className="block">
            <span className="ds-text-secondary text-xs font-bold uppercase tracking-wide">
              Importo
            </span>
            <NumericInput
              value={form.importo}
              onChange={(valore) => aggiorna("importo", valore)}
              min={0}
              className="mt-1 w-full min-h-[48px]"
              data-testid="pagamento-importo"
            />
          </label>

          <DatePickerField
            label="Data"
            value={form.data}
            onChange={(data) => aggiorna("data", data)}
          />

          <fieldset>
            <legend className="ds-text-secondary text-xs font-bold uppercase tracking-wide">
              Tipo
            </legend>
            <div className="mt-2 grid grid-cols-3 gap-2" data-testid="pagamento-tipo">
              {Object.values(TIPI_PAGAMENTO).map((tipo) => (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => aggiorna("tipo", tipo)}
                  className={`min-h-[44px] rounded-[16px] border px-2 text-sm font-medium ${
                    form.tipo === tipo
                      ? "border-yellow-400/50 bg-yellow-400/15 text-yellow-100"
                      : "border-white/10 bg-white/5 ds-text-primary"
                  }`}
                  aria-pressed={form.tipo === tipo}
                >
                  {ETICHETTE_TIPO_PAGAMENTO[tipo]}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="ds-text-secondary text-xs font-bold uppercase tracking-wide">
              Metodo
            </legend>
            <div className="mt-2 grid grid-cols-2 gap-2" data-testid="pagamento-metodo">
              {Object.values(METODI_PAGAMENTO).map((metodo) => (
                <button
                  key={metodo}
                  type="button"
                  onClick={() => aggiorna("metodo", metodo)}
                  className={`min-h-[44px] rounded-[16px] border px-2 text-sm font-medium ${
                    form.metodo === metodo
                      ? "border-yellow-400/50 bg-yellow-400/15 text-yellow-100"
                      : "border-white/10 bg-white/5 ds-text-primary"
                  }`}
                  aria-pressed={form.metodo === metodo}
                >
                  {ETICHETTE_METODO_PAGAMENTO[metodo]}
                </button>
              ))}
            </div>
          </fieldset>

          <label className="block">
            <span className="ds-text-secondary text-xs font-bold uppercase tracking-wide">
              Note (opzionale)
            </span>
            <textarea
              value={form.note}
              onChange={(e) => aggiorna("note", e.target.value)}
              rows={2}
              placeholder="Es. Bonifico cliente"
              className="mt-1 w-full rounded-[16px] bg-white/5 border border-white/10 px-4 py-3 ds-text-primary"
              data-testid="pagamento-note"
            />
          </label>

          {errore ? (
            <p
              className={`text-sm ${warningOverpay ? "text-amber-200" : "text-red-300"}`}
              role="alert"
              data-testid="pagamento-errore"
            >
              {errore}
            </p>
          ) : null}

          {warningOverpay ? (
            <button
              type="button"
              onClick={() => gestisciSalva({ forzaOverpay: true })}
              disabled={salvataggioInCorso}
              className="btn-secondary w-full min-h-[48px] disabled:opacity-60"
              data-testid="pagamento-salva-overpay"
            >
              Salva comunque
            </button>
          ) : (
            <button
              type="button"
              onClick={() => gestisciSalva()}
              disabled={salvataggioInCorso}
              className="btn-primary w-full min-h-[48px] disabled:opacity-60"
              data-testid="pagamento-salva"
            >
              {salvataggioInCorso ? "Salvataggio…" : "Salva"}
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="btn-secondary w-full min-h-[48px]"
            data-testid="pagamento-annulla"
          >
            Annulla
          </button>

          {inModifica ? (
            <button
              type="button"
              onClick={() => setConfermaElimina(true)}
              className="btn-danger w-full min-h-[48px] flex items-center justify-center gap-2"
              data-testid="pagamento-elimina"
            >
              <Trash2 size={18} aria-hidden="true" />
              Elimina pagamento
            </button>
          ) : null}
        </div>
      </BottomSheet>

      <ConfirmDialog
        open={confermaElimina}
        title="Eliminare questo pagamento?"
        description="L'importo verrà tolto dal totale incassato. Il cantiere resta invariato."
        confirmLabel="Elimina"
        cancelLabel="Annulla"
        onConfirm={() => {
          onElimina?.(pagamento.id);
          setConfermaElimina(false);
          onClose?.();
        }}
        onCancel={() => setConfermaElimina(false)}
        testId="conferma-elimina-pagamento"
      />
    </>
  );
}
