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
  Archive,
  ClipboardList,
  Package,
  ShoppingCart,
  Upload,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";

import PageWrapper from "../components/PageWrapper";
import { ROUTES } from "../app/routes";
import {
  creaBackupCompleto,
  nomeFileBackup,
  ripristinaBackupCompleto,
} from "../utils/backup";
import {
  leggiDatiAzienda,
  salvaDatiAzienda,
} from "../repositories/impostazioniRepository";
import { useCloudAuth } from "../contexts/cloudAuthContext";
import {
  disattivaPin,
  impostaPinSicuro,
  leggiConfigAppLock,
  pinEAttivo,
  salvaConfigAppLock,
  TIMEOUT_INATTIVITA_OPZIONI,
  validaFormatoPin,
} from "../services/pinSecurity";

export default function Impostazioni() {
  const cloudAuth = useCloudAuth();

  const datiSalvati =
    leggiDatiAzienda();

  const [nomeDitta, setNomeDitta] = useState(datiSalvati.nomeDitta || "");
  const [telefono, setTelefono] = useState(datiSalvati.telefono || "");
  const [email, setEmail] = useState(datiSalvati.email || "");
  const [indirizzo, setIndirizzo] = useState(datiSalvati.indirizzo || "");
  const [partitaIva, setPartitaIva] = useState(datiSalvati.partitaIva || "");
  const [condizioniGenerali, setCondizioniGenerali] = useState(
    datiSalvati.condizioniGenerali || ""
  );
  const [logo, setLogo] = useState(datiSalvati.logo || "");
  const [pinNuovo, setPinNuovo] = useState("");
  const [pinAttivo, setPinAttivo] = useState(() => pinEAttivo());
  const [timeoutMinuti, setTimeoutMinuti] = useState(
    () => leggiConfigAppLock().timeoutMinuti
  );
  const [messaggio, setMessaggio] = useState("");
  const [salvataggioPin, setSalvataggioPin] = useState(false);

  function salvaDati() {
    salvaDatiAzienda({
      nomeDitta,
      telefono,
      email,
      indirizzo,
      partitaIva,
      condizioniGenerali,
      logo,
      pdfSettings: datiSalvati.pdfSettings || undefined,
    });
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

  async function salvaPin() {
    const validazione = validaFormatoPin(pinNuovo);
    if (!validazione.ok) {
      setMessaggio(validazione.errore);
      return;
    }

    setSalvataggioPin(true);
    try {
      if (validazione.disattiva) {
        disattivaPin();
        setPinAttivo(false);
        setPinNuovo("");
        setMessaggio("Blocco app disattivato.");
        return;
      }

      await impostaPinSicuro(validazione.pin);
      salvaConfigAppLock({ timeoutMinuti });
      sessionStorage.removeItem("preventivai-sbloccata");
      setPinAttivo(true);
      setPinNuovo("");
      setMessaggio(
        "PIN aggiornato in modo sicuro. Verrà richiesto dopo l'inattività o alla prossima apertura."
      );
    } catch (errore) {
      setMessaggio(errore.message || "Impossibile salvare il PIN.");
    } finally {
      setSalvataggioPin(false);
    }
  }

  function salvaTimeoutInattivita() {
    salvaConfigAppLock({ timeoutMinuti });
    setMessaggio("Timeout di blocco aggiornato.");
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

        <Link
          to={ROUTES.archivio}
          className="pro-panel mb-3 p-5 flex items-center gap-4 min-h-[64px]"
          data-testid="impostazioni-link-archivio"
        >
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-[16px] bg-yellow-400/15 text-yellow-300 shrink-0">
            <Archive size={22} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="ds-card-title">Archivio preventivi</p>
            <p className="ds-text-secondary text-sm mt-1">
              Cerca e riapri preventivi inviati o accettati.
            </p>
          </div>
        </Link>

        <Link
          to={ROUTES.catalogoMateriali}
          className="pro-panel mb-3 p-5 flex items-center gap-4 min-h-[64px]"
        >
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-[16px] bg-yellow-400/15 text-yellow-300 shrink-0">
            <Package size={22} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="ds-card-title">Catalogo Materiali</p>
            <p className="ds-text-secondary text-sm mt-1">
              Famiglie e varianti per distinte e cantieri.
            </p>
          </div>
        </Link>

        <Link
          to={ROUTES.distinteMateriali}
          className="pro-panel mb-3 p-5 flex items-center gap-4 min-h-[64px]"
        >
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-[16px] bg-yellow-400/15 text-yellow-300 shrink-0">
            <ClipboardList size={22} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="ds-card-title">Distinte materiali</p>
            <p className="ds-text-secondary text-sm mt-1">
              Crea, modifica e condividi liste materiali.
            </p>
          </div>
        </Link>

        <Link
          to={ROUTES.acquisti}
          className="pro-panel mb-6 p-5 flex items-center gap-4 min-h-[64px]"
          data-testid="impostazioni-link-acquisti"
        >
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-[16px] bg-yellow-400/15 text-yellow-300 shrink-0">
            <ShoppingCart size={22} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="ds-card-title">Acquisti</p>
            <p className="ds-text-secondary text-sm mt-1">
              Cosa comprare per i cantieri, per lavoro o tutto insieme.
            </p>
          </div>
        </Link>

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
            <input
              type="text"
              placeholder="Indirizzo sede"
              value={indirizzo}
              onChange={(e) => setIndirizzo(e.target.value)}
              className="input-pro"
            />
            <input
              type="text"
              placeholder="Partita IVA"
              value={partitaIva}
              onChange={(e) => setPartitaIva(e.target.value)}
              className="input-pro"
            />
            <textarea
              placeholder="Condizioni generali (testo nel PDF)"
              value={condizioniGenerali}
              onChange={(e) => setCondizioniGenerali(e.target.value)}
              rows={4}
              className="input-pro resize-none"
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
                PIN locale 4–6 cifre, salvato come hash (mai in chiaro). Opzionale.
              </p>
            </div>
          </div>

          <p className="text-sm text-slate-400 mb-3">
            Stato:{" "}
            <span className="font-bold text-yellow-100">
              {pinAttivo ? "Attivo" : "Disattivato"}
            </span>
          </p>

          <div className="grid gap-3 sm:grid-cols-[1fr_auto] mb-3">
            <input
              type="password"
              inputMode="numeric"
              autoComplete="new-password"
              maxLength={6}
              placeholder={
                pinAttivo
                  ? "Nuovo PIN (lascia vuoto e salva per disattivare)"
                  : "Imposta PIN di accesso"
              }
              value={pinNuovo}
              onChange={(event) =>
                setPinNuovo(event.target.value.replace(/\D/g, ""))
              }
              className="input-pro"
              aria-label="PIN di accesso"
            />

            <button
              type="button"
              onClick={salvaPin}
              disabled={salvataggioPin}
              className="btn-primary px-5 py-4 disabled:opacity-45"
            >
              {salvataggioPin ? "Salvo..." : "Salva PIN"}
            </button>
          </div>

          <label className="block text-sm text-slate-400 mb-2" htmlFor="timeout-lock">
            Blocca dopo inattività
          </label>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <select
              id="timeout-lock"
              value={timeoutMinuti}
              onChange={(event) =>
                setTimeoutMinuti(Number(event.target.value))
              }
              className="input-pro"
            >
              {TIMEOUT_INATTIVITA_OPZIONI.map((opzione) => (
                <option key={opzione.valore} value={opzione.valore}>
                  {opzione.etichetta}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={salvaTimeoutInattivita}
              className="btn-secondary px-5 py-4"
            >
              Salva timeout
            </button>
          </div>

          <p className="text-xs text-slate-500 mt-3 leading-relaxed">
            Face ID / Touch ID: predisposti, non ancora collegati al dispositivo.
            Il PIN non viene sincronizzato sul cloud.
          </p>
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
