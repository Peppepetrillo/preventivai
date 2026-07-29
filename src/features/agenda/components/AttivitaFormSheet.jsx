import { useEffect, useState } from "react";

import BottomSheet from "../../../components/BottomSheet";
import {
  CATEGORIE_ATTIVITA,
  ETICHETTE_CATEGORIA_ATTIVITA,
  PRIORITA_ATTIVITA,
} from "../../../domain/attivita/attivitaTypes";

const PRIORITA_OPZIONI = [
  { id: PRIORITA_ATTIVITA.BASSA, label: "Bassa" },
  { id: PRIORITA_ATTIVITA.MEDIA, label: "Media" },
  { id: PRIORITA_ATTIVITA.ALTA, label: "Alta" },
];

function statoIniziale(attivita, dataDefault) {
  return {
    titolo: attivita?.titolo || "",
    descrizione: attivita?.descrizione || "",
    categoria: attivita?.categoria || "altro",
    priorita: attivita?.priorita || "media",
    data: attivita?.data || dataDefault,
    ora: attivita?.ora || "",
    reminder: Boolean(attivita?.reminder),
    note: attivita?.note || "",
  };
}

export default function AttivitaFormSheet({
  aperto,
  onChiudi,
  onSalva,
  attivita = null,
  dataDefault = "",
}) {
  const [form, setForm] = useState(() => statoIniziale(attivita, dataDefault));

  useEffect(() => {
    if (aperto) setForm(statoIniziale(attivita, dataDefault));
  }, [aperto, attivita, dataDefault]);

  function aggiorna(campo, valore) {
    setForm((prev) => ({ ...prev, [campo]: valore }));
  }

  function invia(event) {
    event.preventDefault();
    if (!form.titolo.trim()) return;
    onSalva?.(form);
    onChiudi?.();
  }

  return (
    <BottomSheet
      open={aperto}
      onClose={onChiudi}
      title={attivita ? "Modifica attività" : "Nuova attività"}
      descrizione="Promemoria, telefonate, acquisti e altro."
    >
      <form onSubmit={invia} className="space-y-4 pb-2">
        <label className="block">
          <span className="ds-text-secondary text-xs font-bold uppercase tracking-wide">
            Titolo
          </span>
          <input
            className="mt-1.5 w-full min-h-[48px] rounded-[16px] border border-white/10 bg-black/30 px-4 text-white"
            value={form.titolo}
            onChange={(e) => aggiorna("titolo", e.target.value)}
            placeholder="Es. Chiama fornitore"
            required
            autoFocus
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="ds-text-secondary text-xs font-bold uppercase tracking-wide">
              Ora
            </span>
            <input
              type="time"
              className="mt-1.5 w-full min-h-[48px] rounded-[16px] border border-white/10 bg-black/30 px-4 text-white"
              value={form.ora}
              onChange={(e) => aggiorna("ora", e.target.value)}
            />
          </label>
          <label className="block">
            <span className="ds-text-secondary text-xs font-bold uppercase tracking-wide">
              Priorità
            </span>
            <select
              className="mt-1.5 w-full min-h-[48px] rounded-[16px] border border-white/10 bg-black/30 px-3 text-white"
              value={form.priorita}
              onChange={(e) => aggiorna("priorita", e.target.value)}
            >
              {PRIORITA_OPZIONI.map((op) => (
                <option key={op.id} value={op.id}>
                  {op.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block">
          <span className="ds-text-secondary text-xs font-bold uppercase tracking-wide">
            Categoria
          </span>
          <select
            className="mt-1.5 w-full min-h-[48px] rounded-[16px] border border-white/10 bg-black/30 px-3 text-white"
            value={form.categoria}
            onChange={(e) => aggiorna("categoria", e.target.value)}
          >
            {CATEGORIE_ATTIVITA.map((cat) => (
              <option key={cat} value={cat}>
                {ETICHETTE_CATEGORIA_ATTIVITA[cat]}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-3 min-h-[44px]">
          <input
            type="checkbox"
            checked={form.reminder}
            onChange={(e) => aggiorna("reminder", e.target.checked)}
            className="w-5 h-5"
          />
          <span className="ds-text-primary text-sm">Attiva reminder</span>
        </label>

        <button type="submit" className="btn-primary w-full min-h-[52px] font-black">
          Salva
        </button>
      </form>
    </BottomSheet>
  );
}
