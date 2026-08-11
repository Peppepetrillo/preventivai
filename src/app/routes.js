export const ROUTES = {
  dashboard: "/",
  preventivi: "/preventivi",
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
