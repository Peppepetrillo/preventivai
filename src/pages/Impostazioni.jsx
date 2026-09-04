import {
  useState
} from "react";

import {
  Download,
  Building2,
  Cloud,
  ChevronRight,
  LockKeyhole,
  LogOut,
  Trash2,
  Upload
} from "lucide-react";
import { Link } from "react-router-dom";

import PageWrapper from "../components/PageWrapper";
import PageBackLink from "../components/PageBackLink";
import ConfirmDialog from "../components/ConfirmDialog";
import { ROUTES } from "../app/routes";
import {
  creaBackupCompleto,
  nomeFileBackup,
  ripristinaBackupCompleto
} from "../utils/backup";
import { esportaBlob } from "../utils/nativeExport";
import {
  ETICHETTE_FREQUENZA,
  ETICHETTE_STATO,
  FREQUENZE_BACKUP,
  formattaDataOraBackup,
  impostaFrequenzaBackupAutomatico,
  leggiConfigBackupAutomatico,
  ottieniSnapshotPerEsportazione,
  rifrescaStatoConfig
} from "../domain/backupAutomatico";
import { useCloudAuth } from "../contexts/cloudAuthContext";
import {
  disattivaPin,
  impostaPinSicuro,
  leggiConfigAppLock,
  pinEAttivo,
  salvaConfigAppLock,
  TIMEOUT_INATTIVITA_OPZIONI,
  validaFormatoPin
} from "../services/pinSecurity";

