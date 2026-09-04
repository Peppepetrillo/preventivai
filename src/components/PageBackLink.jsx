import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  richiedeNavigazioneIndietro,
  risolviParentPath,
} from "../app/navigationConfig";
import {
  eseguiNavigazioneIndietro,
  setNavigazioneIndietroOverride,
} from "../navigation/navigateBack";

/**
 * Link/pulsante Indietro condiviso — stessa destinazione dell'edge swipe.
 *
 * @param {{
 *   label?: string,
 *   className?: string,
 *   testId?: string,
 *   forceParent?: boolean,
 *   to?: string,
 * }} props
 */
export default function PageBackLink({
  label = "Indietro",
  className = "ds-back-link mb-5",
  testId = "page-back-link",
  forceParent = false,
  to,
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const parent = to || risolviParentPath(location.pathname);

  useEffect(() => {
    if (to) {
      setNavigazioneIndietroOverride(to);
      return () => setNavigazioneIndietroOverride(null);
    }
    setNavigazioneIndietroOverride(null);
    return undefined;
  }, [to]);

  if (!to && !richiedeNavigazioneIndietro(location.pathname)) {
    return null;
  }

  function onClick(event) {
    event.preventDefault();
    eseguiNavigazioneIndietro(navigate, location.pathname, { forceParent });
  }

  return (
    <button
      type="button"
      className={className}
      onClick={onClick}
      data-testid={testId}
      data-parent={parent || ""}
      aria-label={label}
    >
      <ArrowLeft size={18} aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
}
