import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { Capacitor } from "@capacitor/core";
import {
  Download,
  Smartphone,
  X,
} from "lucide-react";

const STORAGE_NON_MOSTRARE = "preventivai-install-prompt-hidden";
const STORAGE_RIMANDA_A = "preventivai-install-prompt-snoozed-until";
const SETTE_GIORNI_MS = 7 * 24 * 60 * 60 * 1000;

function appInstallata() {
  const standaloneBrowser =
    window.matchMedia?.("(display-mode: standalone)")?.matches;
  const standaloneIos = window.navigator.standalone === true;

  return Boolean(standaloneBrowser || standaloneIos);
}

function leggiTimestampStorage(chiave) {
  const valore = Number(localStorage.getItem(chiave));
  return Number.isFinite(valore) ? valore : 0;
}

function rilevaDispositivo() {
  const userAgent = window.navigator.userAgent || "";
  const piattaforma = window.navigator.platform || "";
  const touchApple = piattaforma === "MacIntel" && window.navigator.maxTouchPoints > 1;
  const ios = /iPhone|iPad|iPod/i.test(userAgent) || touchApple;
  const android = /Android/i.test(userAgent);

  if (ios) return "ios";
  if (android) return "android";
  return "desktop";
}

function puoMostrarePrompt() {
  if (Capacitor.isNativePlatform()) return false;
  if (appInstallata()) return false;
  if (localStorage.getItem(STORAGE_NON_MOSTRARE) === "true") return false;

  const rimandaFinoA = leggiTimestampStorage(STORAGE_RIMANDA_A);
  return !rimandaFinoA || Date.now() >= rimandaFinoA;
}

export default function InstallPrompt() {
  const nativa = Capacitor.isNativePlatform();
  const [visibile, setVisibile] = useState(() => puoMostrarePrompt());
  const [nonMostrare, setNonMostrare] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const dispositivo = useMemo(() => rilevaDispositivo(), []);

  useEffect(() => {
    if (nativa) return undefined;

    function gestisciBeforeInstallPrompt(evento) {
      evento.preventDefault();
      setDeferredPrompt(evento);
    }

    function gestisciAppInstallata() {
      localStorage.setItem(STORAGE_NON_MOSTRARE, "true");
      setVisibile(false);
      setDeferredPrompt(null);
    }

    window.addEventListener("beforeinstallprompt", gestisciBeforeInstallPrompt);
    window.addEventListener("appinstalled", gestisciAppInstallata);

    return () => {
      window.removeEventListener("beforeinstallprompt", gestisciBeforeInstallPrompt);
      window.removeEventListener("appinstalled", gestisciAppInstallata);
    };
  }, [nativa]);

  if (nativa || !visibile) return null;

  const istruzioni =
    dispositivo === "ios"
      ? "Safari -> Condividi -> Aggiungi a Home"
      : "Chrome -> Installa app oppure Aggiungi alla schermata Home";

  function chiudi() {
    if (nonMostrare) {
      localStorage.setItem(STORAGE_NON_MOSTRARE, "true");
      localStorage.removeItem(STORAGE_RIMANDA_A);
    } else {
      localStorage.setItem(STORAGE_RIMANDA_A, String(Date.now() + SETTE_GIORNI_MS));
    }

    setVisibile(false);
  }

  async function installa() {
    if (!deferredPrompt) {
      chiudi();
      return;
    }

    deferredPrompt.prompt();
    const scelta = await deferredPrompt.userChoice;

    if (scelta?.outcome === "accepted") {
      localStorage.setItem(STORAGE_NON_MOSTRARE, "true");
      localStorage.removeItem(STORAGE_RIMANDA_A);
    } else {
      localStorage.setItem(STORAGE_RIMANDA_A, String(Date.now() + SETTE_GIORNI_MS));
    }

    setDeferredPrompt(null);
    setVisibile(false);
  }

  return (
    <aside className="fixed left-4 right-4 bottom-28 z-[60] mx-auto max-w-lg">
      <div className="pro-panel-strong border border-yellow-300/20 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.42)]">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-[16px] bg-yellow-400 text-slate-950 flex items-center justify-center shrink-0">
            <Smartphone size={25} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-xl font-black text-white">📱 Installa PreventivAI</h2>

              <button
                type="button"
                onClick={chiudi}
                className="w-9 h-9 rounded-full border border-white/10 text-slate-300 flex items-center justify-center hover:bg-white/10"
                aria-label="Chiudi guida installazione"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-sm text-slate-300 mt-2 leading-relaxed">
              Installa PreventivAI sulla schermata Home per un'esperienza più veloce
              e simile a una vera app.
            </p>

            <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-yellow-100">
              {istruzioni}
            </div>

            <label className="mt-4 flex items-center gap-3 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={nonMostrare}
                onChange={(evento) => setNonMostrare(evento.target.checked)}
                className="h-4 w-4 accent-yellow-400"
              />
              Non mostrarmelo più
            </label>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={installa}
                className="btn-primary justify-center"
              >
                <Download size={18} />
                Installa
              </button>

              <button
                type="button"
                onClick={chiudi}
                className="btn-secondary justify-center"
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
