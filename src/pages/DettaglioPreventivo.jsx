import { useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Copy,
  Download,
  Eye,
  Save,
  Trash2
} from "lucide-react";
import PageBackLink from "../components/PageBackLink";
import {
  ROUTES,
  routeCantiere,
  routeCantierePagamenti,
  routePreventivo,
  statoNavigazioneCantiere,
  CANTIERE_SEZIONI
} from "../app/routes";
import {
  marcaPostConversioneCantiere
} from "../features/cantieri/postConversioneUi";
import { leggiDatiAzienda } from "../repositories/impostazioniRepository";
import {
  leggiPreventiviTutti,
  salvaNuovoPreventivo,
  salvaPreventivi,
  trovaPreventivo
} from "../repositories/preventiviRepository";
import {
  isRecordCestinato,
  ripristina,
  spostaNelCestino,
  TIPI_CESTINO
} from "../domain/cestino";
import {
  aggiornaCampoLavorazione,
  duplicaPreventivo as duplicaDatiPreventivo,
  preparaDatiPreventivo
} from "../features/preventivi/preventiviDomain";
import {
  calcolaDaIncassare,
  normalizzaPreventivoIncasso,
  registraIncasso,
  segnaPreventivoSaldato
} from "../features/preventivi/incassiDomain";
import {
  EVENTI_WORKFLOW,
  STATI_PREVENTIVO,
  accettaPreventivo,
  annullaPreventivo,
  convertiInCantiere,
  inviaPreventivo,
  normalizzaStatoPreventivo,
  ottieniAzioniDisponibili,
  ottieniTimeline,
  trovaCantiereCollegato
} from "../domain/workflow";
import {
  collegaDistintaAPreventivoSenzaDuplicati,
  elencaDistintePerCollegamentoPreventivo,
  scollegaDistintaDalPreventivo,
  trovaDistintaCollegataAlPreventivo,
  usaDistintaDopoConversioneCantiere
} from "../domain/distinteMateriali/distintaPreventivoService";
import CollegaDistintaSheet from "../features/distinteMateriali/components/CollegaDistintaSheet";
import PreventivoDistintaSection from "../features/distinteMateriali/components/PreventivoDistintaSection";
import UsaDistintaConversioneSheet from "../features/distinteMateriali/components/UsaDistintaConversioneSheet";
import { generaPdfPreventivo } from "../services/preventiviPdfService";
import {
  calcolaTotali,
  calcolaSaldo,
  formatEuro,
  normalizzaNumero
} from "../utils/preventivi";
import NumericInput from "../components/NumericInput";
import PdfAnteprima from "../components/PdfAnteprima";
import QualityCheckCard from "../components/QualityCheckCard";
import FirmaClienteSection from "../features/preventivi/components/FirmaClienteSection";
import CondivisioneSection from "../features/preventivi/components/CondivisioneSection";
import PreventivoDettaglioHeader from "../features/preventivi/components/PreventivoDettaglioHeader";
import PreventivoHeroCta from "../features/preventivi/components/PreventivoHeroCta";
import PreventivoSezioneCollapsible from "../features/preventivi/components/PreventivoSezioneCollapsible";
import PreventivoWorkflowAzioni from "../features/preventivi/components/PreventivoWorkflowAzioni";
import BannerPostAccettazione from "../features/preventivi/components/BannerPostAccettazione";
import {
  HERO_CTA,
  etichettaEventoWorkflowUi,
  filtraAzioniSecondarie,
  isPagamentiSuCantiere,
  risolviHeroCta
} from "../features/preventivi/utils/preventivoHeroCta";
import { messaggioErroreWorkflow } from "../features/preventivi/utils/messaggioErroreWorkflow";
import { salvaFirma, ottieniFirma } from "../domain/firma";
import { risolviDocumentoDaCondividere } from "../domain/condivisione";
import { arricchisciPreventivoLegacy } from "../domain/catalogo";
import {
  contaRegoleAttive,
  generateQualityChecks
} from "../domain/qualityCheck";

