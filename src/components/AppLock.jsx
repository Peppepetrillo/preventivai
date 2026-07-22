import { useCallback, useEffect, useState } from "react";
import { LockKeyhole } from "lucide-react";

import {
  APP_LOCK_SESSION_KEY,
  bloccoPerInattivitaNecessario,
  bloccaSessioneApp,
  marcaSessioneSbloccata,
  pinEAttivo,
  registraAttivitaUtente,
  verificaDisponibilitaBiometria,
  verificaPinSicuro,
} from "../services/pinSecurity";

/**
 * Blocco app locale (PIN hash + timeout inattività).
 * Nessun impatto sul cloud sync.
 */
export default function AppLock({ children }) {
  const [richiedePin] = useState(() => pinEAttivo());
  const [sbloccata, setSbloccata] = useState(() => {
    if (!pinEAttivo()) return true;
    if (bloccoPerInattivitaNecessario()) {
      bloccaSessioneApp();
      return false;
    }
    return sessionStorage.getItem(APP_LOCK_SESSION_KEY) === "true";
  });
  const [pin, setPin] = useState("");
  const [errore, setErrore] = useState("");
  const [inVerifica, setInVerifica] = useState(false);
  const [notaBiometria, setNotaBiometria] = useState("");

  const blocca = useCallback(() => {
    bloccaSessioneApp();
    setSbloccata(false);
    setPin("");
    setErrore("");
  }, []);

  useEffect(() => {
    if (!richiedePin || !sbloccata) return undefined;

    function onAttivita() {
      registraAttivitaUtente();
    }

    function onVisibilita() {
      if (document.visibilityState === "hidden") {
        registraAttivitaUtente();
        return;
      }
      if (bloccoPerInattivitaNecessario()) {
        blocca();
      }
    }

    const eventi = ["pointerdown", "keydown", "touchstart"];
    for (const evento of eventi) {
      window.addEventListener(evento, onAttivita, { passive: true });
    }
    document.addEventListener("visibilitychange", onVisibilita);

    const intervallo = window.setInterval(() => {
      if (bloccoPerInattivitaNecessario()) {
        blocca();
      }
    }, 15_000);

    return () => {
      for (const evento of eventi) {
        window.removeEventListener(evento, onAttivita);
      }
      document.removeEventListener("visibilitychange", onVisibilita);
      window.clearInterval(intervallo);
    };
  }, [richiedePin, sbloccata, blocca]);

  useEffect(() => {
    if (sbloccata || !richiedePin) return undefined;
    let attivo = true;
    verificaDisponibilitaBiometria().then((esito) => {
      if (attivo && !esito.disponibile) {
        setNotaBiometria(esito.motivo);
      }
    });
    return () => {
      attivo = false;
    };
  }, [sbloccata, richiedePin]);

  async function verificaPin(event) {
    event.preventDefault();
    setInVerifica(true);
    setErrore("");

    try {
      const ok = await verificaPinSicuro(pin);
      if (!ok) {
        setErrore("PIN non corretto.");
        setPin("");
        return;
      }

      marcaSessioneSbloccata();
      setSbloccata(true);
      setPin("");
    } catch {
      setErrore("Impossibile verificare il PIN.");
      setPin("");
    } finally {
      setInVerifica(false);
    }
  }

  if (sbloccata) return children;

  return (
    <div className="min-h-screen bg-[#070b14] text-white flex items-center justify-center px-5">
      <form
        onSubmit={verificaPin}
        className="w-full max-w-sm pro-panel-strong p-6 text-center"
      >
        <div className="w-16 h-16 rounded-[18px] bg-yellow-400 text-slate-950 flex items-center justify-center mx-auto mb-5">
          <LockKeyhole size={30} aria-hidden="true" />
        </div>

        <h1 className="text-3xl font-black">PreventivAI</h1>
        <p className="text-slate-400 mt-2 mb-5">
          Inserisci il PIN per aprire l&apos;app.
        </p>

        <input
          type="password"
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          maxLength={6}
          value={pin}
          onChange={(event) => setPin(event.target.value.replace(/\D/g, ""))}
          className="input-pro text-center text-2xl tracking-[0.35em]"
          aria-label="PIN di sblocco"
        />

        {errore ? (
          <p className="text-red-200 mt-3 text-sm font-bold">{errore}</p>
        ) : null}

        {notaBiometria ? (
          <p className="text-slate-500 mt-3 text-xs leading-relaxed">
            {notaBiometria}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={inVerifica || pin.length < 4}
          className="w-full btn-primary p-4 mt-5 disabled:opacity-45"
        >
          {inVerifica ? "Verifica..." : "Sblocca"}
        </button>
      </form>
    </div>
  );
}
