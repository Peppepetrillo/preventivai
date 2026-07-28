import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  Copy,
  Download,
  Eye,
  HardHat,
  Save,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import { ROUTES, routeCantiere, routePreventivo } from "../app/routes";
import { leggiDatiAzienda } from "../repositories/impostazioniRepository";
import {
  eliminaPreventivo as eliminaPreventivoRepository,
  leggiPreventivi,
  salvaNuovoPreventivo,
  salvaPreventivi,
} from "../repositories/preventiviRepository";
import {
  aggiornaCampoLavorazione,
  duplicaPreventivo as duplicaDatiPreventivo,
  preparaDatiPreventivo,
} from "../features/preventivi/preventiviDomain";
import {
  calcolaDaIncassare,
  normalizzaPreventivoIncasso,
  registraIncasso,
  segnaPreventivoSaldato,
} from "../features/preventivi/incassiDomain";
import { classeColoreStatoPreventivo } from "../features/preventivi/archivioPreventiviUtils";
import {
  AZIONI_PREVENTIVO,
  EVENTI_WORKFLOW,
  EVENTI_WORKFLOW_LABEL,
  STATI_PREVENTIVO,
  accettaPreventivo,
  annullaPreventivo,
  convertiInCantiere,
  etichettaStatoPreventivo,
  inviaPreventivo,
  normalizzaStatoPreventivo,
  ottieniAzioniDisponibili,
  ottieniTimeline,
  trovaCantiereCollegato,
} from "../domain/workflow";
import { generaPdfPreventivo } from "../services/preventiviPdfService";
import {
  calcolaTotali,
  calcolaSaldo,
  formatEuro,
  normalizzaNumero,
} from "../utils/preventivi";
import NumericInput from "../components/NumericInput";
import PdfAnteprima from "../components/PdfAnteprima";
import QualityCheckCard from "../components/QualityCheckCard";
import FirmaClienteSection from "../features/preventivi/components/FirmaClienteSection";
import CondivisioneSection from "../features/preventivi/components/CondivisioneSection";
import { salvaFirma, ottieniFirma } from "../domain/firma";
import { risolviDocumentoDaCondividere } from "../domain/condivisione";
import { arricchisciPreventivoLegacy } from "../domain/catalogo";
import {
  contaRegoleAttive,
  generateQualityChecks,
} from "../domain/qualityCheck";