export default function DettaglioPreventivo() {
  const { id } = useParams();
  const navigate = useNavigate();

  const preventivoGrezzo = trovaPreventivo(id, { includiCestinati: true });
  const preventivo = preventivoGrezzo
    ? arricchisciPreventivoLegacy(preventivoGrezzo)
    : null;
  const nelCestino = isRecordCestinato(preventivoGrezzo);
  const datiAzienda = leggiDatiAzienda();
  const [cestinoTick, setCestinoTick] = useState(0);
  void cestinoTick;

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
  const [bannerPostAccetta, setBannerPostAccetta] = useState(false);
  const [confermaRifiuto, setConfermaRifiuto] = useState(false);
  const [confermaEliminaPreventivo, setConfermaEliminaPreventivo] =
    useState(false);
  const [timelineTick, setTimelineTick] = useState(0);
  const [pdfAnteprimaUrl, setPdfAnteprimaUrl] = useState("");
  const [pdfAnteprimaAperta, setPdfAnteprimaAperta] = useState(false);
  const [pdfInElaborazione, setPdfInElaborazione] = useState(false);
  const [distintaTick, setDistintaTick] = useState(0);
  const [showCollegaDistinta, setShowCollegaDistinta] = useState(false);
  const [ricercaDistinta, setRicercaDistinta] = useState("");
  const [showUsaDistinta, setShowUsaDistinta] = useState(false);

  const sezioneLavorazioniRef = useRef(null);
  const sezioneDocumentiRef = useRef(null);

  const totali = calcolaTotali(lavorazioni, sconto, iva);
  const saldo = calcolaSaldo(totali.totale, acconto);
  const qualityReport = generateQualityChecks({
    ...(preventivo || {}),
    cliente,
    lavorazioni });
  const qualityControlliTotali = contaRegoleAttive();
  const preventivoIncasso = normalizzaPreventivoIncasso({
    ...preventivo,
    totale: totali.totale,
    incassato,
    noteIncasso });
  const daIncassare = calcolaDaIncassare(preventivoIncasso);
  const preventivoCorrente = {
    ...preventivo,
    stato,
    cantiereId: cantiereId || preventivo?.cantiereId };
  const cantiereCollegato = trovaCantiereCollegato(preventivoCorrente);
  const cantiereCollegatoId =
    cantiereId || preventivo?.cantiereId || cantiereCollegato?.id;
  const azioniDisponibili = ottieniAzioniDisponibili(preventivoCorrente);
  const heroCta = risolviHeroCta({
    stato,
    azioniDisponibili,
    cantiereCollegatoId });
  const azioniSecondarie = filtraAzioniSecondarie(
    azioniDisponibili,
    heroCta?.id
  );
  const timeline = ottieniTimeline(preventivo?.id);
  // timelineTick forza refresh dopo mutazioni workflow
  const timelineKey = `tl-${timelineTick}-${timeline.length}`;

  const distintaCollegata = useMemo(() => {
    void distintaTick;
    if (!preventivo?.id) return null;
    return trovaDistintaCollegataAlPreventivo(preventivo.id);
  }, [preventivo?.id, distintaTick]);

  const distintePicker = useMemo(() => {
    void distintaTick;
    if (!preventivo?.id) return [];
    return elencaDistintePerCollegamentoPreventivo(ricercaDistinta, {
      preventivoId: preventivo.id });
  }, [preventivo?.id, ricercaDistinta, distintaTick]);

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
        noteIncasso },
      cliente,
      stato: stato || "Bozza",
      lavorazioni,
      sconto: normalizzaNumero(sconto),
      iva: normalizzaNumero(iva),
      validita: normalizzaNumero(validita, 30),
      pagamento: pagamento.trim(),
      acconto: normalizzaNumero(acconto),
      note });
  }

  function persistiPreventivoCorrente(prossimo) {
    salvaPreventivi(
      leggiPreventiviTutti().map((item) =>
        String(item.id) === String(id) ? prossimo : item
      )
    );
  }

  function aggiornaIncassoPreventivo(prossimoPreventivo) {
    setIncassato(prossimoPreventivo.incassato);
    setNoteIncasso(prossimoPreventivo.noteIncasso || "");
    persistiPreventivoCorrente(
      preparaDatiPreventivo({
        preventivo: prossimoPreventivo,
        cliente,
        stato: stato || "Bozza",
        lavorazioni,
        sconto: normalizzaNumero(sconto),
        iva: normalizzaNumero(iva),
        validita: normalizzaNumero(validita, 30),
        pagamento: pagamento.trim(),
        acconto: normalizzaNumero(acconto),
        note })
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
          noteIncasso },
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
        noteIncasso })
    );
    setMessaggio("Preventivo segnato come saldato.");
  }

  function salvaModifiche() {
    persistiPreventivoCorrente(datiAggiornati());
    setMessaggio("Preventivo aggiornato sul dispositivo.");
  }

  function duplicaPreventivo() {
    const nuovoPreventivo = duplicaDatiPreventivo({
      archivio: leggiPreventiviTutti(),
      datiPreventivo: datiAggiornati(),
      cliente });

    salvaNuovoPreventivo(nuovoPreventivo);
    navigate(routePreventivo(nuovoPreventivo.id));
  }

  function eliminaPreventivo() {
    if (!confermaEliminaPreventivo) {
      setConfermaEliminaPreventivo(true);
      return;
    }
    spostaNelCestino(TIPI_CESTINO.preventivo, preventivo.id);
    navigate(ROUTES.preventivi);
  }

  function eseguiAnnulla() {
    if (!confermaRifiuto) {
      setConfermaRifiuto(true);
      return;
    }
    const risultato = annullaPreventivo(preventivo.id);
    if (!risultato.success) {
      setMessaggio(
        messaggioErroreWorkflow(
          risultato.error,
          "Non è stato possibile rifiutare il preventivo."
        )
      );
      setConfermaRifiuto(false);
      return;
    }
    setConfermaRifiuto(false);
    sincronizzaDaWorkflow(risultato.preventivo, "Preventivo rifiutato.");
  }

  async function generaDocumentoPdf({
    salva = true,
    apriAnteprima = false,
    firmato = undefined } = {}) {
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
        firmato });

      const firmaEsistente = ottieniFirma(dati.id);
      if (firmaEsistente && risultato?.nomeFile?.includes("_firmato")) {
        salvaFirma(firmaEsistente, {
          preventivo: dati,
          registraFirmato: true });
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
      setBannerPostAccetta(false);
      setMessaggio(
        messaggioErroreWorkflow(
          risultato.error,
          "Non è stato possibile accettare il preventivo."
        )
      );
      return;
    }
    setBannerPostAccetta(true);
    sincronizzaDaWorkflow(risultato.preventivo, "");
  }

  function eseguiInvia() {
    salvaModificheSilenzioso();
    const risultato = inviaPreventivo(preventivo.id);
    if (!risultato.success) {
      setMessaggio(
        messaggioErroreWorkflow(
          risultato.error,
          "Non è stato possibile segnare il preventivo come inviato."
        )
      );
      return;
    }
    sincronizzaDaWorkflow(risultato.preventivo, "Preventivo segnato come inviato.");
  }

  function salvaModificheSilenzioso() {
    persistiPreventivoCorrente(datiAggiornati());
  }

  function trasformaInCantiere() {
    try {
      salvaModificheSilenzioso();
      const distinta = trovaDistintaCollegataAlPreventivo(preventivo.id);
      if (distinta) {
        setShowUsaDistinta(true);
        return;
      }
      eseguiConversioneCantiere({ usaDistinta: false });
    } catch (errore) {
      setMessaggio(
        messaggioErroreWorkflow(
          errore?.message,
          "Non è stato possibile creare il cantiere."
        )
      );
    }
  }

  function eseguiConversioneCantiere({ usaDistinta }) {
    try {
      salvaModificheSilenzioso();
      const risultato = convertiInCantiere(preventivo.id);
      if (!risultato.success) {
        setMessaggio(
          messaggioErroreWorkflow(
            risultato.error,
            "Non è stato possibile creare il cantiere."
          )
        );
        setShowUsaDistinta(false);
        return;
      }

      if (usaDistinta && risultato.cantiere?.id) {
        const sync = usaDistintaDopoConversioneCantiere(
          preventivo.id,
          risultato.cantiere.id
        );
        if (sync.ok && sync.applicata) {
          setDistintaTick((n) => n + 1);
        }
      }

      setBannerPostAccetta(false);
      setCantiereId(risultato.cantiere.id);
      setStato(risultato.preventivo.stato || STATI_PREVENTIVO.CONVERTITO);
      setTimelineTick((n) => n + 1);
      setShowUsaDistinta(false);
      const incassatoPre = Number(incassato) || 0;
      marcaPostConversioneCantiere(risultato.cantiere.id, {
        incassatoPreventivo: incassatoPre });
      navigate(routeCantierePagamenti(risultato.cantiere.id), {
        state: statoNavigazioneCantiere(CANTIERE_SEZIONI.PAGAMENTI) });
    } catch (errore) {
      setShowUsaDistinta(false);
      setMessaggio(
        messaggioErroreWorkflow(
          errore?.message,
          "Non è stato possibile creare il cantiere."
        )
      );
    }
  }

  function gestisciCollegaDistinta(distintaId) {
    const risultato = collegaDistintaAPreventivoSenzaDuplicati(
      distintaId,
      preventivo.id
    );
    if (!risultato.ok) {
      setMessaggio("Impossibile collegare la distinta.");
      return;
    }
    setDistintaTick((n) => n + 1);
    setShowCollegaDistinta(false);
    setRicercaDistinta("");
    setMessaggio("Distinta collegata al preventivo.");
  }

  function gestisciScollegaDistinta() {
    if (!distintaCollegata?.id) return;
    const risultato = scollegaDistintaDalPreventivo(distintaCollegata.id);
    if (!risultato.ok) {
      setMessaggio("Impossibile scollegare la distinta.");
      return;
    }
    setDistintaTick((n) => n + 1);
    setMessaggio("Distinta scollegata.");
  }

  function apriCantiereCollegato() {
    navigate(routeCantiere(cantiereCollegatoId));
  }

  function scorriElemento(elemento) {
    if (elemento && typeof elemento.scrollIntoView === "function") {
      elemento.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function apriSezione(ref) {
    if (!ref?.current) return;
    ref.current.open = true;
    scorriElemento(ref.current);
  }

  function apriCondivisionePreventivo() {
    apriSezione(sezioneDocumentiRef);
    window.requestAnimationFrame(() => {
      scorriElemento(
        document.querySelector('[data-testid="preventivo-condivisione-section"]')
      );
    });
  }

  function gestisciHeroCta(heroId) {
    switch (heroId) {
      case HERO_CTA.MODIFICA:
        apriSezione(sezioneLavorazioniRef);
        break;
      case HERO_CTA.INVIA_DI_NUOVO:
        apriCondivisionePreventivo();
        break;
      case HERO_CTA.ACCETTA:
        eseguiAccetta();
        break;
      case HERO_CTA.CONVERTI_CANTIERE:
        trasformaInCantiere();
        break;
      case HERO_CTA.APRI_CANTIERE:
        apriCantiereCollegato();
        break;
      case HERO_CTA.SEGNA_INVIATO:
        eseguiInvia();
        break;
      case HERO_CTA.CONDIVIDI:
        apriCondivisionePreventivo();
        break;
      default:
        break;
    }
  }

  if (!preventivo) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Preventivo non trovato
      </div>
    );
  }

  if (nelCestino) {
    return (
      <div className="pro-page text-white">
        <PageBackLink testId="dettaglio-preventivo-back" />
        <div className="pro-panel p-5 space-y-4" data-testid="preventivo-nel-cestino">
          <p className="section-label">Cestino</p>
          <h1 className="ds-page-title">
            {preventivo.numero || `Preventivo ${preventivo.id}`}
          </h1>
          <p className="ds-text-secondary">
            Questo preventivo è nel Cestino. Ripristinalo per modificarlo o
            continuare il workflow.
          </p>
          <p className="ds-text-primary">{preventivo.cliente || "Cliente"}</p>
          <div className="grid gap-3">
            <button
              type="button"
              className="btn-primary min-h-[48px]"
              data-testid="preventivo-ripristina-cestino"
              onClick={() => {
                ripristina(TIPI_CESTINO.preventivo, preventivo.id);
                setCestinoTick((n) => n + 1);
              }}
            >
              Ripristina
            </button>
            <button
              type="button"
              className="btn-secondary min-h-[48px]"
              onClick={() => navigate(ROUTES.preventivi)}
            >
              Torna indietro
            </button>
            <Link
              to={ROUTES.cestino}
              className="btn-secondary min-h-[48px] flex items-center justify-center"
            >
              Apri Cestino
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pro-page text-white">
      <PageBackLink testId="dettaglio-preventivo-back" />

      <PreventivoDettaglioHeader
        preventivo={preventivo}
        cliente={cliente}
        clienteId={preventivo?.clienteId}
        lavorazioni={lavorazioni}
        stato={stato}
        totale={totali.totale}
      />

      {bannerPostAccetta && stato === STATI_PREVENTIVO.ACCETTATO ? (
        <BannerPostAccettazione onIniziaCantiere={trasformaInCantiere} />
      ) : (
        <PreventivoHeroCta hero={heroCta} onAzione={gestisciHeroCta} />
      )}

      <PreventivoWorkflowAzioni
        azioni={azioniSecondarie}
        stato={stato}
        confermaRifiuto={confermaRifiuto}
        mostraModifica={false}
        mostraInviaDiNuovo={
          stato === STATI_PREVENTIVO.INVIATO &&
          heroCta?.id === HERO_CTA.ACCETTA
        }
        onModifica={() => gestisciHeroCta(HERO_CTA.MODIFICA)}
        onInviaDiNuovo={() => gestisciHeroCta(HERO_CTA.INVIA_DI_NUOVO)}
        onInvia={eseguiInvia}
        onAccetta={eseguiAccetta}
        onRifiuta={eseguiAnnulla}
        onAnnullaRifiuto={() => setConfermaRifiuto(false)}
      />

      {messaggio ? (
        <div className="pro-panel p-4 mb-4 text-yellow-100 border-yellow-300/30">
          {messaggio}
        </div>
      ) : null}

      <PreventivoSezioneCollapsible
        id="lavorazioni"
        titolo="Lavorazioni"
        sottotitolo={`${lavorazioni.length} ${lavorazioni.length === 1 ? "voce" : "voci"}`}
        defaultOpen={stato === STATI_PREVENTIVO.BOZZA}
        sectionRef={sezioneLavorazioniRef}
      >
        <div className="space-y-4">
          {lavorazioni.map((item, index) => (
            <div
              key={`${item.nome}-${index}`}
              className="rounded-[16px] border border-white/10 bg-black/[0.18] p-4"
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <input
                  value={item.nome}
                  onChange={(event) =>
                    aggiornaLavorazione(index, "nome", event.target.value)
                  }
                  className="w-full bg-transparent ds-card-title outline-none"
                />
                <button
                  type="button"
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
        </div>
        <QualityCheckCard
          report={qualityReport}
          controlliTotali={qualityControlliTotali}
          onApriLavorazione={() => {}}
        />
      </PreventivoSezioneCollapsible>

      <PreventivoSezioneCollapsible
        id="materiali"
        titolo="Lista materiali"
        sottotitolo="Materiali collegati"
      >
        <PreventivoDistintaSection
          distinta={distintaCollegata}
          embedded
          onCollega={() => {
            setRicercaDistinta("");
            setShowCollegaDistinta(true);
          }}
          onScollega={gestisciScollegaDistinta}
        />
      </PreventivoSezioneCollapsible>

      <PreventivoSezioneCollapsible
        id="economico"
        titolo="Prezzo e pagamenti"
        sottotitolo={`Totale ${formatEuro(totali.totale)}`}
      >
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
            onChange={(event) => {
              const prossimo = event.target.value;
              if (
                prossimo === STATI_PREVENTIVO.CONVERTITO ||
                prossimo === STATI_PREVENTIVO.LAVORO_COMPLETATO
              ) {
                if (!cantiereCollegatoId) {
                  window.alert(
                    "Non puoi impostare questo stato senza un cantiere collegato.\nUsa «Inizia cantiere» dal percorso normale."
                  );
                  return;
                }
                const messaggioConferma =
                  "Correzione manuale dello stato.\nQuesta azione non crea né chiude automaticamente il cantiere.";
                if (!window.confirm(messaggioConferma)) {
                  return;
                }
              }
              setStato(prossimo);
            }}
            className="mt-2 input-pro"
            data-testid="preventivo-stato-select"
          >
            <option value={STATI_PREVENTIVO.BOZZA}>Bozza</option>
            <option value={STATI_PREVENTIVO.INVIATO}>Inviato</option>
            <option value={STATI_PREVENTIVO.ACCETTATO}>Accettato</option>
            {cantiereCollegatoId ||
            stato === STATI_PREVENTIVO.CONVERTITO ? (
              <option value={STATI_PREVENTIVO.CONVERTITO}>In cantiere</option>
            ) : null}
            {cantiereCollegatoId ||
            stato === STATI_PREVENTIVO.LAVORO_COMPLETATO ? (
              <option value={STATI_PREVENTIVO.LAVORO_COMPLETATO}>
                Lavoro finito
              </option>
            ) : null}
            <option value={STATI_PREVENTIVO.RIFIUTATO}>Non accettato</option>
          </select>
          {!cantiereCollegatoId &&
          (stato === STATI_PREVENTIVO.CONVERTITO ||
            stato === STATI_PREVENTIVO.LAVORO_COMPLETATO) ? (
            <p
              className="ds-text-secondary text-sm mt-2"
              data-testid="preventivo-stato-orfano-hint"
            >
              Stato senza cantiere collegato. Correggi lo stato (es. Accettato)
              oppure usa il percorso «Inizia cantiere» quando disponibile.
            </p>
          ) : null}
        </label>

        <div className="rounded-[14px] border border-white/10 bg-black/[0.18] p-4 space-y-4">
          <h3 className="ds-section-title">Prezzo</h3>

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
              <span className="text-sm text-slate-400">Modalità di pagamento</span>
              <input
                value={pagamento}
                onChange={(event) => setPagamento(event.target.value)}
                className="mt-2 input-pro"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label>
              <span className="text-sm text-slate-400">Acconto concordato</span>
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
              <p className="text-2xl font-bold mt-1" data-testid="preventivo-saldo">
                {formatEuro(saldo)}
              </p>
            </div>
          </div>

          <div>
            <p className="text-sm text-slate-400">Imponibile</p>
            <p className="ds-text-primary mt-1">{formatEuro(totali.imponibile)}</p>
            <p className="text-sm text-slate-400 mt-3">Totale IVA incl.</p>
            <p className="text-xl font-bold mt-1" data-testid="preventivo-totale-economico">
              {formatEuro(totali.totale)}
            </p>
          </div>
        </div>

        <div className="rounded-[14px] border border-yellow-300/20 bg-yellow-400/5 p-4 space-y-4">
          <h3 className="ds-section-title">Pagamenti</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[14px] border border-white/10 bg-black/[0.18] p-4">
              <p className="text-sm text-slate-400">Già incassato</p>
              <p className="text-xl font-bold mt-1" data-testid="preventivo-incassato">
                {formatEuro(incassato)}
              </p>
            </div>
            <div className="rounded-[14px] border border-white/10 bg-black/[0.18] p-4">
              <p className="text-sm text-slate-400">Resta da incassare</p>
              <p className="text-xl font-bold mt-1" data-testid="preventivo-da-incassare">
                {formatEuro(daIncassare)}
              </p>
            </div>
          </div>
          {isPagamentiSuCantiere(
            { stato, cantiereId: cantiereCollegatoId },
            cantiereCollegatoId
          ) ? (
            <div className="space-y-3" data-testid="preventivo-pagamenti-readonly">
              <p className="ds-text-secondary text-sm">
                Questo preventivo è ora in cantiere.
                <br />
                I nuovi pagamenti si registrano nel cantiere.
              </p>
              {Number(incassato) > 0 ? (
                <p
                  className="ds-text-secondary text-sm"
                  data-testid="preventivo-incassato-pre-cantiere"
                >
                  Nel preventivo risultano già registrati {formatEuro(incassato)}{" "}
                  prima del passaggio in cantiere.
                </p>
              ) : null}
              {noteIncasso ? (
                <p className="ds-text-secondary text-sm">
                  Note: {noteIncasso}
                </p>
              ) : null}
              {cantiereCollegatoId ? (
                <Link
                  to={routeCantierePagamenti(cantiereCollegatoId)}
                  className="btn-primary inline-flex items-center justify-center min-h-[48px] px-5"
                  data-testid="preventivo-apri-pagamenti-cantiere"
                >
                  Apri pagamenti cantiere
                </Link>
              ) : (
                <p className="ds-text-secondary text-sm">
                  Nessun cantiere collegato. Correggi lo stato oppure usa «Inizia
                  cantiere» quando il preventivo è Accettato.
                </p>
              )}
            </div>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
                <NumericInput
                  min="0"
                  value={nuovoIncasso}
                  inputMode="decimal"
                  onChange={setNuovoIncasso}
                  placeholder="Importo ricevuto"
                  className="input-pro"
                />
                <button
                  type="button"
                  onClick={registraNuovoIncasso}
                  className="btn-secondary px-5 py-4 min-h-[44px]"
                >
                  Registra pagamento
                </button>
                <button
                  type="button"
                  onClick={segnaSaldato}
                  className="btn-secondary px-5 py-4 min-h-[44px]"
                >
                  Segna saldato
                </button>
              </div>
              <textarea
                value={noteIncasso}
                onChange={(event) => setNoteIncasso(event.target.value)}
                rows="2"
                placeholder="Note pagamento"
                className="input-pro resize-none"
              />
            </>
          )}
        </div>
      </PreventivoSezioneCollapsible>

      <PreventivoSezioneCollapsible
        id="documenti"
        titolo="Documenti"
        sottotitolo="PDF, firma e condivisione"
        sectionRef={sezioneDocumentiRef}
      >
        <FirmaClienteSection
          embedded
          preventivo={{ ...datiAggiornati(), stato }}
          onMessaggio={setMessaggio}
          pdfInElaborazione={pdfInElaborazione}
          onRigeneraPdf={({ firmato } = {}) =>
            generaDocumentoPdf({ salva: true, apriAnteprima: false, firmato })
          }
        />

        <CondivisioneSection
          embedded
          preventivo={{ ...datiAggiornati(), stato }}
          onMessaggio={setMessaggio}
          inElaborazione={pdfInElaborazione}
          onVisualizzaPdf={() =>
            generaDocumentoPdf({
              salva: false,
              apriAnteprima: true,
              firmato: risolviDocumentoDaCondividere(
                preventivo.id,
                datiAggiornati()
              ).firmato })
          }
          preparaDocumento={async ({ firmato } = {}) => {
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
                  firmato: docInfo.firmato };
              } catch {
                // ricade su generazione esplicita
              }
            }
            const risultato = await generaDocumentoPdf({
              salva: false,
              apriAnteprima: false,
              firmato });
            if (!risultato?.blob) return null;
            return {
              blob: risultato.blob,
              nomeFile: risultato.nomeFile,
              firmato: Boolean(firmato) };
          }}
        />

        <div className="grid grid-cols-1 gap-3">
          <button
            type="button"
            onClick={anteprimaPDF}
            disabled={pdfInElaborazione}
            className="w-full btn-secondary p-4 min-h-[44px] flex items-center justify-center gap-2 disabled:opacity-50"
            data-testid="preventivo-anteprima-pdf"
          >
            <Eye size={20} />
            Anteprima PDF
          </button>
          <button
            type="button"
            onClick={generaPDF}
            disabled={pdfInElaborazione}
            className="w-full btn-secondary p-4 min-h-[44px] flex items-center justify-center gap-2 disabled:opacity-50"
            data-testid="preventivo-genera-pdf"
          >
            <Download size={20} />
            {pdfInElaborazione ? "Generazione PDF…" : "Genera PDF"}
          </button>
        </div>
      </PreventivoSezioneCollapsible>

      <PreventivoSezioneCollapsible id="note" titolo="Note" sottotitolo="Note al cliente">
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows="4"
          className="input-pro resize-none w-full"
          data-testid="preventivo-note"
        />
      </PreventivoSezioneCollapsible>

      {timeline.length > 0 ? (
        <PreventivoSezioneCollapsible
          id="cronologia"
          titolo="Cronologia"
          sottotitolo={`${timeline.length} eventi`}
        >
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
                  EVENTI_WORKFLOW.PREVENTIVO_RIFIUTATO,
                  EVENTI_WORKFLOW.LAVORO_COMPLETATO,
                ].includes(e.tipo)
              )
              .map((evento) => (
                <li
                  key={evento.id}
                  className="text-sm text-slate-300 flex items-start gap-2"
                >
                  <span className="text-yellow-200/80 shrink-0">•</span>
                  <span>
                    {etichettaEventoWorkflowUi(evento.tipo, evento.label)}
                  </span>
                </li>
              ))}
          </ol>
        </PreventivoSezioneCollapsible>
      ) : null}

      <div className="grid grid-cols-1 gap-3 mt-2 pb-4">
        <button
          type="button"
          onClick={salvaModifiche}
          className="w-full btn-secondary p-4 min-h-[44px] flex items-center justify-center gap-2"
          data-testid="preventivo-salva"
        >
          <Save size={20} />
          Salva
        </button>

        <button
          type="button"
          onClick={duplicaPreventivo}
          className="w-full btn-secondary p-4 min-h-[44px] flex items-center justify-center gap-2"
          data-testid="preventivo-duplica"
        >
          <Copy size={20} />
          Duplica
        </button>

        {!confermaEliminaPreventivo ? (
          <button
            type="button"
            onClick={eliminaPreventivo}
            className="w-full btn-danger p-4 min-h-[44px] flex items-center justify-center gap-2"
            data-testid="preventivo-elimina"
          >
            <Trash2 size={20} />
            Elimina
          </button>
        ) : (
          <div className="grid gap-2 ux-sheet">
            <p className="text-sm text-red-100/90 text-center">
              Vuoi spostare questo elemento nel Cestino?
            </p>
            <p className="text-xs text-slate-400 text-center">
              L&apos;elemento verrà spostato nel Cestino e potrai ripristinarlo
              in seguito.
            </p>
            <button
              type="button"
              onClick={eliminaPreventivo}
              className="w-full btn-danger p-4 font-bold min-h-[44px]"
            >
              Sposta nel Cestino
            </button>
            <button
              type="button"
              onClick={() => setConfermaEliminaPreventivo(false)}
              className="w-full btn-secondary p-4 font-bold min-h-[44px]"
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

      <CollegaDistintaSheet
        open={showCollegaDistinta}
        onClose={() => {
          setShowCollegaDistinta(false);
          setRicercaDistinta("");
        }}
        distinte={distintePicker}
        distintaSelezionataId={distintaCollegata?.id}
        ricerca={ricercaDistinta}
        onRicerca={setRicercaDistinta}
        onConferma={gestisciCollegaDistinta}
      />

      <UsaDistintaConversioneSheet
        open={showUsaDistinta}
        onClose={() => setShowUsaDistinta(false)}
        distinta={distintaCollegata}
        onUsaDistinta={() => eseguiConversioneCantiere({ usaDistinta: true })}
        onContinuaSenza={() =>
          eseguiConversioneCantiere({ usaDistinta: false })
        }
      />
    </div>
  );
}
