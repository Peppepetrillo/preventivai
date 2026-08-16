import { useId, useState } from "react";
import { Trash2 } from "lucide-react";

import BottomSheet from "../../../components/BottomSheet";
import ConfirmDialog from "../../../components/ConfirmDialog";
import {
  CATEGORIE_MATERIALE,
  ETICHETTE_CATEGORIA_MATERIALE,
} from "../../../domain/catalogoMateriali/materialiTypes";
import { UNITA_OPZIONI_UI } from "../catalogoMaterialiUiMeta";
import AccessoriSuggeritiSection from "./AccessoriSuggeritiSection";

/**
 * BottomSheet crea/modifica famiglia materiale.
 */
export default function FamigliaMaterialeSheet({
  open,
  onClose,
  famiglia = null,
  categoriaDefault = "elettrico",
  catalogo = [],
  onCrea,
  onSalva,
  onElimina,
  onToggleAttiva,
}) {
  const isNuova = !famiglia;

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={isNuova ? "Nuovo materiale" : "Modifica materiale"}
      descrizione={
        isNuova
          ? "Crea una famiglia personalizzata nel catalogo."
          : "Aggiorna nome, unità e stato."
      }
    >
      {open ? (
        <FamigliaForm
          key={famiglia?.id ?? "nuova-famiglia"}
          famiglia={famiglia}
          categoriaDefault={categoriaDefault}
          catalogo={catalogo}
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

function FamigliaForm({
  famiglia,
  categoriaDefault,
  catalogo,
  onClose,
  onCrea,
  onSalva,
  onElimina,
  onToggleAttiva,
}) {
  const baseId = useId();
  const isNuova = !famiglia;
  const [form, setForm] = useState(() => formDaFamiglia(famiglia, categoriaDefault));
  const [errore, setErrore] = useState("");
  const [confermaElimina, setConfermaElimina] = useState(false);

  function aggiorna(campo, valore) {
    setForm((prev) => ({ ...prev, [campo]: valore }));
  }

  function gestisciSalva() {
    const nome = String(form.nome || "").trim();
    if (!nome) {
      setErrore("Inserisci il nome del materiale.");
      return;
    }
    const payload = {
      nome,
      categoria: form.categoria,
      unitaDefault: form.unitaDefault,
      attributoChiave: String(form.attributoChiave || "tipo").trim() || "tipo",
      descrizione: String(form.descrizione || "").trim(),
      attiva: form.attiva !== false,
      accessoriSuggeriti: form.accessoriSuggeriti || [],
    };

    const ok = isNuova ? onCrea?.(payload) : onSalva?.(famiglia.id, payload);
    if (ok !== false && ok != null) onClose?.();
  }

  function confermaEliminazione() {
    if (!famiglia?.id || !famiglia.personalizzata) return;
    onElimina?.(famiglia.id, { hard: true });
    setConfermaElimina(false);
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
          Nome
        </span>
        <input
          id={`${baseId}-nome`}
          className="mt-1.5 w-full min-h-[48px] rounded-[16px] border border-white/10 bg-black/30 px-4 text-white"
          value={form.nome}
          onChange={(e) => aggiorna("nome", e.target.value)}
          placeholder="Es. Tubo corrugato"
          autoFocus
        />
      </label>

      <label className="block">
        <span className="ds-text-secondary text-xs font-bold uppercase tracking-wide">
          Categoria
        </span>
        <select
          className="mt-1.5 w-full min-h-[48px] rounded-[16px] border border-white/10 bg-black/30 px-3 text-white"
          value={form.categoria}
          onChange={(e) => aggiorna("categoria", e.target.value)}
        >
          {CATEGORIE_MATERIALE.map((id) => (
            <option key={id} value={id}>
              {ETICHETTE_CATEGORIA_MATERIALE[id]}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="ds-text-secondary text-xs font-bold uppercase tracking-wide">
          Unità predefinita
        </span>
        <select
          className="mt-1.5 w-full min-h-[48px] rounded-[16px] border border-white/10 bg-black/30 px-3 text-white"
          value={form.unitaDefault}
          onChange={(e) => aggiorna("unitaDefault", e.target.value)}
        >
          {UNITA_OPZIONI_UI.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="ds-text-secondary text-xs font-bold uppercase tracking-wide">
          Attributo chiave
        </span>
        <input
          className="mt-1.5 w-full min-h-[48px] rounded-[16px] border border-white/10 bg-black/30 px-4 text-white"
          value={form.attributoChiave}
          onChange={(e) => aggiorna("attributoChiave", e.target.value)}
          placeholder="Es. diametro, sezione, tipo"
        />
      </label>

      <label className="flex items-center justify-between gap-3 min-h-[48px] px-1">
        <span className="ds-text-primary text-sm">Attivo</span>
        <input
          type="checkbox"
          className="h-5 w-5"
          checked={form.attiva !== false}
          onChange={(e) => {
            aggiorna("attiva", e.target.checked);
            if (!isNuova) onToggleAttiva?.(famiglia.id, e.target.checked);
          }}
        />
      </label>

      <AccessoriSuggeritiSection
        accessori={form.accessoriSuggeriti}
        catalogo={catalogo}
        escludiFamigliaId={famiglia?.id || ""}
        onChange={(lista) => aggiorna("accessoriSuggeriti", lista)}
      />

      <button
        type="button"
        onClick={gestisciSalva}
        className="btn-primary w-full min-h-[52px] font-black"
      >
        {isNuova ? "Salva materiale" : "Salva modifiche"}
      </button>

      {!isNuova && famiglia?.personalizzata ? (
        <button
          type="button"
          onClick={() => setConfermaElimina(true)}
          className="btn-danger w-full min-h-[48px] font-bold flex items-center justify-center gap-2"
        >
          <Trash2 size={18} aria-hidden="true" />
          Elimina
        </button>
      ) : null}

      <ConfirmDialog
        open={confermaElimina}
        title={`Eliminare «${famiglia?.nome || "materiale"}»?`}
        description="L'operazione non si può annullare."
        confirmLabel="Elimina"
        onConfirm={confermaEliminazione}
        onCancel={() => setConfermaElimina(false)}
        testId="conferma-elimina-famiglia"
      />
    </div>
  );
}

function formDaFamiglia(famiglia, categoriaDefault) {
  return {
    nome: famiglia?.nome || "",
    categoria: famiglia?.categoria || categoriaDefault || "elettrico",
    unitaDefault: famiglia?.unitaDefault || "pz",
    attributoChiave: famiglia?.attributoChiave || "tipo",
    descrizione: famiglia?.descrizione || "",
    attiva: famiglia?.attiva !== false,
    accessoriSuggeriti: Array.isArray(famiglia?.accessoriSuggeriti)
      ? famiglia.accessoriSuggeriti
      : [],
  };
}
