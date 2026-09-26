import { useState } from "react";
import { Cloud, LockKeyhole, LogIn, UserPlus } from "lucide-react";

function messaggioAccessoCloud(errore) {
  const raw = String(errore?.message || "").trim();
  const low = raw.toLowerCase();
  if (low.includes("invalid login") || low.includes("invalid credentials")) {
    return "Email o password non corretti.";
  }
  if (low.includes("email not confirmed")) {
    return "Conferma l'email prima di accedere.";
  }
  if (
    low.includes("user already registered") ||
    low.includes("already been registered")
  ) {
    return "Questa email è già registrata.";
  }
  if (low.includes("password") && (low.includes("least") || low.includes("short"))) {
    return "La password è troppo corta.";
  }
  if (/\b(error|invalid|failed|unable|network|fetch)\b/i.test(raw)) {
    return "Accesso non riuscito. Controlla i dati e riprova.";
  }
  return raw || "Accesso non riuscito.";
}

export default function AuthScreen({ errore, onAccedi, onRegistrati }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [modalita, setModalita] = useState("accesso");
  const [messaggio, setMessaggio] = useState("");
  const [caricamento, setCaricamento] = useState(false);

  async function invia(event) {
    event.preventDefault();
    setCaricamento(true);
    setMessaggio("");

    try {
      if (modalita === "registrazione") {
        await onRegistrati(email, password);
        setMessaggio(
          "Account creato. Controlla la mail se è richiesta una conferma."
        );
        return;
      }

      await onAccedi(email, password);
    } catch (erroreAuth) {
      setMessaggio(messaggioAccessoCloud(erroreAuth));
    } finally {
      setCaricamento(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#070b14] text-white flex items-center justify-center px-5">
      <form
        onSubmit={invia}
        className="w-full max-w-md pro-panel-strong p-6"
      >
        <div className="w-16 h-16 rounded-[18px] bg-yellow-400 text-slate-950 flex items-center justify-center mb-5">
          <Cloud size={30} />
        </div>

        <p className="section-label">Cloud PreventivAI</p>
        <h1 className="text-3xl font-black mt-1">
          {modalita === "accesso" ? "Accedi" : "Crea account"}
        </h1>
        <p className="text-slate-400 mt-2 mb-5">
          Sincronizza clienti, preventivi, cantieri e listino con Supabase.
        </p>

        {(messaggio || errore) && (
          <div className="pro-panel p-4 mb-4 text-yellow-100 border-yellow-300/30">
            {messaggio || errore}
          </div>
        )}

        <div className="space-y-4">
          <label className="block">
            <span className="text-sm text-slate-400">Email</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="input-pro mt-2"
              required
            />
          </label>

          <label className="block">
            <span className="text-sm text-slate-400">Password</span>
            <input
              type="password"
              autoComplete={
                modalita === "accesso" ? "current-password" : "new-password"
              }
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="input-pro mt-2"
              required
            />
          </label>

          <button
            className="w-full btn-primary p-4 flex items-center justify-center gap-2"
            disabled={caricamento}
          >
            {modalita === "accesso" ? <LogIn size={20} /> : <UserPlus size={20} />}
            {caricamento
              ? "Attendi..."
              : modalita === "accesso"
                ? "Accedi"
                : "Registrati"}
          </button>

          <button
            type="button"
            onClick={() =>
              setModalita(modalita === "accesso" ? "registrazione" : "accesso")
            }
            className="w-full btn-secondary p-4 flex items-center justify-center gap-2"
          >
            <LockKeyhole size={18} />
            {modalita === "accesso"
              ? "Non hai un account? Registrati"
              : "Hai già un account? Accedi"}
          </button>
        </div>
      </form>
    </div>
  );
}
