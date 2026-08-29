import { Link } from "react-router-dom";

import { routeCliente } from "../../../app/routes";
import { classeColoreStatoPreventivo } from "../archivioPreventiviUtils";
import {
  etichettaStatoUi,
  sottotitoloPreventivoHeader,
  titoloPreventivoHeader,
} from "../utils/preventivoHeroCta";
import { etichettaTipologiaPreventivo } from "../tipologiaImpiantoUtils";
import { formatEuro } from "../../../utils/preventivi";

/**
 * Header Dettaglio Preventivo — info essenziali in <2s.
 */
export default function PreventivoDettaglioHeader({
  preventivo,
  cliente,
  clienteId,
  lavorazioni = [],
  stato,
  totale,
}) {
  const titolo = titoloPreventivoHeader(preventivo, lavorazioni);
  const sottotitolo = sottotitoloPreventivoHeader(preventivo, lavorazioni);
  const tipologiaLabel = etichettaTipologiaPreventivo(preventivo);
  const linkCliente =
    clienteId != null && clienteId !== "" ? routeCliente(clienteId) : null;

  return (
    <header
      className="pro-panel-strong p-5 mb-4"
      data-testid="preventivo-dettaglio-header"
    >
      <p className="section-label">{sottotitolo}</p>
      <div className="flex flex-wrap items-start justify-between gap-3 mt-2">
        <div className="min-w-0 flex-1">
          <h1 className="ds-page-title">{titolo}</h1>
          {linkCliente ? (
            <Link
              to={linkCliente}
              className="ds-text-primary mt-2 inline-block hover:text-yellow-200"
              data-testid="preventivo-link-cliente"
            >
              {cliente || "Cliente"}
            </Link>
          ) : (
            <p className="ds-text-primary mt-2">{cliente || "Cliente"}</p>
          )}
          <p
            className="ds-text-secondary text-sm mt-2"
            data-testid="preventivo-tipologia"
          >
            Tipologia: {tipologiaLabel}
          </p>
        </div>
        <span
          className={`ds-badge shrink-0 text-white ${classeColoreStatoPreventivo(stato)}`}
          data-testid="preventivo-stato-badge"
        >
          {etichettaStatoUi(stato)}
        </span>
      </div>
      <div className="mt-5 pt-4 border-t border-white/[0.08]">
        <p className="ds-text-secondary">Totale IVA incl.</p>
        <p
          className="text-3xl font-bold tracking-tight mt-1"
          data-testid="preventivo-totale-header"
        >
          {formatEuro(totale)}
        </p>
      </div>
    </header>
  );
}
