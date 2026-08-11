import { useId, useState } from "react";
import { Trash2 } from "lucide-react";

import BottomSheet from "../../../components/BottomSheet";
import NumericInput from "../../../components/NumericInput";
import { UNITA_OPZIONI_UI } from "../catalogoMaterialiUiMeta";

/**
 * BottomSheet crea/modifica variante materiale.
 */
export default function VarianteMaterialeSheet({
  open,
  onClose,
  famiglia,
  variante = null,
  onCrea,
  onSalva,
  onElimina,
  onToggleAttiva,
}) {
  const isNuova = !variante;

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={isNuova ? "Nuova variante" : "Modifica variante"}
      descrizione={
        famiglia?.nome
          ? `Famiglia: ${famiglia.nome}`
          : "Dettaglio variante del materiale."
      }
    >
      {open && famiglia ? (
        <VarianteForm
          key={variante?.id ?? `nuova-${famiglia.id}`}
          famiglia={famiglia}
          variante={variante}
          onClose={onClose}
          onCrea={onCrea}
          onSalva={onSalva}
          onElimina={onElimina}
          onToggleAttiva={onToggleAttiva}
        />
      ) : null}
    </BottomSheet>
  );
}

function VarianteForm({
  famiglia,
  variante,
  onClose,
  onCrea,
  onSalva,
  onElimina,
  onToggleAttiva,
}) {
  const baseId = useId();
  const isNuova = !variante;
  const [form, setForm] = useState(() => formDaVariante(variante, famiglia));
  const [errore, setErrore] = useState("");

  function aggiorna(campo, valore) {
    setForm((prev) => ({ ...prev, [campo]: valore }));
  }

  function gestisciSalva() {
    const etichetta = String(form.etichetta || "").trim();
    if (!etichetta) {
      setErrore("Inserisci l'etichetta della variante.");
      return;
    }

    const chiave = famiglia.attributoChiave || "tipo";
    const valoreAttributo =
      String(form.valoreAttributo || "").trim() || etichetta;

    const payload = {
      etichetta,
      attributi: { [chiave]: valoreAttributo },
      unita: form.unita || undefined,
      attiva: form.attiva !== false,
    };

    if (form.prezzoIndicativo !== "" && form.prezzoIndicativo != null) {
      const prezzo = Number(form.prezzoIndicativo);
      if (Number.isFinite(prezzo) && prezzo >= 0) {
        payload.prezzoIndicativo = prezzo;
      }
    }

    const ok = isNuova
      ? onCrea?.(famiglia.id, payload)
      : onSalva?.(famiglia.id, variante.id, payload);

    if (ok !== false && ok != null) onClose?.();
  }

  function gestisciElimina() {
    if (!variante?.id) return;
    const conferma = window.confirm(
      `Eliminare la variante «${variante.etichetta}»?`
    );
    if (!conferma) return;
    onElimina?.(famiglia.id, variante.id, { hard: true });
    onClose?.();
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
          Etichetta
        </span>
        <input
          id={`${baseId}-etichetta`}
          className="mt-1.5 w-full min-h-[48px] rounded-[16px] border border-white/10 bg-black/30 px-4 text-white"
          value={form.etichetta}
          onChange={(e) => aggiorna("etichetta", e.target.value)}
          placeholder="Es. Ø25"
          autoFocus
        />
      </label>

      <label className="block">
        <span className="ds-text-secondary text-xs font-bold uppercase tracking-wide">
          {famiglia.attributoChiave || "Attributo"}
        </span>
        <input
          className="mt-1.5 w-full min-h-[48px] rounded-[16px] border border-white/10 bg-black/30 px-4 text-white"
          value={form.valoreAttributo}
          onChange={(e) => aggiorna("valoreAttributo", e.target.value)}
          placeholder="Valore attributo"
        />
      </label>

      <label className="block">
        <span className="ds-text-secondary text-xs font-bold uppercase tracking-wide">
          Unità (opzionale)
        </span>
        <select
          className="mt-1.5 w-full min-h-[48px] rounded-[16px] border border-white/10 bg-black/30 px-3 text-white"
          value={form.unita}
          onChange={(e) => aggiorna("unita", e.target.value)}
        >
          <option value="">Default famiglia ({famiglia.unitaDefault})</option>
          {UNITA_OPZIONI_UI.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="ds-text-secondary text-xs font-bold uppercase tracking-wide">
          Prezzo indicativo (opzionale)
        </span>
        <NumericInput
          className="mt-1.5 w-full min-h-[48px] rounded-[16px] border border-white/10 bg-black/30 px-4 text-white"
          value={form.prezzoIndicativo}
          onChange={(valore) => aggiorna("prezzoIndicativo", valore)}
          placeholder="0,00"
          min={0}
        />
      </label>

      <label className="flex items-center justify-between gap-3 min-h-[48px] px-1">
        <span className="ds-text-primary text-sm">Attiva</span>
        <input
          type="checkbox"
          className="h-5 w-5"
          checked={form.attiva !== false}
          onChange={(e) => {
            aggiorna("attiva", e.target.checked);
            if (!isNuova) {
              onToggleAttiva?.(famiglia.id, variante.id, e.target.checked);
            }
          }}
        />
      </label>

      <button
        type="button"
        onClick={gestisciSalva}
        className="btn-primary w-full min-h-[52px] font-black"
      >
        {isNuova ? "Salva variante" : "Salva modifiche"}
      </button>

      {!isNuova ? (
        <button
          type="button"
          onClick={gestisciElimina}
          className="btn-danger w-full min-h-[48px] font-bold flex items-center justify-center gap-2"
        >
          <Trash2 size={18} aria-hidden="true" />
          Elimina variante
        </button>
      ) : null}
    </div>
  );
}

function formDaVariante(variante, famiglia) {
  const chiave = famiglia?.attributoChiave || "tipo";
  const valoreAttributo =
    variante?.attributi?.[chiave] != null
      ? String(variante.attributi[chiave])
      : "";

  return {
    etichetta: variante?.etichetta || "",
    valoreAttributo,
    unita: variante?.unita || "",
    prezzoIndicativo:
      variante?.prezzoIndicativo != null ? String(variante.prezzoIndicativo) : "",
    attiva: variante?.attiva !== false,
  };
}
