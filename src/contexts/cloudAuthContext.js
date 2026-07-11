import { createContext, useContext } from "react";

export const CloudAuthContext = createContext({
  configurato: false,
  sessione: null,
  utente: null,
  sincronizzazione: "locale",
  errore: "",
  accedi: async () => {},
  registrati: async () => {},
  esci: async () => {},
});

export function useCloudAuth() {
  return useContext(CloudAuthContext);
}
