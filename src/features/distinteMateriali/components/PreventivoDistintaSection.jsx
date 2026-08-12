import { ClipboardList, ExternalLink, Link2, Unlink } from "lucide-react";
import { Link } from "react-router-dom";

import { ROUTES } from "../../../app/routes";

function formattaData(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("it-IT");
}

/**
 * Sezione Distinta materiali sul dettaglio preventivo (soft link).
 */
export default function PreventivoDistintaSection({
  distinta = null,
  onCollega,
  onScollega,
  embedded = false,
}) {
  const nVoci = Array.isArray(distinta?.voci) ? distinta.voci.length : 0;
  const data = formattaData(distinta?.updatedAt || distinta?.createdAt);
  const Wrapper = embedded ? "div" : "section";

  return (
    <Wrapper
      className={
        embedded ? "space-y-4" : "pro-panel p-5 mb-5 space-y-4"
      }
      data-testid="preventivo-distinta-section"
      aria-labelledby={embedded ? undefined : "preventivo-distinta-title"}
    >
      {!embedded ? (
        <div>
          <p className="section-label">Materiali</p>
          <h2 id="preventivo-distinta-title" className="text-xl font-black mt-1">
            Distinta materiali
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            Collegamento soft: non modifica prezzi, IVA o totali del preventivo.
          </p>
        </div>
      ) : (
        <p className="ds-text-secondary text-sm">
          Collegamento soft: non modifica prezzi, IVA o totali del preventivo.
        </p>
      )}

      {!distinta ? (
        <button
          type="button"
          onClick={onCollega}
          className="btn-secondary w-full min-h-[52px] font-bold inline-flex items-center justify-center gap-2"
          data-testid="preventivo-collega-distinta"
        >
          <Link2 size={18} aria-hidden="true" />
          Collega distinta
        </button>
      ) : (
        <div className="space-y-3">
          <div className="rounded-[16px] border border-white/10 bg-black/20 px-4 py-3">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-[16px] bg-yellow-400/15 text-yellow-300 shrink-0">
                <ClipboardList size={22} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="ds-card-title truncate">{distinta.titolo}</p>
                <p className="ds-text-secondary text-sm mt-1">
                  {nVoci} {nVoci === 1 ? "materiale" : "materiali"}
                  {data ? ` · ${data}` : ""}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              to={ROUTES.distintaMateriali.replace(":id", distinta.id)}
              className="btn-secondary flex-1 min-h-[48px] font-bold inline-flex items-center justify-center gap-2 px-4"
              data-testid="preventivo-apri-distinta"
            >
              <ExternalLink size={16} aria-hidden="true" />
              Apri distinta
            </Link>
            <button
              type="button"
              onClick={onScollega}
              className="btn-secondary flex-1 min-h-[48px] font-bold inline-flex items-center justify-center gap-2 px-4 text-red-200"
              data-testid="preventivo-scollega-distinta"
            >
              <Unlink size={16} aria-hidden="true" />
              Scollega
            </button>
          </div>
        </div>
      )}
    </Wrapper>
  );
}
