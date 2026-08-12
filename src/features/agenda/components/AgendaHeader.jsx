import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";

import { ROUTES } from "../../../app/routes";
import AgendaGiornoNav from "./AgendaGiornoNav";
import AgendaFilters from "./AgendaFilters";

/**
 * Header Agenda: filtri vista + navigazione giorno.
 */
export default function AgendaHeader({
  vista,
  onCambiaVista,
  giorno,
  oggi,
  onGiornoPrecedente,
  onOggi,
  onGiornoSuccessivo,
  nascondiNavGiorno = false,
  acquistiDaComprare = 0,
}) {
  return (
    <header className="mb-1">
      <AgendaFilters vista={vista} onCambiaVista={onCambiaVista} />
      {acquistiDaComprare > 0 ? (
        <Link
          to={ROUTES.acquisti}
          className="mb-3 inline-flex items-center gap-2 min-h-[44px] px-3 py-2 rounded-[16px] border border-amber-400/25 bg-amber-400/10 text-amber-100 text-sm font-bold"
          data-testid="agenda-link-acquisti"
        >
          <ShoppingCart size={16} aria-hidden="true" />
          Acquisti
          <span className="ds-badge-count">{acquistiDaComprare}</span>
        </Link>
      ) : null}
      {!nascondiNavGiorno ? (
        <AgendaGiornoNav
          giorno={giorno}
          oggi={oggi}
          onGiornoPrecedente={onGiornoPrecedente}
          onOggi={onOggi}
          onGiornoSuccessivo={onGiornoSuccessivo}
        />
      ) : (
        <div className="mb-5 text-center">
          <p className="section-label">Agenda</p>
          <h1 className="ds-page-title mt-0.5">Questa settimana</h1>
        </div>
      )}
    </header>
  );
}
