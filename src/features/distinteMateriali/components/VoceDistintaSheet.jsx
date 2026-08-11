import { useId, useState } from "react";

import BottomSheet from "../../../components/BottomSheet";
import NumericInput from "../../../components/NumericInput";
import { UNITA_MATERIALE_CANONICHE } from "../../../domain/catalogoMateriali/materialiTypes";

/**
 * Voce libera (senza catalogo) o modifica voce esistente.
 */
export default function VoceDistintaSheet({
  open,
  onClose,
  voce = null,
  onSalva,
  titolo = null,
}) {
  const isNuova = !voce;

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={titolo || (isNuova ? "Voce libera" : "Modifica materiale")}
      descrizione={
        isNuova
          ? "Aggiungi un materiale senza catalogo."
          : "Aggiorna quantità, unità o note."
      }
      zIndex={80}
    >
      {open ? (
        <VoceForm
          key={voce?.id ?? "nuova-voce"}
          voce={voce}
          onClose={onClose}
          onSalva={onSalva}
        />
      ) : null}
    </BottomSheet>
  );
}

function VoceForm({ voce, onClose, onSalva }) {
  const baseId = useId();
  const [form, setForm] = useState(() => ({
    nome: voce?.nome || "",
    quantita: voce?.quantita ?? 1,
    unita: voce?.unita || "pz",
    prezzoUnitario:
      voce?.prezzoUnitario != null ? String(voce.prezzoUnitario) : "",
    note: voce?.note || "",
  }));
  const [errore, setErrore] = useState("");

  function aggiorna(campo, valore) {
    setForm((prev) => ({ ...prev, [campo]: valore }));
  }

  function gestisciSalva() {
    const nome = String(form.nome || "").trim();
    if (!nome) {
      setErrore("Inserisci il nome del materiale.");
      return;
    }
    const quantita = Number(form.quantita);
    if (!Number.isFinite(quantita) || quantita <= 0) {
      setErrore("Inserisci una quantità valida.");
      return;
    }
    const unita = String(form.unita || "pz").trim() || "pz";

    /** @type {object} */
    const payload = {
      nome,
      quantita,
      unita,
      note: String(form.note || "").trim(),
    };

    if (form.prezzoUnitario !== "" && form.prezzoUnitario != null) {
      const p = Number(form.prezzoUnitario);
      if (Number.isFinite(p) && p >= 0) payload.prezzoUnitario = p;
    }

    // Voce libera: nessun id catalogo
    if (!voce?.famigliaId && !voce?.varianteId) {
      payload.famigliaId = undefined;
      payload.varianteId = undefined;
    } else {
      if (voce.famigliaId) payload.famigliaId = voce.famigliaId;
      if (voce.varianteId) payload.varianteId = voce.varianteId;
    }

    const ok = onSalva?.(payload, voce?.id);
    if (ok !== false) onClose?.();
  }

  return (
    <div className="space-y-4 pb-2">
      {errore ? (
        <p className="text-sm text-red-300" role="alert">
          {errore}
        </p>
      ) : null}

      <label className="block">
        <span className="ds-text-secondary text-xs font-bold uppercase tracking-wide">
          Nome
        </span>
        <input
          id={`${baseId}-nome`}
          className="mt-1.5 w-full min-h-[48px] rounded-[16px] border border-white/10 bg-black/30 px-4 text-white"
          value={form.nome}
          onChange={(e) => aggiorna("nome", e.target.value)}
          placeholder="Es. Tubo corrugato Ø25"
          autoFocus
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="ds-text-secondary text-xs font-bold uppercase tracking-wide">
            Quantità
          </span>
          <NumericInput
            className="mt-1.5 w-full min-h-[48px] rounded-[16px] border border-white/10 bg-black/30 px-4 text-white"
            value={form.quantita}
            onChange={(v) => aggiorna("quantita", v)}
            min={0}
          />
        </label>
        <label className="block">
          <span className="ds-text-secondary text-xs font-bold uppercase tracking-wide">
            Unità
          </span>
          <select
            className="mt-1.5 w-full min-h-[48px] rounded-[16px] border border-white/10 bg-black/30 px-3 text-white"
            value={form.unita}
            onChange={(e) => aggiorna("unita", e.target.value)}
          >
            {UNITA_MATERIALE_CANONICHE.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block">
        <span className="ds-text-secondary text-xs font-bold uppercase tracking-wide">
          Prezzo unitario (opzionale)
        </span>
        <NumericInput
          className="mt-1.5 w-full min-h-[48px] rounded-[16px] border border-white/10 bg-black/30 px-4 text-white"
          value={form.prezzoUnitario}
          onChange={(v) => aggiorna("prezzoUnitario", v)}
          min={0}
          placeholder="0,00"
        />
      </label>

      <label className="block">
        <span className="ds-text-secondary text-xs font-bold uppercase tracking-wide">
          Note
        </span>
        <textarea
          className="mt-1.5 w-full min-h-[72px] rounded-[16px] border border-white/10 bg-black/30 px-4 py-3 text-white"
          value={form.note}
          onChange={(e) => aggiorna("note", e.target.value)}
          placeholder="Dettagli utili"
        />
      </label>

      <button
        type="button"
        onClick={gestisciSalva}
        className="btn-primary w-full min-h-[52px] font-black"
      >
        Salva
      </button>
    </div>
  );
}
