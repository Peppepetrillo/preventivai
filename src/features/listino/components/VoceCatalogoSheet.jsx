import { useId, useState } from "react";
import { Trash2 } from "lucide-react";

import BottomSheet from "../../../components/BottomSheet";
import ConfirmDialog from "../../../components/ConfirmDialog";
import NumericInput from "../../../components/NumericInput";
import { UNITA_COMUNI } from "../listinoCatalogDomain";

/**
 * Bottom sheet creazione/modifica lavorazione — mai nuova pagina.
 * Remount del form all'apertura evita sync via useEffect (React Compiler lint).
 */
export default function VoceCatalogoSheet({
  open,
  onClose,
  voce = null,
  categorie = [],
  onSalva,
  onCrea,
  onElimina,
}) {
  const isNuova = !voce;

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={isNuova ? "Nuova lavorazione" : "Modifica lavorazione"}
      descrizione="Personalizza la voce del catalogo locale."
    >
      {open ? (
        <VoceCatalogoForm
          key={voce?.id ?? "nuova"}
          voce={voce}
          categorie={categorie}
          onClose={onClose}
          onSalva={onSalva}
          onCrea={onCrea}
          onElimina={onElimina}
        />
      ) : null}
    </BottomSheet>
  );
}

function VoceCatalogoForm({
  voce,
  categorie,
  onClose,
  onSalva,
  onCrea,
  onElimina,
}) {
  const baseId = useId();
  const isNuova = !voce;
  const [form, setForm] = useState(() => formDaVoce(voce, categorie));
  const [errore, setErrore] = useState("");
  const [confermaElimina, setConfermaElimina] = useState(false);

  function aggiorna(campo, valore) {
    setForm((prev) => ({ ...prev, [campo]: valore }));
  }

  function gestisciSalva() {
    const nome = String(form.nome || "").trim();
    if (!nome) {
      setErrore("Inserisci il nome della lavorazione.");
      return;
    }

    const payload = {
      nome,
      prezzo: form.prezzo,
      unita: String(form.unita || "cad").trim() || "cad",
      categoria: String(form.categoria || "Lavorazioni").trim() || "Lavorazioni",
      attiva: form.attiva !== false,
      preferita: Boolean(form.preferita),
    };

    const ok = isNuova ? onCrea?.(payload) : onSalva?.(voce.id, payload);
    if (ok !== false) onClose?.();
  }

  function confermaEliminazione() {
    if (!voce?.id) return;
    onElimina?.(voce.id);
    setConfermaElimina(false);
    onClose?.();
  }

  const opzioniCategoria = [
    ...new Set(
      [
        ...(categorie || []),
        form.categoria,
        "Impianto",
        "Quadro",
        "Illuminazione",
        "Bassa tensione",
        "Assistenza",
        "Materiali",
      ].filter(Boolean)
    ),
  ];

  return (
    <div className="space-y-3">
      {errore ? (
        <p className="text-sm text-amber-200" role="alert">
          {errore}
        </p>
      ) : null}

      <label htmlFor={`${baseId}-nome`} className="block">
        <span className="text-[12px] font-medium text-slate-400">Nome</span>
        <input
          id={`${baseId}-nome`}
          type="text"
          value={form.nome}
          onChange={(event) => aggiorna("nome", event.target.value)}
          className="input-pro mt-2"
          autoComplete="off"
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label htmlFor={`${baseId}-prezzo`} className="block">
          <span className="text-[12px] font-medium text-slate-400">Prezzo</span>
          <NumericInput
            id={`${baseId}-prezzo`}
            min="0"
            value={form.prezzo}
            inputMode="decimal"
            onChange={(valore) => aggiorna("prezzo", valore)}
            className="input-pro mt-2"
          />
        </label>

        <label htmlFor={`${baseId}-unita`} className="block">
          <span className="text-[12px] font-medium text-slate-400">Unità</span>
          <input
            id={`${baseId}-unita`}
            list={`${baseId}-unita-list`}
            value={form.unita}
            onChange={(event) => aggiorna("unita", event.target.value)}
            className="input-pro mt-2"
            autoComplete="off"
          />
          <datalist id={`${baseId}-unita-list`}>
            {UNITA_COMUNI.map((u) => (
              <option key={u} value={u} />
            ))}
          </datalist>
        </label>
      </div>

      <label htmlFor={`${baseId}-categoria`} className="block">
        <span className="text-[12px] font-medium text-slate-400">
          Categoria
        </span>
        <input
          id={`${baseId}-categoria`}
          list={`${baseId}-cat-list`}
          value={form.categoria}
          onChange={(event) => aggiorna("categoria", event.target.value)}
          className="input-pro mt-2"
          autoComplete="off"
        />
        <datalist id={`${baseId}-cat-list`}>
          {opzioniCategoria.map((cat) => (
            <option key={cat} value={cat} />
          ))}
        </datalist>
      </label>

      <div className="flex flex-col gap-2 pt-1">
        <ToggleRiga
          id={`${baseId}-attiva`}
          label="Attiva"
          descrizione="Visibile nei preventivi"
          checked={form.attiva !== false}
          onChange={(valore) => aggiorna("attiva", valore)}
        />
        <ToggleRiga
          id={`${baseId}-preferita`}
          label="Preferita"
          descrizione="In evidenza in cima al listino"
          checked={Boolean(form.preferita)}
          onChange={(valore) => aggiorna("preferita", valore)}
        />
      </div>

      <div className="flex gap-2 pt-2">
        {!isNuova ? (
          <button
            type="button"
            onClick={() => setConfermaElimina(true)}
            className="min-w-[48px] min-h-[48px] btn-secondary flex items-center justify-center text-red-300"
            aria-label="Elimina lavorazione"
          >
            <Trash2 size={18} aria-hidden="true" />
          </button>
        ) : null}
        <button
          type="button"
          onClick={onClose}
          className="flex-1 btn-secondary min-h-[48px] text-[14px] font-semibold"
        >
          Annulla
        </button>
        <button
          type="button"
          onClick={gestisciSalva}
          className="flex-1 btn-primary min-h-[48px] text-[14px] font-semibold"
        >
          Salva
        </button>
      </div>

      <ConfirmDialog
        open={confermaElimina}
        title={`Eliminare «${voce?.nome || "lavorazione"}» dal listino?`}
        description="L'operazione non si può annullare."
        confirmLabel="Elimina"
        onConfirm={confermaEliminazione}
        onCancel={() => setConfermaElimina(false)}
        testId="conferma-elimina-voce"
      />
    </div>
  );
}

