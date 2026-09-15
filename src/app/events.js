export const APP_EVENTS = {
  preventiviAggiornati: "preventivi-aggiornati",
  cantieriAggiornati: "cantieri-aggiornati",
  cloudSyncAggiornata: "cloud-sync-aggiornata",
};

export function notificaEventoApp(nomeEvento) {
  window.dispatchEvent(new Event(nomeEvento));
}
