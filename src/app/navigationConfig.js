/**
 * Gerarchia navigazione PreventivAI — parent unico per Back + edge swipe.
 * BottomNav roots non hanno parent (nessuna freccia, nessuno swipe).
 */

import { ROUTES } from "./routes";

/** Costanti edge swipe (modificabili in un solo punto). */
export const EDGE_SWIPE_CONFIG = Object.freeze({
  /** Larghezza zona bordo sinistro (px). */
  edgeWidthPx: 28,
  /** Spostamento orizzontale minimo per confermare (px). */
  minDistancePx: 72,
  /** Se |dy| supera questo, il gesto è scroll verticale → annulla. */
  maxVerticalDriftPx: 48,
  /** Disabilita su queste path esatte. */
  percorsiEsclusi: Object.freeze([ROUTES.agenda]),
});

/** Destinazioni BottomNav (nessun Back / edge swipe). */
export const BOTTOM_NAV_ROOTS = Object.freeze([
  ROUTES.dashboard,
  ROUTES.preventivi,
  ROUTES.cantieri,
  ROUTES.altro,
]);

/**
 * Parent espliciti per path statiche.
 * Ambiguities risolte dall'architettura hub:
 * - Acquisti/Listino/Distinte/Catalogo → Altro (entry hub, non Impostazioni stale)
 * - Cestino → Impostazioni (anche linkato da Altro; Back attuale e Impostazioni)
 * - Agenda/Clienti/Impostazioni → Altro
 * - Preventivo intelligente → Preventivi (cluster nav, non Home)
 */
export const ROUTE_PARENTS = Object.freeze({
  [ROUTES.economia]: ROUTES.altro,
  [ROUTES.storico]: ROUTES.altro,
  [ROUTES.agenda]: ROUTES.altro,
  [ROUTES.clienti]: ROUTES.altro,
  [ROUTES.acquisti]: ROUTES.altro,
  [ROUTES.listino]: ROUTES.altro,
  [ROUTES.catalogoMateriali]: ROUTES.altro,
  [ROUTES.distinteMateriali]: ROUTES.altro,
  [ROUTES.impostazioni]: ROUTES.altro,
  [ROUTES.datiAzienda]: ROUTES.impostazioni,
  [ROUTES.cestino]: ROUTES.impostazioni,
  [ROUTES.incassi]: ROUTES.preventivi,
  [ROUTES.preventivoIntelligente]: ROUTES.preventivi,
  [ROUTES.preventivoManuale]: ROUTES.nuovoPreventivo,
  [ROUTES.nuovoPreventivo]: ROUTES.preventiviNuovo,
  [ROUTES.preventiviNuovo]: ROUTES.preventivi,
  [ROUTES.sopralluogo]: ROUTES.dashboard,
  [ROUTES.nuovaDistintaMateriali]: ROUTES.distinteMateriali,
});

/**
 * @param {string} pathname
 * @returns {boolean}
 */
export function isBottomNavRoot(pathname = "") {
  const path = normalizzaPath(pathname);
  return BOTTOM_NAV_ROOTS.includes(path);
}

/**
 * @param {string} pathname
 * @returns {string}
 */
export function normalizzaPath(pathname = "") {
  const grezzo = String(pathname || "").trim() || "/";
  if (grezzo.length > 1 && grezzo.endsWith("/")) {
    return grezzo.slice(0, -1);
  }
  return grezzo;
}

/**
 * Risolve la route padre. Null = root / nessuna freccia.
 * @param {string} pathname
 * @returns {string|null}
 */
export function risolviParentPath(pathname = "") {
  const path = normalizzaPath(pathname);
  if (isBottomNavRoot(path)) return null;
  if (ROUTE_PARENTS[path]) return ROUTE_PARENTS[path];

  if (path.startsWith("/cantiere/")) return ROUTES.cantieri;
  if (path.startsWith("/preventivo/")) return ROUTES.preventivi;
  if (path.startsWith("/cliente/")) return ROUTES.clienti;
  if (path.startsWith(`${ROUTES.distinteMateriali}/`)) {
    return ROUTES.distinteMateriali;
  }

  return null;
}

/**
 * True se la pagina può mostrare Back / usare edge swipe (ha parent).
 * @param {string} pathname
 */
export function richiedeNavigazioneIndietro(pathname = "") {
  return risolviParentPath(pathname) != null;
}

/**
 * Edge swipe disabilitato su root BottomNav, Agenda, o senza parent.
 * @param {string} pathname
 */
export function isEdgeSwipeDisabilitato(pathname = "") {
  const path = normalizzaPath(pathname);
  if (isBottomNavRoot(path)) return true;
  if (EDGE_SWIPE_CONFIG.percorsiEsclusi.includes(path)) return true;
  if (!richiedeNavigazioneIndietro(path)) return true;
  return false;
}

/**
 * True se esiste history in-app utilizzabile (React Router idx).
 * @param {Window=} win
 */
export function canUseHistoryBack(win = typeof window !== "undefined" ? window : null) {
  if (!win?.history) return false;
  const idx = win.history.state?.idx;
  return typeof idx === "number" && idx > 0;
}

/**
 * Destinazione logica (parent). Usata come fallback e per Link.
 * @param {string} pathname
 * @returns {string}
 */
export function destinazioneParentOHome(pathname = "") {
  return risolviParentPath(pathname) || ROUTES.dashboard;
}
