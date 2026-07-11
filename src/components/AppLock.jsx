import { useState } from "react";
import { LockKeyhole } from "lucide-react";
import { leggiPinAccesso } from "../repositories/impostazioniRepository";

export default function AppLock({ children }) {
  const pinSalvato = leggiPinAccesso();
  const [sbloccata, setSbloccata] = useState(
    !pinSalvato || sessionStorage.getItem("preventivai-sbloccata") === "true"
  );
  const [pin, setPin] = useState("");
  const [errore, setErrore] = useState("");

  function verificaPin(event) {
    event.preventDefault();

    if (pin === pinSalvato) {
      sessionStorage.setItem("preventivai-sbloccata", "true");
      setSbloccata(true);
      return;
    }

    setErrore("PIN non corretto.");
    setPin("");
  }

  if (sbloccata) return children;

  return (
    <div className="min-h-screen bg-[#070b14] text-white flex items-center justify-center px-5">
      <form
        onSubmit={verificaPin}
        className="w-full max-w-sm pro-panel-strong p-6 text-center"
      >
        <div className="w-16 h-16 rounded-[18px] bg-yellow-400 text-slate-950 flex items-center justify-center mx-auto mb-5">
          <LockKeyhole size={30} />
        </div>

        <h1 className="text-3xl font-black">PreventivAI</h1>
        <p className="text-slate-400 mt-2 mb-5">
          Inserisci il PIN per aprire l'app.
        </p>

        <input
          type="password"
          inputMode="numeric"
          autoFocus
          value={pin}
          onChange={(event) => setPin(event.target.value)}
          className="input-pro text-center text-2xl tracking-[0.35em]"
        />

        {errore && (
          <p className="text-red-200 mt-3 text-sm font-bold">{errore}</p>
        )}

        <button className="w-full btn-primary p-4 mt-5">
          Sblocca
        </button>
      </form>
    </div>
  );
}
