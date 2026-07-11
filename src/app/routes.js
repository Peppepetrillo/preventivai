export const ROUTES = {
  dashboard: "/",
  preventivi: "/preventivi",
  archivio: "/archivio",
  cantieri: "/cantieri",
  clienti: "/clienti",
  listino: "/listino",
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
