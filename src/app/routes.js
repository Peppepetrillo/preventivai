export const ROUTES = {
  dashboard: "/",
  preventivi: "/preventivi",
  archivio: "/archivio",
  incassi: "/incassi",
  cantieri: "/cantieri",
  clienti: "/clienti",
  listino: "/listino",
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
