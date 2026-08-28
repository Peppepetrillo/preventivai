import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";

import BottomSheet from "../../../components/BottomSheet";
import ConfirmDialog from "../../../components/ConfirmDialog";
import NumericInput from "../../../components/NumericInput";
import DatePickerField from "../../agenda/components/DatePickerField";
import { formattaNomiOperai, normalizzaNomiOperai } from "../services/registroGiornateService";

const FORM_VUOTO = {
  data: "",
  operaiTesto: "Io",
  oreLavorate: "8",
  attivita: "",
  note: "",
};

/**
 * Sheet crea/modifica giornata lavorativa (UX-7.4).
 * Usabile dal cantiere (cantiere fisso) o da Agenda (con selettore cantiere).
 */
export default function GiornataLavorativaSheet({
  open,
  onClose,
  giornata = null,
  onSalva,
  onElimina,
  cantieriOpzioni = null,
  cantiereIdFisso = "",
  dataDefault = "",
  valoriIniziali = null,
}) {
  const inModifica = Boolean(giornata?.id);
  const mostraSelettoreCantiere =
    !inModifica && Array.isArray(cantieriOpzioni) && !cantiereIdFisso;
  const [form, setForm] = useState(FORM_VUOTO);
  const [cantiereId, setCantiereId] = useState("");
  const [errore, setErrore] = useState("");
  const [confermaElimina, setConfermaElimina] = useState(false);
  const [salvataggioInCorso, setSalvataggioInCorso] = useState(false);
  useEffect(() => {
    if (!open) {
      setSalvataggioInCorso(false);
      return;
    }
    setErrore("");
    setConfermaElimina(false);
    setSalvataggioInCorso(false);
    if (giornata) {
      setForm({
        data: giornata.data || "",
        operaiTesto: formattaNomiOperai(giornata.operai).replace(" + ", ", "),
        oreLavorate: String(giornata.oreLavorate ?? 8),
        attivita: giornata.attivita || "",
        note: giornata.note || "",
      });
      setCantiereId(String(giornata.cantiereId || cantiereIdFisso || ""));
    } else {
      const base = { ...FORM_VUOTO, data: dataDefault || new Date().toLocaleDateString("it-IT") };
      if (valoriIniziali && typeof valoriIniziali === "object") {
        setForm({
          data: valoriIniziali.data || base.data,
          operaiTesto: valoriIniziali.operaiTesto || base.operaiTesto,
          oreLavorate: valoriIniziali.oreLavorate ?? base.oreLavorate,
          attivita: valoriIniziali.attivita || "",
          note: valoriIniziali.note || "",
        });
        setCantiereId(
          String(valoriIniziali.cantiereId || cantiereIdFisso || "")
        );
      } else {
        setForm(base);
        setCantiereId(String(cantiereIdFisso || ""));
      }
    }
  }, [open, giornata, cantiereIdFisso, dataDefault, valoriIniziali]);

  function aggiorna(campo, valore) {
    setForm((prev) => ({ ...prev, [campo]: valore }));
  }

  function gestisciSalva() {
    if (salvataggioInCorso) return;
    const data = String(form.data || "").trim();
    if (!data) {
      setErrore("Seleziona una data.");
      return;
    }
    const targetCantiere = String(
      inModifica ? giornata.cantiereId || cantiereIdFisso : cantiereId || cantiereIdFisso
    ).trim();
    if (mostraSelettoreCantiere && !targetCantiere) {
      setErrore("Seleziona un cantiere.");
      return;
    }
    const operai = normalizzaNomiOperai(form.operaiTesto);
    if (operai.length === 0) {
      setErrore("Indica almeno un operaio (es. Marco).");
      return;
    }
    const oreLavorate = Math.max(0, Number(form.oreLavorate) || 0);
    setSalvataggioInCorso(true);
    onSalva?.({
      ...(inModifica ? { id: giornata.id } : {}),
      cantiereId: targetCantiere,
      data,
      operai,
      oreLavorate,
      attivita: String(form.attivita || "").trim(),
      note: String(form.note || "").trim(),
    });
    onClose?.();
  }

  const descrizioneSheet =
    !inModifica && valoriIniziali
      ? "Controlla ore e attività dal previsto, poi salva."
      : undefined;

  return (
    <>
      <BottomSheet
        open={open && !confermaElimina}
        onClose={onClose}
        title={inModifica ? "Modifica consuntivo" : "Registra consuntivo"}
        descrizione={descrizioneSheet}
      >
        <div className="space-y-4 pb-4" data-testid="giornata-lavorativa-sheet">
          {mostraSelettoreCantiere ? (
            <label className="block">
              <span className="ds-text-secondary text-xs font-bold uppercase tracking-wide">
                Cantiere
              </span>
              <select
                value={cantiereId}
                onChange={(e) => setCantiereId(e.target.value)}
                className="mt-1 w-full min-h-[48px] rounded-[16px] bg-white/5 border border-white/10 px-4 ds-text-primary"
                data-testid="registro-cantiere"
              >
                <option value="">Seleziona cantiere…</option>
                {cantieriOpzioni.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.nome || c.cliente || `Cantiere ${c.id}`}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <DatePickerField
            label="Data"
            value={form.data}
            onChange={(data) => aggiorna("data", data)}
          />

          <label className="block">
            <span className="ds-text-secondary text-xs font-bold uppercase tracking-wide">
              Operaio/i
            </span>
            <input
              type="text"
              value={form.operaiTesto}
              onChange={(e) => aggiorna("operaiTesto", e.target.value)}
              placeholder="Es. Marco, Luca"
              className="mt-1 w-full min-h-[48px] rounded-[16px] bg-white/5 border border-white/10 px-4 ds-text-primary"
              data-testid="registro-operai"
            />
          </label>

          <label className="block">
            <span className="ds-text-secondary text-xs font-bold uppercase tracking-wide">
              Ore lavorate
            </span>
            <NumericInput
              value={form.oreLavorate}
              onChange={(valore) => aggiorna("oreLavorate", valore)}
              min={0}
              step={0.5}
              className="mt-1 w-full min-h-[48px]"
              data-testid="registro-ore"
            />
          </label>

          <label className="block">
            <span className="ds-text-secondary text-xs font-bold uppercase tracking-wide">
              Lavoro svolto
            </span>
            <input
              type="text"
              value={form.attivita}
              onChange={(e) => aggiorna("attivita", e.target.value)}
              placeholder="Es. Tracce"
              className="mt-1 w-full min-h-[48px] rounded-[16px] bg-white/5 border border-white/10 px-4 ds-text-primary"
              data-testid="registro-attivita"
            />
          </label>

          <label className="block">
            <span className="ds-text-secondary text-xs font-bold uppercase tracking-wide">
              Note
            </span>
            <textarea
              value={form.note}
              onChange={(e) => aggiorna("note", e.target.value)}
              rows={3}
              placeholder="Cosa è stato fatto davvero…"
              className="mt-1 w-full rounded-[16px] bg-white/5 border border-white/10 px-4 py-3 ds-text-primary"
              data-testid="registro-note"
            />
          </label>

          {errore ? (
            <p className="text-sm text-red-300" role="alert">
              {errore}
            </p>
          ) : null}

          <button
            type="button"
            onClick={gestisciSalva}
            disabled={salvataggioInCorso}
            className="btn-primary w-full min-h-[48px] disabled:opacity-60"
            data-testid="registro-salva"
          >
            {salvataggioInCorso ? "Salvataggio…" : "Salva"}
          </button>

          {inModifica ? (
            <button
              type="button"
              onClick={() => setConfermaElimina(true)}
              className="btn-danger w-full min-h-[48px] flex items-center justify-center gap-2"
              data-testid="registro-elimina"
            >
              <Trash2 size={18} aria-hidden="true" />
              Elimina consuntivo
            </button>
          ) : null}
        </div>
      </BottomSheet>

      <ConfirmDialog
        open={confermaElimina}
        title="Eliminare questo consuntivo?"
        description="Le ore registrate spariranno dal cantiere e dall'Agenda. Il previsto resta invariato."
        confirmLabel="Elimina"
        cancelLabel="Annulla"
        onConfirm={() => {
          onElimina?.(giornata.id);
          setConfermaElimina(false);
          onClose?.();
        }}
        onCancel={() => setConfermaElimina(false)}
        testId="conferma-elimina-registro"
      />
    </>
  );
}
