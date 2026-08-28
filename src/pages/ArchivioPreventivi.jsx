import { Navigate, useLocation } from "react-router-dom";

import { ROUTES } from "../app/routes";

/**
 * Compatibilità deep link / bookmark — reindirizza alla lista Preventivi.
 */
export default function ArchivioPreventivi() {
  const location = useLocation();
  const destinazione = location.search
    ? `${ROUTES.preventivi}${location.search}`
    : ROUTES.preventivi;

  return <Navigate to={destinazione} replace />;
}