export default function Impostazioni() {
  const cloudAuth = useCloudAuth();

  const [pinNuovo, setPinNuovo] = useState("");
  const [pinAttivo, setPinAttivo] = useState(() => pinEAttivo());
  const [timeoutMinuti, setTimeoutMinuti] = useState(
    () => leggiConfigAppLock().timeoutMinuti
  );
  const [messaggio, setMessaggio] = useState("");
  const [salvataggioPin, setSalvataggioPin] = useState(false);
  const [configBackupAuto, setConfigBackupAuto] = useState(() =>
    rifrescaStatoConfig(leggiConfigBackupAutomatico())
  );
  const [confermaRipristinoAuto, setConfermaRipristinoAuto] = useState(false);

  async function cambiaFrequenzaBackupAutomatico(frequenza) {
    const esito = await impostaFrequenzaBackupAutomatico(frequenza);
    setConfigBackupAuto(rifrescaStatoConfig(esito.config));
    if (!esito.success) {
      setMessaggio(
        "Impossibile salvare le impostazioni del backup automatico."
      );
      return;
    }
    if (frequenza === FREQUENZE_BACKUP.disattivato) {
      setMessaggio("Backup automatico disattivato.");
    } else {
      setMessaggio("Backup automatico aggiornato.");
    }
  }

  async function esportaUltimoBackupAutomatico() {
    const snapshot = ottieniSnapshotPerEsportazione();
    if (!snapshot.disponibile) {
      setMessaggio(
        "Nessun backup automatico disponibile. Attendi il primo aggiornamento o apri l'app con il backup attivo."
      );
      return;
    }

    try {
      const contenuto = JSON.stringify(snapshot.backup, null, 2);
      const blob = new Blob([contenuto], { type: "application/json" });
      const data =
        snapshot.backup?.creatoIl?.slice(0, 10) ||
        new Date().toISOString().slice(0, 10);
      const esito = await esportaBlob(blob, `preventivai-backup-auto-${data}.json`, {
        titolo: "Backup automatico PreventivAI",
      });

      if (esito.success) {
        setMessaggio(
          esito.metodo === "download"
            ? "Ultimo backup automatico esportato."
            : "Ultimo backup automatico pronto per la condivisione."
        );
        return;
      }
      if (esito.error === "annullato") {
        setMessaggio("Esportazione annullata.");
        return;
      }
      setMessaggio("Impossibile esportare l'ultimo backup automatico.");
    } catch {
      setMessaggio("Impossibile esportare l'ultimo backup automatico.");
    }
  }

  async function eseguiRipristinoUltimoBackupAutomatico() {
    const snapshot = ottieniSnapshotPerEsportazione();
    if (!snapshot.disponibile) {
      setMessaggio("Nessun backup automatico da ripristinare.");
      setConfermaRipristinoAuto(false);
      return;
    }

    try {
      await ripristinaBackupCompleto(snapshot.backup);
      setMessaggio("Backup automatico ripristinato. Ricarico l'app...");
      window.location.reload();
    } catch {
      setMessaggio("Impossibile ripristinare il backup automatico.");
      setConfermaRipristinoAuto(false);
    }
  }

  const statoBackupLabel =
    ETICHETTE_STATO[configBackupAuto.stato] || configBackupAuto.stato;

  async function esportaBackup() {
    try {
      const backup = creaBackupCompleto();
      const contenuto = JSON.stringify(backup, null, 2);
      const blob = new Blob([contenuto], { type: "application/json" });
      const esito = await esportaBlob(blob, nomeFileBackup(), {
        titolo: "Backup PreventivAI",
      });

      if (esito.success) {
        setMessaggio(
          esito.metodo === "download"
            ? "Backup esportato."
            : "Backup pronto per la condivisione."
        );
        return;
      }

      if (esito.error === "annullato") {
        setMessaggio("Esportazione annullata.");
        return;
      }

      setMessaggio("Impossibile esportare il backup.");
    } catch {
      setMessaggio("Impossibile esportare il backup.");
    }
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
        <PageBackLink testId="impostazioni-back" />

        <div className="pro-panel-strong p-5 mb-6">
          <p className="section-label">Configurazione</p>
          <h1 className="ds-page-title mt-1">Impostazioni</h1>
          <p className="ds-text-secondary mt-2">
            Dati azienda, sicurezza e backup.
          </p>
        </div>

        {messaggio && (
          <div className="pro-panel p-4 mb-5 text-yellow-100 border-yellow-300/30">
            {messaggio}
          </div>
        )}

        <Link
          to={ROUTES.datiAzienda}
          className="pro-panel mb-4 p-5 flex items-center gap-4 min-h-[64px]"
          data-testid="impostazioni-link-dati-azienda"
        >
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-[16px] bg-yellow-400/15 text-yellow-300 shrink-0">
            <Building2 size={22} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="ds-card-title">Dati azienda</p>
            <p className="ds-text-secondary text-sm mt-1">
              Anagrafica, IBAN e testi per i PDF
            </p>
          </div>
          <ChevronRight
            size={20}
            className="text-slate-500 shrink-0"
            aria-hidden="true"
          />
        </Link>

        <Link
          to={ROUTES.cestino}
          className="pro-panel mb-6 p-5 flex items-center gap-4 min-h-[64px]"
          data-testid="impostazioni-link-cestino"
        >
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-[16px] bg-yellow-400/15 text-yellow-300 shrink-0">
            <Trash2 size={22} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="ds-card-title">Cestino</p>
            <p className="ds-text-secondary text-sm mt-1">
              Ripristina o elimina definitivamente clienti, cantieri e preventivi.
            </p>
          </div>
          <ChevronRight
            size={20}
            className="text-slate-500 shrink-0"
            aria-hidden="true"
          />
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
              type="button"
              onClick={esportaBackup}
              className="w-full btn-secondary p-5 text-lg flex items-center justify-center gap-2"
              data-testid="esporta-backup"
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

          <div
            className="mt-6 pt-6 border-t border-white/10 space-y-4"
            data-testid="backup-automatico-sezione"
          >
            <div>
              <p className="section-label">Backup automatico</p>
              <p className="ds-text-secondary text-sm mt-2 leading-relaxed">
                Il backup automatico salva una copia locale dei tuoi dati.
                Per conservare il file fuori dall&apos;app usa Esporta backup.
              </p>
            </div>

            <fieldset>
              <legend className="ds-text-primary text-sm font-medium mb-2">
                Frequenza
              </legend>
              <div className="grid gap-2">
                {Object.values(FREQUENZE_BACKUP).map((freq) => (
                  <label
                    key={freq}
                    className="flex items-center gap-3 min-h-[44px] cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="backup-automatico-frequenza"
                      value={freq}
                      checked={configBackupAuto.frequenza === freq}
                      onChange={() => cambiaFrequenzaBackupAutomatico(freq)}
                      data-testid={`backup-auto-freq-${freq}`}
                      className="h-4 w-4 accent-yellow-400"
                    />
                    <span className="ds-text-primary">
                      {ETICHETTE_FREQUENZA[freq]}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <dl className="grid gap-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="ds-text-secondary">Ultimo backup automatico</dt>
                <dd className="ds-text-primary text-right" data-testid="backup-auto-ultimo">
                  {formattaDataOraBackup(configBackupAuto.ultimoBackup)}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="ds-text-secondary">Prossimo backup</dt>
                <dd className="ds-text-primary text-right" data-testid="backup-auto-prossimo">
                  {configBackupAuto.enabled
                    ? formattaDataOraBackup(configBackupAuto.prossimoBackup)
                    : "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="ds-text-secondary">Stato</dt>
                <dd className="ds-text-primary text-right" data-testid="backup-auto-stato">
                  {statoBackupLabel}
                </dd>
              </div>
            </dl>

            {configBackupAuto.stato === "errore" ? (
              <p className="text-sm text-red-200/90 leading-relaxed">
                Salvataggio locale non riuscito
                {configBackupAuto.ultimoErrore
                  ? ` (${configBackupAuto.ultimoErrore}).`
                  : "."}{" "}
                Usa Esporta backup per una copia fuori dall&apos;app.
              </p>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={esportaUltimoBackupAutomatico}
                className="w-full btn-secondary p-4 min-h-[48px] flex items-center justify-center gap-2"
                data-testid="esporta-backup-automatico"
              >
                <Download size={18} />
                Esporta ultimo backup automatico
              </button>
              <button
                type="button"
                onClick={() => setConfermaRipristinoAuto(true)}
                className="w-full btn-secondary p-4 min-h-[48px] flex items-center justify-center gap-2"
                data-testid="ripristina-backup-automatico"
              >
                <Upload size={18} />
                Ripristina ultimo backup automatico
              </button>
            </div>
          </div>

          <ConfirmDialog
            open={confermaRipristinoAuto}
            title="Ripristinare l'ultimo backup automatico?"
            description="I dati attuali verranno sostituiti con l'ultima copia locale salvata automaticamente. L'app verrà ricaricata."
            confirmLabel="Ripristina"
            cancelLabel="Annulla"
            onConfirm={() => {
              void eseguiRipristinoUltimoBackupAutomatico();
            }}
            onCancel={() => setConfermaRipristinoAuto(false)}
            testId="conferma-ripristino-backup-auto"
          />
        </div>

      </div>
    </PageWrapper>
  );
}