export default function DettaglioPreventivo() {
  const { id } = useParams();
  const navigate = useNavigate();

  const archivio = leggiPreventivi();
  const indicePreventivo = archivio.findIndex(
    (p) => String(p.id) === String(id)
  );
  const preventivoGrezzo = archivio[indicePreventivo];
  const preventivo = preventivoGrezzo
    ? arricchisciPreventivoLegacy(preventivoGrezzo)
    : null;
  const datiAzienda = leggiDatiAzienda();

  const [cliente, setCliente] = useState(preventivo?.cliente || "");
  const [stato, setStato] = useState(
    () => normalizzaStatoPreventivo(preventivo?.stato)
  );
  const [lavorazioni, setLavorazioni] = useState(
    preventivo?.lavorazioni || []
  );
  const [sconto, setSconto] = useState(preventivo?.sconto || 0);
  const [iva, setIva] = useState(preventivo?.iva ?? 22);
  const [validita, setValidita] = useState(preventivo?.validita ?? 30);
  const [pagamento, setPagamento] = useState(
    preventivo?.pagamento || "Bonifico bancario"
  );
  const [acconto, setAcconto] = useState(preventivo?.acconto || 0);
  const [note, setNote] = useState(preventivo?.note || "");
  const [cantiereId, setCantiereId] = useState(preventivo?.cantiereId || "");
  const [incassato, setIncassato] = useState(
    () => normalizzaPreventivoIncasso(preventivo || {}).incassato || 0
  );
  const [noteIncasso, setNoteIncasso] = useState(preventivo?.noteIncasso || "");
  const [nuovoIncasso, setNuovoIncasso] = useState("");
  const [messaggio, setMessaggio] = useState("");
  const [confermaRifiuto, setConfermaRifiuto] = useState(false);
  const [confermaEliminaPreventivo, setConfermaEliminaPreventivo] =
    useState(false);
  const [timelineTick, setTimelineTick] = useState(0);
  const [pdfAnteprimaUrl, setPdfAnteprimaUrl] = useState("");
  const [pdfAnteprimaAperta, setPdfAnteprimaAperta] = useState(false);
  const [pdfInElaborazione, setPdfInElaborazione] = useState(false);

  const totali = calcolaTotali(lavorazioni, sconto, iva);
  const saldo = calcolaSaldo(totali.totale, acconto);
  const qualityReport = generateQualityChecks({
    ...(preventivo || {}),
    cliente,
    lavorazioni,
  });
  const qualityControlliTotali = contaRegoleAttive();
  const preventivoIncasso = normalizzaPreventivoIncasso({
    ...preventivo,
    totale: totali.totale,
    incassato,
    noteIncasso,
  });
  const daIncassare = calcolaDaIncassare(preventivoIncasso);
  const preventivoCorrente = {
    ...preventivo,
    stato,
    cantiereId: cantiereId || preventivo?.cantiereId,
  };
  const cantiereCollegato = trovaCantiereCollegato(preventivoCorrente);
  const cantiereCollegatoId =
    cantiereId || preventivo?.cantiereId || cantiereCollegato?.id;
  const azioniDisponibili = ottieniAzioniDisponibili(preventivoCorrente);
  const timeline = ottieniTimeline(preventivo?.id);
  // timelineTick forza refresh dopo mutazioni workflow
  const timelineKey = `tl-${timelineTick}-${timeline.length}`;

  function aggiornaLavorazione(index, campo, valore) {
    setLavorazioni(
      lavorazioni.map((item, i) =>
        i === index
          ? aggiornaCampoLavorazione(item, campo, valore)
          : item
      )
    );
  }

  function eliminaLavorazione(index) {
    setLavorazioni(lavorazioni.filter((_, i) => i !== index));
  }

  function datiAggiornati() {
    return preparaDatiPreventivo({
      preventivo: {
        ...preventivo,
        cantiereId: cantiereId || preventivo?.cantiereId,
        incassato,
        noteIncasso,
      },
      cliente,
      stato: stato || "Bozza",
      lavorazioni,
      sconto: normalizzaNumero(sconto),
      iva: normalizzaNumero(iva),
      validita: normalizzaNumero(validita, 30),
      pagamento: pagamento.trim(),
      acconto: normalizzaNumero(acconto),
      note,
    });
  }

  function aggiornaIncassoPreventivo(prossimoPreventivo) {
    setIncassato(prossimoPreventivo.incassato);
    setNoteIncasso(prossimoPreventivo.noteIncasso || "");
    salvaPreventivi(
      archivio.map((item, index) =>
        index === indicePreventivo
          ? preparaDatiPreventivo({
              preventivo: prossimoPreventivo,
              cliente,
              stato: stato || "Bozza",
              lavorazioni,
              sconto: normalizzaNumero(sconto),
              iva: normalizzaNumero(iva),
              validita: normalizzaNumero(validita, 30),
              pagamento: pagamento.trim(),
              acconto: normalizzaNumero(acconto),
              note,
            })
          : item
      )
    );
  }

  function registraNuovoIncasso() {
    const importo = normalizzaNumero(nuovoIncasso);

    if (importo <= 0) {
      setMessaggio("Inserisci un importo da incassare.");
      return;
    }

    aggiornaIncassoPreventivo(
      registraIncasso(
        {
          ...datiAggiornati(),
          incassato,
          noteIncasso,
        },
        importo
      )
    );
    setNuovoIncasso("");
    setMessaggio("Incasso registrato.");
  }

  function segnaSaldato() {
    aggiornaIncassoPreventivo(
      segnaPreventivoSaldato({
        ...datiAggiornati(),
        incassato,
        noteIncasso,
      })
    );
    setMessaggio("Preventivo segnato come saldato.");
  }

  function salvaModifiche() {
    const archivioAggiornato = archivio.map((item, index) =>
      index === indicePreventivo ? datiAggiornati() : item
    );

    salvaPreventivi(archivioAggiornato);
    setMessaggio("Preventivo aggiornato sul dispositivo.");
  }

  function duplicaPreventivo() {
    const nuovoPreventivo = duplicaDatiPreventivo({
      archivio,
      datiPreventivo: datiAggiornati(),
      cliente,
    });

    salvaNuovoPreventivo(nuovoPreventivo);
    navigate(routePreventivo(nuovoPreventivo.id));
  }

  function eliminaPreventivo() {
    if (!confermaEliminaPreventivo) {
      setConfermaEliminaPreventivo(true);
      return;
    }
    eliminaPreventivoRepository(preventivo.id);
    navigate(ROUTES.archivio);
  }

  function eseguiAnnulla() {
    if (!confermaRifiuto) {
      setConfermaRifiuto(true);
      return;
    }
    const risultato = annullaPreventivo(preventivo.id);
    if (!risultato.success) {
      setMessaggio(risultato.error || "Operazione non riuscita.");
      setConfermaRifiuto(false);
      return;
    }
    setConfermaRifiuto(false);
    sincronizzaDaWorkflow(risultato.preventivo, "Preventivo rifiutato.");
  }

  async function generaDocumentoPdf({
    salva = true,
    apriAnteprima = false,
    firmato = undefined,
  } = {}) {
    setPdfInElaborazione(true);
    try {
      const dati = datiAggiornati();
      const risultato = await generaPdfPreventivo({
        preventivo: dati,
        datiAzienda,
        cliente,
        stato,
        lavorazioni,
        validita,
        pagamento,
        note,
        sconto,
        iva,
        acconto,
        totali,
        salva,
        firmato,
      });

      const firmaEsistente = ottieniFirma(dati.id);
      if (firmaEsistente && risultato?.nomeFile?.includes("_firmato")) {
        salvaFirma(firmaEsistente, {
          preventivo: dati,
          registraFirmato: true,
        });
      }

      if (pdfAnteprimaUrl) {
        URL.revokeObjectURL(pdfAnteprimaUrl);
      }
      if (risultato?.blobUrl) {
        setPdfAnteprimaUrl(risultato.blobUrl);
      }
      if (apriAnteprima) {
        setPdfAnteprimaAperta(true);
      }
      setMessaggio(
        salva
          ? risultato?.nomeFile?.includes("_firmato")
            ? "PDF firmato generato e scaricato."
            : "PDF generato e scaricato."
          : "Anteprima PDF aggiornata."
      );
      return risultato;
    } catch {
      setMessaggio("Non è stato possibile generare il PDF.");
      return null;
    } finally {
      setPdfInElaborazione(false);
    }
  }

  async function generaPDF() {
    await generaDocumentoPdf({ salva: true, apriAnteprima: false });
  }

  async function anteprimaPDF() {
    await generaDocumentoPdf({ salva: false, apriAnteprima: true });
  }

  function chiudiAnteprimaPdf() {
    setPdfAnteprimaAperta(false);
  }

  function sincronizzaDaWorkflow(prossimoPreventivo, testoOk) {
    if (prossimoPreventivo?.stato) {
      setStato(normalizzaStatoPreventivo(prossimoPreventivo.stato));
    }
    if (prossimoPreventivo?.cantiereId) {
      setCantiereId(prossimoPreventivo.cantiereId);
    }
    setTimelineTick((n) => n + 1);
    setMessaggio(testoOk);
  }

  function eseguiAccetta() {
    salvaModificheSilenzioso();
    const risultato = accettaPreventivo(preventivo.id);
    if (!risultato.success) {
      setMessaggio(risultato.error || "Accettazione non riuscita.");
      return;
    }
    sincronizzaDaWorkflow(risultato.preventivo, "Preventivo accettato.");
  }

  function eseguiInvia() {
    salvaModificheSilenzioso();
    const risultato = inviaPreventivo(preventivo.id);
    if (!risultato.success) {
      setMessaggio(risultato.error || "Invio non riuscito.");
      return;
    }
    sincronizzaDaWorkflow(risultato.preventivo, "Preventivo segnato come inviato.");
  }

  function salvaModificheSilenzioso() {
    const archivioAggiornato = leggiPreventivi().map((item, index) =>
      index === indicePreventivo ? datiAggiornati() : item
    );
    salvaPreventivi(archivioAggiornato);
  }

  function trasformaInCantiere() {
    try {
      salvaModificheSilenzioso();
      const risultato = convertiInCantiere(preventivo.id);
      if (!risultato.success) {
        setMessaggio(risultato.error || "Non è stato possibile creare il cantiere.");
        return;
      }
      setCantiereId(risultato.cantiere.id);
      setStato(risultato.preventivo.stato || STATI_PREVENTIVO.CONVERTITO);
      setTimelineTick((n) => n + 1);
      setMessaggio(
        risultato.creato
          ? "Cantiere creato e collegato al preventivo."
          : "Cantiere già collegato."
      );
      navigate(routeCantiere(risultato.cantiere.id));
    } catch (errore) {
      setMessaggio(errore.message || "Non è stato possibile creare il cantiere.");
    }
  }

  function apriCantiereCollegato() {
    navigate(routeCantiere(cantiereCollegatoId));
  }

  if (!preventivo) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Preventivo non trovato
      </div>
    );
  }

  return (
    <div className="pro-page text-white">
      <Link to={ROUTES.archivio} className="ds-back-link mb-5">
        <ArrowLeft size={18} />
        Archivio
      </Link>

      <div className="mb-6 pro-panel-strong p-5">

        <p className="section-label">
          {preventivo.numero || `PREV-${preventivo.id}`}
        </p>
        <div className="flex flex-wrap items-center gap-3 mt-1">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
            Dettaglio preventivo
          </h1>
          <span
            key={stato}
            className={`ux-badge-pulse px-3 py-1 rounded-full text-sm font-semibold text-white ${classeColoreStatoPreventivo(stato)}`}
          >
            {etichettaStatoPreventivo(stato)}
          </span>
        </div>
        <p className="text-slate-400 mt-2">
          {cliente || "Cliente"} · due fasi dello stesso lavoro
        </p>

        {azioniDisponibili.includes(AZIONI_PREVENTIVO.CONVERTI_CANTIERE) ? (
          <button
            type="button"
            onClick={trasformaInCantiere}
            className="mt-5 w-full btn-primary min-h-[56px] text-base font-black flex items-center justify-center gap-2"
          >
            🚀 Inizia Cantiere
          </button>
        ) : null}

        {azioniDisponibili.includes(AZIONI_PREVENTIVO.APRI_CANTIERE) &&
        cantiereCollegatoId ? (
          <button
            type="button"
            onClick={apriCantiereCollegato}
            className="mt-5 w-full btn-primary min-h-[56px] text-base font-black flex items-center justify-center gap-2"
          >
            ➡️ Apri Cantiere
          </button>
        ) : null}
      </div>

      {messaggio && (
        <div className="pro-panel p-4 mb-5 text-yellow-100 border-yellow-300/30">
          {messaggio}
        </div>
      )}

      <section className="pro-panel p-5 mb-5 space-y-4">
        <label className="block">
          <span className="text-sm text-slate-400">Cliente</span>
          <input
            value={cliente}
            onChange={(event) => setCliente(event.target.value)}
            className="mt-2 input-pro"
          />
        </label>

        <label className="block">
          <span className="text-sm text-slate-400">Stato</span>
          <select
            value={stato}
            onChange={(event) => setStato(event.target.value)}
            className="mt-2 input-pro"
          >
            <option value={STATI_PREVENTIVO.BOZZA}>🟡 Bozza</option>
            <option value={STATI_PREVENTIVO.INVIATO}>🔵 Inviato</option>
            <option value={STATI_PREVENTIVO.ACCETTATO}>🟢 Accettato</option>
            <option value={STATI_PREVENTIVO.CONVERTITO}>In cantiere</option>
            <option value={STATI_PREVENTIVO.LAVORO_COMPLETATO}>
              🏁 Lavoro completato
            </option>
            <option value={STATI_PREVENTIVO.RIFIUTATO}>🔴 Rifiutato</option>
          </select>
        </label>
      </section>

      <section className="pro-panel p-5 mb-5 space-y-4">
        <div>
          <p className="section-label">Workflow operativo</p>
          <h2 className="text-xl font-black mt-1">Preventivo → Cantiere</h2>
          <p className="text-sm text-slate-400 mt-2">
            {stato === STATI_PREVENTIVO.LAVORO_COMPLETATO
              ? "Lavoro concluso. Puoi ancora aprire il cantiere."
              : stato === STATI_PREVENTIVO.CONVERTITO || cantiereCollegatoId
                ? "Preventivo collegato a un cantiere."
                : stato === STATI_PREVENTIVO.ACCETTATO
                  ? "Preventivo accettato: un tocco per iniziare il cantiere."
                  : "Accetta il preventivo per abilitare il cantiere."}
          </p>
        </div>

        {(stato === STATI_PREVENTIVO.CONVERTITO ||
          stato === STATI_PREVENTIVO.LAVORO_COMPLETATO ||
          cantiereCollegatoId) && (
          <div className="rounded-[14px] border border-emerald-400/25 bg-emerald-400/10 px-3.5 py-3">
            <p className="text-sm font-semibold text-emerald-100">
              ✅ Collegato al Cantiere
            </p>
            {cantiereCollegatoId ? (
              <Link
                to={routeCantiere(cantiereCollegatoId)}
                className="inline-flex min-h-[44px] items-center gap-2 mt-2 text-sm font-semibold text-yellow-200"
              >
                <HardHat size={16} aria-hidden="true" />
                ➡️ Apri Cantiere
              </Link>
            ) : null}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {azioniDisponibili.includes(AZIONI_PREVENTIVO.INVIA) ? (
            <button
              type="button"
              onClick={eseguiInvia}
              className="btn-secondary px-4 py-3 text-sm font-semibold"
            >
              Segna inviato
            </button>
          ) : null}
          {azioniDisponibili.includes(AZIONI_PREVENTIVO.ACCETTA) ? (
            <button
              type="button"
              onClick={eseguiAccetta}
              className="btn-secondary px-4 py-3 text-sm font-semibold flex items-center gap-2"
            >
              <Check size={16} aria-hidden="true" />
              Accetta
            </button>
          ) : null}
          {azioniDisponibili.includes(AZIONI_PREVENTIVO.CONVERTI_CANTIERE) ? (
            <button
              type="button"
              onClick={trasformaInCantiere}
              className="btn-primary px-5 py-3 flex items-center justify-center gap-2 font-black"
            >
              🚀 Inizia Cantiere
            </button>
          ) : null}
          {azioniDisponibili.includes(AZIONI_PREVENTIVO.APRI_CANTIERE) &&
          cantiereCollegatoId ? (
            <button
              type="button"
              onClick={apriCantiereCollegato}
              className="btn-secondary px-5 py-3 flex items-center justify-center gap-2"
            >
              <HardHat size={19} aria-hidden="true" />
              ➡️ Apri Cantiere
            </button>
          ) : null}
          {azioniDisponibili.includes(AZIONI_PREVENTIVO.ANNULLA) ||
          azioniDisponibili.includes(AZIONI_PREVENTIVO.RIFIUTA) ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={eseguiAnnulla}
                className={`btn-secondary px-4 py-3 text-sm font-semibold flex items-center gap-2 text-red-200 ${
                  confermaRifiuto ? "border-red-400/50 bg-red-500/15" : ""
                }`}
              >
                <X size={16} aria-hidden="true" />
                {confermaRifiuto ? "Conferma rifiuto" : "Rifiuta"}
              </button>
              {confermaRifiuto ? (
                <button
                  type="button"
                  onClick={() => setConfermaRifiuto(false)}
                  className="btn-secondary px-4 py-3 text-sm font-semibold"
                >
                  Annulla
                </button>
              ) : null}
            </div>
          ) : null}
        </div>

        {timeline.length > 0 ? (
          <div className="pt-2 border-t border-white/[0.06]">
            <h3 className="text-[12px] font-medium text-slate-400 mb-2">
              Timeline
            </h3>
            <ol className="space-y-1.5" aria-label="Timeline preventivo" key={timelineKey}>
              {timeline
                .filter((e) =>
                  [
                    EVENTI_WORKFLOW.PREVENTIVO_CREATO,
                    EVENTI_WORKFLOW.PREVENTIVO_INVIATO,
                    EVENTI_WORKFLOW.PREVENTIVO_ACCETTATO,
                    EVENTI_WORKFLOW.CANTIERE_CREATO,
                    EVENTI_WORKFLOW.PREVENTIVO_CONVERTITO,
                    EVENTI_WORKFLOW.PREVENTIVO_ANNULLATO,
                  ].includes(e.tipo)
                )
                .map((evento) => (
                  <li
                    key={evento.id}
                    className="text-xs text-slate-300 flex items-start gap-2"
                  >
                    <span className="text-yellow-200/80 shrink-0">•</span>
                    <span>
                      {evento.label ||
                        EVENTI_WORKFLOW_LABEL[evento.tipo] ||
                        evento.tipo}
                    </span>
                  </li>
                ))}
            </ol>
          </div>
        ) : null}
      </section>

      <FirmaClienteSection
        preventivo={{ ...datiAggiornati(), stato }}
        onMessaggio={setMessaggio}
        pdfInElaborazione={pdfInElaborazione}
        onRigeneraPdf={({ firmato } = {}) =>
          generaDocumentoPdf({ salva: true, apriAnteprima: false, firmato })
        }
      />

      <CondivisioneSection
        preventivo={{ ...datiAggiornati(), stato }}
        onMessaggio={setMessaggio}
        inElaborazione={pdfInElaborazione}
        onVisualizzaPdf={() =>
          generaDocumentoPdf({
            salva: false,
            apriAnteprima: true,
            firmato: risolviDocumentoDaCondividere(preventivo.id, datiAggiornati())
              .firmato,
          })
        }
        preparaDocumento={async ({ firmato } = {}) => {
          // Documento già in anteprima: riusa il blob senza riscaricare.
          // Se assente, genera una sola volta su azione esplicita dell'utente.
          if (pdfAnteprimaUrl) {
            try {
              const risposta = await fetch(pdfAnteprimaUrl);
              const blob = await risposta.blob();
              const docInfo = risolviDocumentoDaCondividere(
                preventivo.id,
                datiAggiornati()
              );
              return {
                blob,
                nomeFile: docInfo.nomeFile,
                firmato: docInfo.firmato,
              };
            } catch {
              // ricade su generazione esplicita
            }
          }
          const risultato = await generaDocumentoPdf({
            salva: false,
            apriAnteprima: false,
            firmato,
          });
          if (!risultato?.blob) return null;
          return {
            blob: risultato.blob,
            nomeFile: risultato.nomeFile,
            firmato: Boolean(firmato),
          };
        }}
      />

      <section className="space-y-4 mb-5">
        {lavorazioni.map((item, index) => (
          <div
            key={`${item.nome}-${index}`}
            className="pro-panel p-5"
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <input
                value={item.nome}
                onChange={(event) =>
                  aggiornaLavorazione(index, "nome", event.target.value)
                }
                className="w-full bg-transparent text-xl font-black outline-none"
              />

              <button
                onClick={() => eliminaLavorazione(index)}
                className="w-11 h-11 rounded-[14px] bg-red-500/20 text-red-200 flex items-center justify-center shrink-0"
                aria-label="Elimina lavorazione"
              >
                <Trash2 size={18} />
              </button>
            </div>

            <div className="grid grid-cols-[1fr_1fr_72px] gap-3">
              <label>
                <span className="text-xs text-slate-400">Quantità</span>
                <NumericInput
                  min="0"
                  value={item.quantita}
                  inputMode="decimal"
                  onChange={(event) =>
                    aggiornaLavorazione(index, "quantita", event)
                  }
                  className="mt-1 input-pro p-3"
                />
              </label>

              <label>
                <span className="text-xs text-slate-400">Prezzo</span>
                <NumericInput
                  min="0"
                  value={item.prezzo}
                  inputMode="decimal"
                  onChange={(event) =>
                    aggiornaLavorazione(index, "prezzo", event)
                  }
                  className="mt-1 input-pro p-3"
                />
              </label>

              <label>
                <span className="text-xs text-slate-400">Unità</span>
                <input
                  value={item.unita || "cad"}
                  onChange={(event) =>
                    aggiornaLavorazione(index, "unita", event.target.value)
                  }
                  className="mt-1 input-pro p-3"
                />
              </label>
            </div>
          </div>
        ))}
      </section>

      <section className="pro-panel p-5 mb-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <label>
            <span className="text-sm text-slate-400">Sconto %</span>
            <NumericInput
              min="0"
              value={sconto}
              inputMode="decimal"
              onChange={setSconto}
              className="mt-2 input-pro"
            />
          </label>

          <label>
            <span className="text-sm text-slate-400">IVA %</span>
            <NumericInput
              min="0"
              value={iva}
              inputMode="decimal"
              onChange={setIva}
              className="mt-2 input-pro"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-3">
          <label>
            <span className="text-sm text-slate-400">Validità giorni</span>
            <NumericInput
              min="0"
              value={validita}
              inputMode="numeric"
              onChange={setValidita}
              className="mt-2 input-pro"
            />
          </label>

          <label>
            <span className="text-sm text-slate-400">Pagamento</span>
            <input
              value={pagamento}
              onChange={(event) => setPagamento(event.target.value)}
              className="mt-2 input-pro"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label>
            <span className="text-sm text-slate-400">Acconto</span>
            <NumericInput
              min="0"
              value={acconto}
              inputMode="decimal"
              onChange={setAcconto}
              className="mt-2 input-pro"
            />
          </label>

          <div className="rounded-[14px] border border-white/10 bg-black/[0.18] p-4">
            <span className="text-sm text-slate-400">Saldo previsto</span>
            <p className="text-2xl font-black mt-1">{formatEuro(saldo)}</p>
          </div>
        </div>

        <label className="block">
          <span className="text-sm text-slate-400">Note</span>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows="4"
            className="mt-2 input-pro resize-none"
          />
        </label>
      </section>

      <section className="pro-panel-strong p-6 mb-5">
        <p className="text-lg text-slate-300">Totale IVA incl.</p>
        <h2 className="text-5xl font-black mt-2">
          {formatEuro(totali.totale)}
        </h2>
        <div className="grid grid-cols-2 gap-2 text-sm mt-4 text-slate-400">
          <p>Imponibile {formatEuro(totali.imponibile)}</p>
          <p>Saldo {formatEuro(saldo)}</p>
        </div>
      </section>

      <QualityCheckCard
        report={qualityReport}
        controlliTotali={qualityControlliTotali}
        onApriLavorazione={() => {
          // QC-002: deep-link predisposto, navigazione in sprint successivi
        }}
      />

      <section className="pro-panel p-5 mb-5 space-y-4">
        <div className="flex items-center gap-3">
          <Wallet size={22} className="text-emerald-300" />
          <h2 className="text-xl font-black">Incasso</h2>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-[14px] border border-white/10 bg-black/[0.18] p-4">
            <p className="text-sm text-slate-400">Totale</p>
            <p className="text-2xl font-black mt-1">{formatEuro(totali.totale)}</p>
          </div>
          <div className="rounded-[14px] border border-white/10 bg-black/[0.18] p-4">
            <p className="text-sm text-slate-400">Incassato</p>
            <p className="text-2xl font-black mt-1">{formatEuro(incassato)}</p>
          </div>
          <div className="rounded-[14px] border border-white/10 bg-black/[0.18] p-4">
            <p className="text-sm text-slate-400">Da incassare</p>
            <p className="text-2xl font-black mt-1">{formatEuro(daIncassare)}</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
          <NumericInput
            min="0"
            value={nuovoIncasso}
            inputMode="decimal"
            onChange={setNuovoIncasso}
            placeholder="Nuovo incasso"
            className="input-pro"
          />
          <button onClick={registraNuovoIncasso} className="btn-primary px-5 py-4">
            Nuovo incasso
          </button>
          <button onClick={segnaSaldato} className="btn-secondary px-5 py-4">
            Segna saldato
          </button>
        </div>

        <textarea
          value={noteIncasso}
          onChange={(event) => setNoteIncasso(event.target.value)}
          rows="2"
          placeholder="Note incasso"
          className="input-pro resize-none"
        />
      </section>

      <div className="grid grid-cols-1 gap-3">
        <button
          onClick={salvaModifiche}
          className="w-full btn-primary p-5 text-lg flex items-center justify-center gap-2"
        >
          <Save size={20} />
          Salva modifiche
        </button>

        <button
          onClick={anteprimaPDF}
          disabled={pdfInElaborazione}
          className="w-full btn-secondary p-5 text-lg flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Eye size={20} />
          Anteprima PDF
        </button>

        <button
          onClick={generaPDF}
          disabled={pdfInElaborazione}
          className="w-full btn-secondary p-5 text-lg flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Download size={20} />
          {pdfInElaborazione ? "Generazione PDF…" : "Genera PDF"}
        </button>

        <button
          onClick={duplicaPreventivo}
          className="w-full btn-secondary p-5 text-lg flex items-center justify-center gap-2"
        >
          <Copy size={20} />
          Duplica preventivo
        </button>

        {!confermaEliminaPreventivo ? (
          <button
            type="button"
            onClick={eliminaPreventivo}
            className="w-full rounded-[14px] border border-red-400/25 bg-red-500/10 p-5 text-lg font-black text-red-100 flex items-center justify-center gap-2"
          >
            <Trash2 size={20} />
            Elimina preventivo
          </button>
        ) : (
          <div className="grid gap-2 ux-sheet">
            <p className="text-sm text-red-100/90 text-center">
              Eliminare definitivamente questo preventivo?
            </p>
            <button
              type="button"
              onClick={eliminaPreventivo}
              className="w-full rounded-[14px] border border-red-400/40 bg-red-500/20 p-4 text-base font-black text-red-100"
            >
              Conferma elimina
            </button>
            <button
              type="button"
              onClick={() => setConfermaEliminaPreventivo(false)}
              className="w-full btn-secondary p-4 font-bold"
            >
              Annulla
            </button>
          </div>
        )}
      </div>

      <PdfAnteprima
        aperto={pdfAnteprimaAperta}
        blobUrl={pdfAnteprimaUrl}
        titolo={preventivo.numero || `PREV-${preventivo.id}`}
        nomeFile={`${preventivo.numero || `PREV-${preventivo.id}`}.pdf`}
        inElaborazione={pdfInElaborazione}
        onChiudi={chiudiAnteprimaPdf}
        onRigenera={() =>
          generaDocumentoPdf({ salva: false, apriAnteprima: true })
        }
      />
    </div>
  );
}
