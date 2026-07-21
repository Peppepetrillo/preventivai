import { useState } from "react";

import { leggiClienti } from "../../../../repositories/clientiRepository";
import ClienteSelector from "../../components/ClienteSelector";

export default function StepCliente({ onSelezionaCliente }) {
  const [clienti] = useState(() => leggiClienti());

  return <ClienteSelector clienti={clienti} onSeleziona={onSelezionaCliente} />;
}
