import { useCallback, useEffect, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { registerSW } from "virtual:pwa-register";
import { RefreshCw, X } from "lucide-react";

/**
 * Banner aggiornamento PWA: non forza il reload mentre l'utente lavora.
 * Comparsa solo quando c'è un nuovo service worker in attesa.
 */
export default function PwaUpdatePrompt() {
  const [visibile, setVisibile] = useState(false);
  const aggiornaSwRef = useRef(null);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) return undefined;
    if (!("serviceWorker" in navigator)) return undefined;

    aggiornaSwRef.current = registerSW({
      immediate: true,
      onNeedRefresh() {
        setVisibile(true);
      },
      onOfflineReady() {
        // Silenzioso: app già pronta offline.
      },
    });

    return undefined;
  }, []);

  const applicaAggiornamento = useCallback(() => {
    aggiornaSwRef.current?.(true);
    setVisibile(false);
  }, []);

  const rimanda = useCallback(() => {
    setVisibile(false);
  }, []);

  if (!visibile) return null;

  return (
    <aside
      className="fixed left-4 right-4 bottom-28 z-[65] mx-auto max-w-lg"
      role="status"
      data-testid="pwa-update-prompt"
    >
      <div className="pro-panel-strong border border-yellow-300/20 p-4 shadow-[var(--shadow-soft)]">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-[14px] bg-yellow-400 text-slate-950 flex items-center justify-center shrink-0">
            <RefreshCw size={22} aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h2 className="ds-card-title text-white">Aggiornamento disponibile</h2>
              <button
                type="button"
                onClick={rimanda}
                className="min-h-[44px] min-w-[44px] rounded-full border border-white/10 text-slate-300 flex items-center justify-center"
                aria-label="Chiudi avviso aggiornamento"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <p className="ds-text-secondary mt-1">
              C&apos;è una nuova versione di PreventivAI. Aggiorna quando hai
              finito il lavoro in corso.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={applicaAggiornamento}
                className="btn-primary min-h-[48px] justify-center"
                data-testid="pwa-update-confirm"
              >
                Aggiorna ora
              </button>
              <button
                type="button"
                onClick={rimanda}
                className="btn-secondary min-h-[48px] justify-center"
                data-testid="pwa-update-later"
              >
                Più tardi
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
