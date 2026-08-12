import { createContext, useContext, useMemo, useState } from "react";

const GlobalCreateContext = createContext(null);

export function GlobalCreateProvider({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const value = useMemo(
    () => ({
      menuOpen,
      openMenu: () => setMenuOpen(true),
      closeMenu: () => setMenuOpen(false),
    }),
    [menuOpen]
  );

  return (
    <GlobalCreateContext.Provider value={value}>
      {children}
    </GlobalCreateContext.Provider>
  );
}

export function useGlobalCreate() {
  const ctx = useContext(GlobalCreateContext);
  if (!ctx) {
    throw new Error("useGlobalCreate richiede GlobalCreateProvider");
  }
  return ctx;
}
