import {
  useState,
} from "react";

import {
  Download,
  Building2,
  Cloud,
  ImagePlus,
  LockKeyhole,
  LogOut,
  Upload,
  X,
} from "lucide-react";

import PageWrapper from "../components/PageWrapper";
import {
  creaBackupCompleto,
  nomeFileBackup,
  ripristinaBackupCompleto,
} from "../utils/backup";
import {
  leggiDatiAzienda,
  leggiPinAccesso,
  salvaDatiAzienda,
  salvaPinAccesso,
} from "../repositories/impostazioniRepository";
import { useCloudAuth } from "../contexts/cloudAuthContext";

export default function Impostazioni() {
  const cloudAuth = useCloudAuth();

  const datiSalvati =
    leggiDatiAzienda();

  const [nomeDitta, setNomeDitta] = useState(datiSalvati.nomeDitta || "");
  const [telefono, setTelefono] = useState(datiSalvati.telefono || "");
  const [email, setEmail] = useState(datiSalvati.email || "");
  const [logo, setLogo] = useState(datiSalvati.logo || "");
  const [pinAccesso, setPinAccesso] = useState(leggiPinAccesso());
  const [messaggio, setMessaggio] = useState("");

  function salvaDati() {
    salvaDatiAzienda({ nomeDitta, telefono, email, logo });
    setMessaggio("Dati azienda salvati sul dispositivo.");
  }

  function caricaLogo(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessaggio("Seleziona un file immagine valido.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setLogo(String(reader.result || ""));
      setMessaggio("Logo caricato. Ricorda di salvare i dati azienda.");
    };
    reader.readAsDataURL(file);
  }

  function esportaBackup() {
    const backup = creaBackupCompleto();
    const contenuto = JSON.stringify(backup, null, 2);
    const blob = new Blob([contenuto], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = nomeFileBackup();
    link.click();
    URL.revokeObjectURL(url);
  }

  function importaBackup(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const backup = JSON.parse(String(reader.result || ""));
        await ripristinaBackupCompleto(backup);
        setMessaggio("Backup ripristinato. Ricarico l'app...");
        window.location.reload();
      } catch {
        setMessaggio("Il file selezionato non è un backup valido di PreventivAI.");
      } finally {
        event.target.value = "";
      }
    };
    reader.readAsText(file);
  }

  function salvaPin() {
    const pinPulito = pinAccesso.trim();

    if (pinPulito && pinPulito.length < 4) {
      setMessaggio("Usa un PIN di almeno 4 cifre.");
      return;
    }

    salvaPinAccesso(pinPulito);
    sessionStorage.removeItem("preventivai-sbloccata");
    setMessaggio(
      pinPulito
        ? "PIN app aggiornato. Verrà richiesto alla prossima apertura."
        : "PIN app rimosso."
    );
  }

  return (
    <PageWrapper>
      <div className="pro-page text-white">

        <div className="pro-panel-strong p-5 mb-6">
          <p className="section-label">Configurazione</p>
          <h1 className="text-3xl sm:text-4xl font-black mt-1">Impostazioni</h1>
          <p className="text-slate-400 mt-2">Dati aziendali, PDF e backup.</p>
        </div>

        {messaggio && (
          <div className="pro-panel p-4 mb-5 text-yellow-100 border-yellow-300/30">
            {messaggio}
          </div>
        )}

        <div className="pro-panel p-5 mb-5">
          <div className="flex items-center gap-4 mb-5">
            <Cloud size={28} />
            <div>
              <h2 className="text-2xl font-bold">Cloud Supabase</h2>
              <p className="text-slate-400 mt-1">
                Account, sincronizzazione e sessione.
              </p>
            </div>
          </div>

          {cloudAuth.configurato ? (
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <div className="rounded-[14px] border border-white/10 bg-black/[0.18] p-4">
                <p className="text-sm text-slate-400">Account</p>
                <p className="font-black mt-1">
                  {cloudAuth.utente?.email || "Non autenticato"}
                </p>
                <p className="text-sm text-slate-400 mt-2">
                  Stato: {cloudAuth.sincronizzazione}
                </p>
                {cloudAuth.errore && (
                  <p className="text-sm text-yellow-100 mt-2">
                    {cloudAuth.errore}
                  </p>
                )}
              </div>

              <button
                onClick={cloudAuth.esci}
                className="rounded-[14px] border border-red-400/25 bg-red-500/10 px-5 py-4 font-black text-red-100 flex items-center justify-center gap-2"
              >
                <LogOut size={19} />
                Esci
              </button>
            </div>
          ) : (
            <div className="rounded-[14px] border border-white/10 bg-black/[0.18] p-4 text-slate-400">
              Configura `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` per attivare il cloud.
            </div>
          )}
        </div>

        <div className="pro-panel p-5 mb-5">
          <div className="flex items-center gap-4 mb-5">
            <Building2 size={28} />
            <div>
              <h2 className="text-2xl font-bold">Dati Azienda</h2>
              <p className="text-slate-400 mt-1">Informazioni utilizzate nei PDF</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[16px] border border-white/10 bg-black/[0.18] p-4">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <ImagePlus size={22} className="text-yellow-300" />
                  <div>
                    <p className="font-black">Logo azienda</p>
                    <p className="text-slate-400 text-sm">
                      Usato nella dashboard e nei documenti.
                    </p>
                  </div>
                </div>

                {logo && (
                  <button
                    onClick={() => setLogo("")}
                    className="w-10 h-10 rounded-[12px] bg-red-500/10 border border-red-400/20 text-red-100 flex items-center justify-center"
                    aria-label="Rimuovi logo"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-[16px] border border-white/10 bg-slate-950/50 flex items-center justify-center overflow-hidden shrink-0">
                  {logo ? (
                    <img
                      src={logo}
                      alt="Logo azienda"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImagePlus size={28} className="text-slate-500" />
                  )}
                </div>

                <label className="btn-secondary px-5 py-4 cursor-pointer">
                  Carica logo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={caricaLogo}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <input
              type="text"
              placeholder="Nome ditta"
              value={nomeDitta}
              onChange={(e) => setNomeDitta(e.target.value)}
              className="input-pro"
            />
            <input
              type="text"
              placeholder="Telefono"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              className="input-pro"
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-pro"
            />
            <button
              onClick={salvaDati}
              className="w-full btn-primary p-5 text-lg"
            >
              Salva dati
            </button>
          </div>
        </div>

        <div className="pro-panel p-5 mb-5">
          <div className="flex items-center gap-4 mb-5">
            <LockKeyhole size={28} />
            <div>
              <h2 className="text-2xl font-bold">Blocco app</h2>
              <p className="text-slate-400 mt-1">
                Proteggi clienti e preventivi con un PIN locale.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <input
              type="password"
              inputMode="numeric"
              placeholder="PIN di accesso"
              value={pinAccesso}
              onChange={(event) => setPinAccesso(event.target.value)}
              className="input-pro"
            />

            <button
              onClick={salvaPin}
              className="btn-primary px-5 py-4"
            >
              Salva PIN
            </button>
          </div>
        </div>

        <div className="pro-panel p-5">
          <div className="flex items-center gap-4 mb-5">
            <Download size={28} />
            <div>
              <h2 className="text-2xl font-bold">Backup dati</h2>
              <p className="text-slate-400 mt-1">
                Esporta o ripristina clienti, preventivi, listino e dati azienda.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              onClick={esportaBackup}
              className="w-full btn-secondary p-5 text-lg flex items-center justify-center gap-2"
            >
              <Download size={20} />
              Esporta backup
            </button>

            <label className="w-full btn-secondary p-5 text-lg flex items-center justify-center gap-2 cursor-pointer">
              <Upload size={20} />
              Importa backup
              <input
                type="file"
                accept="application/json,.json"
                onChange={importaBackup}
                className="hidden"
              />
            </label>
          </div>
        </div>

      </div>
    </PageWrapper>
  );
}
