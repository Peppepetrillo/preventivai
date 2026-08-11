import { Link2, Unlink } from "lucide-react";

import BottomSheet from "../../../components/BottomSheet";

/**
 * Picker per collegare una Distinta a un cantiere esistente.
 */
export default function CollegaCantiereSheet({
  open,
  onClose,
  cantieri = [],
  cantiereCollegatoId = null,
  onCollega,
  onScollega,
}) {
  const collegato = cantieri.find(
    (c) => String(c.id) === String(cantiereCollegatoId || "")
  );

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Collega a cantiere"
      descrizione="La distinta resta autonoma: sul cantiere viene creata una proiezione dei materiali."
    >
      <div className="space-y-3 pb-2">
        {collegato ? (
          <div className="pro-panel px-4 py-3">
            <p className="ds-text-secondary text-xs font-bold uppercase tracking-wide">
              Collegata a
            </p>
            <p className="ds-card-title mt-1">{collegato.nome || "Cantiere"}</p>
            {collegato.cliente ? (
              <p className="ds-text-secondary text-sm mt-1">{collegato.cliente}</p>
            ) : null}
            <button
              type="button"
              onClick={() => onScollega?.()}
              className="btn-secondary mt-3 w-full min-h-[48px] font-bold inline-flex items-center justify-center gap-2"
              data-testid="distinta-scollega-cantiere"
            >
              <Unlink size={16} aria-hidden="true" />
              Scollega
            </button>
          </div>
        ) : null}

        {cantieri.length === 0 ? (
          <p className="ds-text-secondary text-sm text-center py-6">
            Nessun cantiere disponibile. Creane uno dalla sezione Cantieri.
          </p>
        ) : (
          <ul className="space-y-2" role="list">
            {cantieri.map((c) => {
              const attivo = String(c.id) === String(cantiereCollegatoId || "");
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    disabled={attivo}
                    onClick={() => onCollega?.(c.id)}
                    className="flex min-h-[56px] w-full items-center gap-3 rounded-[16px] border border-white/10 bg-black/30 px-4 text-left disabled:opacity-50"
                    data-testid={`distinta-collega-cantiere-${c.id}`}
                  >
                    <Link2
                      size={18}
                      aria-hidden="true"
                      className="text-yellow-300 shrink-0"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="ds-text-primary block truncate">
                        {c.nome || "Cantiere"}
                      </span>
                      <span className="ds-text-secondary text-sm block truncate">
                        {[c.cliente, c.stato].filter(Boolean).join(" · ")}
                      </span>
                    </span>
                    {attivo ? (
                      <span className="ds-badge text-emerald-300">Collegata</span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </BottomSheet>
  );
}
