export const ROUTES = {
  dashboard: "/",
  preventivi: "/preventivi",
  preventiviNuovo: "/preventivi/nuovo",
  preventivoIntelligente: "/preventivo-intelligente",
  preventivoManuale: "/preventivo-manuale",
  nuovoPreventivo: "/nuovo-preventivo",
  agenda: "/agenda",
  archivio: "/archivio",
  incassi: "/incassi",
  cantieri: "/cantieri",
  dettaglioCantiere: "/cantiere/:id",
  clienti: "/clienti",
  listino: "/listino",
  catalogoMateriali: "/catalogo-materiali",
  distinteMateriali: "/distinte-materiali",
  nuovaDistintaMateriali: "/distinte-materiali/nuova",
  distintaMateriali: "/distinte-materiali/:id",
  acquisti: "/acquisti",
  sopralluogo: "/sopralluogo",
  impostazioni: "/impostazioni",
  altro: "/altro",
  cestino: "/cestino",
  dettaglioPreventivo: "/preventivo/:id",
  dettaglioCliente: "/cliente/:id",
};

export function routePreventivo(id) {
  return `/preventivo/${id}`;
}

export function routeCliente(id) {
  return `/cliente/${id}`;
}

export function routeCantiere(id) {
  return `/cantiere/${id}`;
}

/** Id sezione scroll/tab cantiere (hash legacy + query ?sezione=). */
export const CANTIERE_SEZIONI = Object.freeze({
  PAGAMENTI: "sezione-pagamenti",
  PROGRAMMAZIONE: "sezione-programmazione",
  REGISTRO_LAVORI: "sezione-registro-lavori",
});

function routeCantiereSezione(id, sezione) {
  return `${routeCantiere(id)}?sezione=${encodeURIComponent(sezione)}`;
}

/** Deep-link al tab Pagamenti del cantiere. */
export function routeCantierePagamenti(id) {
  return routeCantiereSezione(id, CANTIERE_SEZIONI.PAGAMENTI);
}

/** Deep-link al tab Giornate (previsto). */
export function routeCantiereGiornate(id) {
  return routeCantiereSezione(id, CANTIERE_SEZIONI.PROGRAMMAZIONE);
}

/** Deep-link al tab Giornate (fatto / consuntivo). */
export function routeCantiereGiornateFatto(id) {
  return routeCantiereSezione(id, CANTIERE_SEZIONI.REGISTRO_LAVORI);
}

/**
 * Stato router per navigazione tab cantiere (affidabile con HashRouter).
 * @param {string} sezione
 */
export function statoNavigazioneCantiere(sezione) {
  const id = String(sezione || "").replace(/^#/, "");
  return id ? { cantiereSezione: id } : {};
}

/**
 * Risolve la sezione cantiere da state, query o hash legacy.
 * @param {import('react-router-dom').Location} location
 */
export function sezioneDaLocation(location) {
  const fromState = location?.state?.cantiereSezione;
  if (fromState) {
    return String(fromState).replace(/^#/, "");
  }

  const params = new URLSearchParams(location?.search || "");
  const fromQuery = params.get("sezione");
  if (fromQuery) {
    return String(fromQuery).replace(/^#/, "");
  }

  if (typeof window !== "undefined") {
    const hash = window.location.hash || "";
    const legacy = hash.match(/#(sezione-[a-z-]+)$/);
    if (legacy) return legacy[1];
  }

  return null;
}

/**
 * Lista preventivi con filtro stato opzionale (query ?filtro=).
 * @param {{ filtro?: string }=} opzioni
 */
export function routePreventiviLista({ filtro } = {}) {
  if (!filtro || filtro === "tutti") {
    return ROUTES.preventivi;
  }
  return `${ROUTES.preventivi}?filtro=${encodeURIComponent(filtro)}`;
}
