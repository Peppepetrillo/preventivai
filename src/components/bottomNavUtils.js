/**
 * Logica di evidenziazione BottomNav (estratta per test e per evitare
 * export misti nel componente React).
 */
import { ROUTES } from "../app/routes";

/**
 * True se la voce di menu corrisponde alla route corrente.
 * Regole RC-2B:
 * - Cantieri: /cantieri e /cantiere/:id
 * - Clienti: /clienti e /cliente/:id
 * - Preventivi (path archivio o preventivi): /archivio, /preventivi, /preventivo/:id
 * - Incassi: solo /incassi (non più /preventivo/:id)
 */
export function isVoceAttiva(location, item) {
  const path = location?.pathname || "";

  if (path === item.path) return true;

  if (item.path === ROUTES.cantieri) {
    return path === ROUTES.cantieri || path.startsWith("/cantiere/");
  }

  if (item.path === ROUTES.clienti) {
    return path.startsWith("/cliente/");
  }

  if (item.path === ROUTES.archivio || item.path === ROUTES.preventivi) {
    return (
      path === ROUTES.archivio ||
      path === ROUTES.preventivi ||
      path.startsWith("/preventivo/")
    );
  }

  return false;
}