function formDaVoce(voce, categorie = []) {
  if (voce) {
    return {
      nome: voce.nome || "",
      prezzo: voce.prezzo ?? "",
      unita: voce.unita || "cad",
      categoria: voce.categoria || "Impianto",
      attiva: voce.attiva !== false,
      preferita: Boolean(voce.preferita),
    };
  }

  return {
    nome: "",
    prezzo: "",
    unita: "cad",
    categoria: categorie[0] || "Impianto",
    attiva: true,
    preferita: false,
  };
}

function ToggleRiga({ id, label, descrizione, checked, onChange }) {
  return (
    <label
      htmlFor={id}
      className="flex items-center justify-between gap-3 min-h-[48px] rounded-[14px] border border-white/[0.06] bg-white/[0.03] px-3.5 py-2 cursor-pointer"
    >
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-white">{label}</span>
        <span className="block text-xs text-slate-400 mt-0.5">
          {descrizione}
        </span>
      </span>
      <input
        id={id}
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="sr-only peer"
      />
      <span
        className={`relative w-11 h-6 rounded-full shrink-0 transition-colors ${
          checked ? "bg-yellow-400" : "bg-white/15"
        }`}
        aria-hidden="true"
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-slate-950 transition-transform ${
            checked ? "translate-x-5" : ""
          }`}
        />
      </span>
    </label>
  );
}
