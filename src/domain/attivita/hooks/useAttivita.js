import { useCallback, useState } from "react";

import {
  aggiungiAttivita,
  aggiornaAttivitaPerId,
  completaAttivitaPerId,
  eliminaAttivitaPerId,
  leggiAttivita,
} from "../attivitaRepository";

/**
 * Hook CRUD attività personali/amministrative.
 */
export function useAttivita() {
  const [attivita, setAttivita] = useState(() => leggiAttivita());

  const ricarica = useCallback(() => {
    setAttivita(leggiAttivita());
  }, []);

  const crea = useCallback((input) => {
    const creata = aggiungiAttivita(input);
    setAttivita(leggiAttivita());
    return creata;
  }, []);

  const aggiorna = useCallback((id, modifiche) => {
    const aggiornata = aggiornaAttivitaPerId(id, modifiche);
    setAttivita(leggiAttivita());
    return aggiornata;
  }, []);

  const completa = useCallback((id) => {
    const aggiornata = completaAttivitaPerId(id);
    setAttivita(leggiAttivita());
    return aggiornata;
  }, []);

  const elimina = useCallback((id) => {
    const ok = eliminaAttivitaPerId(id);
    setAttivita(leggiAttivita());
    return ok;
  }, []);

  return {
    attivita,
    ricarica,
    crea,
    aggiorna,
    completa,
    elimina,
  };
}
