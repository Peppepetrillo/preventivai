import { useMemo, useState } from "react";

import { GlobalCreateContext } from "./globalCreateContextInstance";

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
