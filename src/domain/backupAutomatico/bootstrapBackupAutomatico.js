/**
 * Bootstrap backup automatico UX-7.2 — avvio e resume.
 */

import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { eseguiBackupAutomaticoSeScaduto } from "./backupAutomaticoService";

let listenerRegistrato = false;

/**
 * Controllo singolo all'avvio o al resume.
 * @returns {Promise<object>}
 */
export async function avviaControlloBackupAutomatico() {
  return eseguiBackupAutomaticoSeScaduto();
}

/**
 * Registra listener foreground (PWA + native).
 */
export function registraListenerBackupAutomatico() {
  if (listenerRegistrato || typeof document === "undefined") return;
  listenerRegistrato = true;

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      void avviaControlloBackupAutomatico();
    }
  });

  if (Capacitor.isNativePlatform()) {
    App.addListener("appStateChange", ({ isActive }) => {
      if (isActive) {
        void avviaControlloBackupAutomatico();
      }
    }).catch(() => {
      // Listener opzionale: backup on-open resta via visibilitychange.
    });
  }
}
