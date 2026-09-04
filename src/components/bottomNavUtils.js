/**
 * Logica di evidenziazione BottomNav (estratta per test e per evitare
 * export misti nel componente React).
 */
import { ROUTES } from "../app/routes";

/**
 * True se la route corrente è l'editor Distinta Materiali (nuova o modifica).
 * La lista `/distinte-materiali` resta fuori.
 */
export function isDistintaEditorRoute(pathname = "") {
  const path = String(pathname || "");
  if (path === ROUTES.distinteMateriali) return false;
  if (path === ROUTES.nuovaDistintaMateriali) return true;
  return path.startsWith(`${ROUTES.distinteMateriali}/`);
}

/**
 * True se la BottomNav globale deve essere visibile.
 */
export function shouldShowBottomNav(location) {
  return !isDistintaEditorRoute(location?.pathname || "");
}

/**
 * True se il FAB GlobalCreate (centro nav) deve essere visibile.
 * Su Agenda c'è il FAB contestuale — evita doppio "+".
 */
export function shouldShowGlobalCreateFab(location) {
  const path = location?.pathname || "";
  if (path === ROUTES.agenda) return false;
  return shouldShowBottomNav(location);
}

const ALTRO_HUB_ROUTES = [
  ROUTES.altro,
  ROUTES.agenda,
  ROUTES.clienti,
  ROUTES.economia,
  ROUTES.storico,
  ROUTES.acquisti,
  ROUTES.listino,
  ROUTES.catalogoMateriali,
  ROUTES.distinteMateriali,
  ROUTES.impostazioni,
  ROUTES.datiAzienda,
  ROUTES.cestino,
];

/**
 * True se la route appartiene all'hub Altro (inclusi figli come dettaglio cliente).
 */
export function isAltroHubRoute(pathname = "") {
  const path = String(pathname || "");
  if (ALTRO_HUB_ROUTES.includes(path)) return true;
  if (path.startsWith("/cliente/")) return true;
  return false;
}

const PREVENTIVI_ROUTES = [
  ROUTES.preventivi,
  ROUTES.preventiviNuovo,
  ROUTES.archivio,
  ROUTES.incassi,
  ROUTES.preventivoIntelligente,
  ROUTES.preventivoManuale,
  ROUTES.nuovoPreventivo,
];

/**
 * True se la voce di menu corrisponde alla route corrente.
 */
export function isVoceAttiva(location, item) {
  const path = location?.pathname || "";

  if (path === item.path) return true;

  if (item.path === ROUTES.cantieri) {
    return path === ROUTES.cantieri || path.startsWith("/cantiere/");
  }

  if (item.path === ROUTES.altro) {
    return isAltroHubRoute(path);
  }

  if (item.path === ROUTES.preventivi) {
    if (PREVENTIVI_ROUTES.includes(path)) return true;
    return path.startsWith("/preventivo/");
  }

  if (item.path === ROUTES.incassi) {
    return path === ROUTES.incassi;
  }

  return false;
}
