import { useEffect, useState } from "react";
import { Lightbulb } from "lucide-react";

import BottomSheet from "../../../components/BottomSheet";
import { PRIORITA_INSIGHT } from "../../../domain/insights/insightTypes";

/**
 * Form rapido per registrare un Insight di campo.
 */
export default function InsightRapidoSheet({
  aperto,
  onChiudi,
  onSalva,
  contesto = {},
}) {
  const [problema, setProblema] = useState("");
  const [soluzione, setSoluzione] = useState("");
  const [priorita, setPriorita] = useState(PRIORITA_INSIGHT.MEDIA);

  useEffect(() => {
    if (aperto) {
      setProblema("");
      setSoluzione("");
      setPriorita(PRIORITA_INSIGHT.MEDIA);
    }
  }, [aperto]);

  function invia(event) {
    event.preventDefault();
    if (!problema.trim()) return;
    onSalva?.({
      titolo: problema.trim().slice(0, 80),
      problema: problema.trim(),
      soluzione: soluzione.trim(),
      priorita,
      cantiereId: contesto.cantiereId || contesto.lavoroId || "",
      cliente: contesto.cliente || "",
    });
    onChiudi?.();
  }

  return (
    <BottomSheet
      open={aperto}
      onClose={onChiudi}
      title="Idea di campo"
      descrizione="Registra un problema e una possibile soluzione."
    >
      <form onSubmit={invia} className="space-y-4 pb-2">
        <div className="flex items-center gap-2 text-yellow-200 text-sm font-bold">
          <Lightbulb size={16} />
          {contesto.cliente || contesto.titolo || "Lavoro"}
        </div>

        <label className="block">
          <span className="ds-text-secondary text-xs font-bold uppercase tracking-wide">
            Problema
          </span>
          <textarea
            className="mt-1.5 w-full min-h-[88px] rounded-[16px] border border-white/10 bg-black/30 px-4 py-3 text-white"
            value={problema}
            onChange={(e) => setProblema(e.target.value)}
            placeholder="Cosa non tornava?"
            required
          />
        </label>

        <label className="block">
          <span className="ds-text-secondary text-xs font-bold uppercase tracking-wide">
            Idea / soluzione
          </span>
          <textarea
            className="mt-1.5 w-full min-h-[72px] rounded-[16px] border border-white/10 bg-black/30 px-4 py-3 text-white"
            value={soluzione}
            onChange={(e) => setSoluzione(e.target.value)}
            placeholder="Come lo risolveresti?"
          />
        </label>

        <label className="block">
          <span className="ds-text-secondary text-xs font-bold uppercase tracking-wide">
            Priorità
          </span>
          <select
            className="mt-1.5 w-full min-h-[48px] rounded-[16px] border border-white/10 bg-black/30 px-3 text-white"
            value={priorita}
            onChange={(e) => setPriorita(e.target.value)}
          >
            <option value={PRIORITA_INSIGHT.BASSA}>Bassa</option>
            <option value={PRIORITA_INSIGHT.MEDIA}>Media</option>
            <option value={PRIORITA_INSIGHT.ALTA}>Alta</option>
          </select>
        </label>

        <button type="submit" className="btn-primary w-full min-h-[52px] font-black">
          Salva idea
        </button>
      </form>
    </BottomSheet>
  );
}
