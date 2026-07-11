import { useEffect, useMemo, useState } from "react";
import AuthScreen from "./AuthScreen";
import { CloudAuthContext } from "../contexts/cloudAuthContext";
import { supabase, supabaseConfigurato } from "../lib/supabaseClient";
import {
  avviaRealtimeCloud,
  fermaRealtimeCloud,
  impostaSessioneCloud,
  pulisciSessioneCloudLocale,
  sincronizzaDaCloud,
} from "../services/cloudSyncService";

export default function CloudAuthProvider({ children }) {
  const [sessione, setSessione] = useState(null);
  const [inizializzazione, setInizializzazione] = useState(supabaseConfigurato);
  const [sincronizzazione, setSincronizzazione] = useState(
    supabaseConfigurato ? "inizializzazione" : "locale"
  );
  const [errore, setErrore] = useState("");

  useEffect(() => {
    if (!supabaseConfigurato) return undefined;

    let attivo = true;
    let ultimoUserId = null;

    async function preparaSessione(sessioneAttiva) {
      if (!attivo) return;

      const prossimoUserId = sessioneAttiva?.user?.id || null;

      if (prossimoUserId && prossimoUserId === ultimoUserId) {
        setSessione(sessioneAttiva);
        impostaSessioneCloud(sessioneAttiva);
        setInizializzazione(false);
        return;
      }

      ultimoUserId = prossimoUserId;

      setSessione(sessioneAttiva);
      impostaSessioneCloud(sessioneAttiva);

      if (!sessioneAttiva) {
        fermaRealtimeCloud();
        setSincronizzazione("non autenticato");
        setInizializzazione(false);
        return;
      }

      fermaRealtimeCloud();
      setSincronizzazione("sincronizzazione");

      try {
        await sincronizzaDaCloud();
        avviaRealtimeCloud();
        if (attivo) {
          setErrore("");
          setSincronizzazione("sincronizzato");
        }
      } catch (erroreSync) {
        console.error("Errore sincronizzazione Supabase:", erroreSync);
        if (attivo) {
          setErrore("Non riesco a sincronizzare il cloud. Controlla schema e connessione.");
          setSincronizzazione("errore");
        }
      } finally {
        if (attivo) setInizializzazione(false);
      }
    }

    supabase.auth.getSession().then(({ data }) => {
      preparaSessione(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_evento, sessioneAggiornata) => {
      preparaSessione(sessioneAggiornata);
    });

    return () => {
      attivo = false;
      fermaRealtimeCloud();
      listener.subscription.unsubscribe();
    };
  }, []);

  const valore = useMemo(
    () => ({
      configurato: supabaseConfigurato,
      sessione,
      utente: sessione?.user || null,
      sincronizzazione,
      errore,
      async accedi(email, password) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
      },
      async registrati(email, password) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;
      },
      async esci() {
        await supabase.auth.signOut();
        pulisciSessioneCloudLocale();
        setSessione(null);
        setSincronizzazione("non autenticato");
      },
    }),
    [errore, sessione, sincronizzazione]
  );

  if (!supabaseConfigurato) {
    return (
      <CloudAuthContext.Provider value={valore}>
        {children}
      </CloudAuthContext.Provider>
    );
  }

  if (inizializzazione) {
    return (
      <CloudAuthContext.Provider value={valore}>
        <div className="min-h-screen bg-[#070b14] text-white flex items-center justify-center px-5">
          <div className="pro-panel-strong p-6 text-center">
            <p className="section-label">Cloud</p>
            <h1 className="text-3xl font-black mt-1">Sincronizzazione...</h1>
            <p className="text-slate-400 mt-2">Preparo i dati Supabase.</p>
          </div>
        </div>
      </CloudAuthContext.Provider>
    );
  }

  if (!sessione) {
    return (
      <CloudAuthContext.Provider value={valore}>
        <AuthScreen
          errore={errore}
          onAccedi={valore.accedi}
          onRegistrati={valore.registrati}
        />
      </CloudAuthContext.Provider>
    );
  }

  return (
    <CloudAuthContext.Provider value={valore}>
      {children}
    </CloudAuthContext.Provider>
  );
}
