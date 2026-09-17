import { useContext } from "react";

import { GlobalCreateContext } from "./globalCreateContextInstance";

export function useGlobalCreate() {
  const ctx = useContext(GlobalCreateContext);
  if (!ctx) {
    throw new Error("useGlobalCreate richiede GlobalCreateProvider");
  }
  return ctx;
}
