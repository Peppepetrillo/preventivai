import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ETICHETTE_TEMA,
  TEMA,
  TEMI_VALIDI,
  applicaTemaDom,
  risolviTemaEffettivo,
} from "./themeDomain";
import {
  leggiPreferenzaTema,
  salvaPreferenzaTema,
} from "./themeStorage";

const ThemeContext = createContext(null);

function leggiSistemaScuro() {
  if (typeof window === "undefined") return false;
  return Boolean(
    window.matchMedia?.("(prefers-color-scheme: dark)")?.matches
  );
}

export function ThemeProvider({ children }) {
  const [preferenza, setPreferenzaState] = useState(() =>
    leggiPreferenzaTema()
  );
  const [sistemaScuro, setSistemaScuro] = useState(leggiSistemaScuro);

  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mq) return undefined;
    function onChange() {
      setSistemaScuro(mq.matches);
    }
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  const temaEffettivo = useMemo(
    () => risolviTemaEffettivo(preferenza, { matches: sistemaScuro }),
    [preferenza, sistemaScuro]
  );

  useEffect(() => {
    applicaTemaDom(temaEffettivo);
  }, [temaEffettivo]);

  const setPreferenza = useCallback((valore) => {
    const next = TEMI_VALIDI.includes(valore) ? valore : TEMA.sistema;
    salvaPreferenzaTema(next);
    setPreferenzaState(next);
  }, []);

  const value = useMemo(
    () => ({
      preferenza,
      temaEffettivo,
      setPreferenza,
      etichette: ETICHETTE_TEMA,
      temi: TEMI_VALIDI,
    }),
    [preferenza, temaEffettivo, setPreferenza]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme richiede ThemeProvider");
  }
  return ctx;
}
