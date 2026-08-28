import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { ROUTES } from "../../../../app/routes";
import { leggiClienti } from "../../../../repositories/clientiRepository";
import ClienteSelector from "../../components/ClienteSelector";

export default function StepCliente({ onSelezionaCliente }) {
  const [searchParams] = useSearchParams();
  const [clienti] = useState(() => leggiClienti());

  const clienteId = searchParams.get("clienteId");
  const altreModalitaLink = clienteId
    ? `${ROUTES.nuovoPreventivo}?clienteId=${clienteId}`
    : ROUTES.nuovoPreventivo;

  return (
    <div className="space-y-2">
      <ClienteSelector clienti={clienti} onSeleziona={onSelezionaCliente} />

      <Link
        to={altreModalitaLink}
        className="flex items-center justify-center min-h-[44px] py-3 text-sm font-semibold text-slate-400 hover:text-slate-200"
        data-testid="wizard-altre-modalita"
      >
        Altri modi per creare un preventivo
      </Link>
    </div>
  );
}
