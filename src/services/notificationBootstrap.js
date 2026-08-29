/**
 * Bootstrap notifiche locali — permessi, listener tap/foreground, resume.
 * Chiamato una volta da main.jsx su piattaforma nativa.
 */

import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";

import {
  ROUTES,
  routeCantiere,
  routeCantiereGiornataEvidenziata,
} from "../app/routes";
import {
  controllaPermessoNotifiche,
  notificheDisponibili,
  richiediPermessoNotifiche,
} from "./notificationService";

let inizializzato = false;
let listenerResumeRegistrato = false;

/** Ultimo esito permesso al resume — solo diagnostica/test. */
let ultimoPermessoResume = null;

/**
 * Navigazione da tap notifica (HashRouter).
 * @param {object} extra
 */
export function navigaDaNotifica(extra) {
  if (typeof window === "undefined") return;

  const payload = extra && typeof extra === "object" ? extra : {};
  const lavoroId = String(payload.lavoroId || "").trim();
  const giornataId = String(payload.giornataId || "").trim();
  const attivitaId = String(payload.attivitaId || "").trim();
  const tipo = String(payload.tipo || payload.type || "").trim();

  if (lavoroId) {
    const dest = giornataId
      ? routeCantiereGiornataEvidenziata(lavoroId, giornataId)
      : routeCantiere(lavoroId);
    window.location.hash = `#${dest}`;
    return;
  }

  if (tipo === "backup-automatico") {
    window.location.hash = `#${ROUTES.impostazioni}`;
    return;
  }

  if (
    attivitaId ||
    tipo.startsWith("reminder-") ||
    Object.values({
      sopralluogo: true,
      "preventivo-da-inviare": true,
      "materiali-da-acquistare": true,
      "lavoro-in-ritardo": true,
      "cantiere-da-completare": true,
    })[tipo]
  ) {
    window.location.hash = `#${ROUTES.agenda}`;
  }
}

/**
 * Verifica permesso al resume — solo check, nessuna richiesta popup né resync.
 * @returns {Promise<{ granted: boolean, display: string, disponibile: boolean }|null>}
 */
export async function verificaPermessoAlResume() {
  if (!inizializzato || !notificheDisponibili()) return null;

  try {
    const permesso = await controllaPermessoNotifiche();
    ultimoPermessoResume = permesso.display;
    return permesso;
  } catch {
    ultimoPermessoResume = "denied";
    return { granted: false, display: "denied", disponibile: true };
  }
}

function registraListenerResumePermessi() {
  if (listenerResumeRegistrato || typeof document === "undefined") return;
  listenerResumeRegistrato = true;

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      void verificaPermessoAlResume();
    }
  });

  if (Capacitor.isNativePlatform()) {
    App.addListener("appStateChange", ({ isActive }) => {
      if (isActive) {
        void verificaPermessoAlResume();
      }
    }).catch(() => {
      // Listener opzionale: visibilitychange resta attivo su webview.
    });
  }
}

/**
 * Registra permessi e listener LocalNotifications (idempotente).
 * @returns {Promise<{ disponibile: boolean, granted?: boolean }>}
 */
export async function inizializzaNotifiche() {
  if (inizializzato || !notificheDisponibili()) {
    return { disponibile: notificheDisponibili(), granted: false };
  }
  inizializzato = true;

  try {
    const permesso = await richiediPermessoNotifiche();
    ultimoPermessoResume = permesso.display;

    await LocalNotifications.addListener(
      "localNotificationActionPerformed",
      (evento) => {
        navigaDaNotifica(evento?.notification?.extra || {});
      }
    );

    if (Capacitor.getPlatform() === "ios") {
      await LocalNotifications.addListener(
        "localNotificationReceived",
        (evento) => {
          // Con presentationOptions in capacitor.config le notifiche in foreground
          // sono gestite dal sistema; listener disponibile per debug/estensioni future.
          void evento;
        }
      );
    }

    registraListenerResumePermessi();

    return { disponibile: true, granted: permesso.granted };
  } catch {
    inizializzato = false;
    return { disponibile: true, granted: false };
  }
}

/** Solo test — reset stato singleton listener. */
export function resetInizializzazioneNotifiche() {
  inizializzato = false;
  listenerResumeRegistrato = false;
  ultimoPermessoResume = null;
}

/** Solo test — ultimo permesso rilevato al resume. */
export function leggiUltimoPermessoResume() {
  return ultimoPermessoResume;
}
