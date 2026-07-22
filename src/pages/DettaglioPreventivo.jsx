import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Copy, Download, HardHat, Save, Trash2, Wallet } from "lucide-react";
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
import {
  convertiPreventivoInCantiere,
  trovaCantiereCollegato,
} from "../features/cantieri/services/preventivoCantiereService";
import { generaPdfPreventivo } from "../services/preventiviPdfService";
import {
  calcolaTotali,
  calcolaSaldo,
  formatEuro,
  normalizzaNumero,
} from "../utils/preventivi";
import NumericInput from "../components/NumericInput";

export default function DettaglioPreventivo() {
  const { id } = useParams();
  const navigate = useNavigate();

  const archivio = leggiPreventivi();
  const indicePreventivo = archivio.findIndex(
    (p) => String(p.id) === String(id)
  );
  const preventivo = archivio[indicePreventivo];
  const datiAzienda = leggiDatiAzienda();

  const [cliente, setCliente] = useState(preventivo?.cliente || "");
  const [stato, setStato] = useState(preventivo?.stato || "Bozza");
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

  const totali = calcolaTotali(lavorazioni, sconto, iva);
  const saldo = calcolaSaldo(totali.totale, acconto);
  const preventivoIncasso = normalizzaPreventivoIncasso({
    ...preventivo,
    totale: totali.totale,
    incassato,
    noteIncasso,
  });
  const daIncassare = calcolaDaIncassare(preventivoIncasso);
  const cantiereCollegato = trovaCantiereCollegato({
    ...preventivo,
    cantiereId: cantiereId || preventivo?.cantiereId,
  });
  const cantiereCollegatoId =
    cantiereId ||
    preventivo?.cantiereId ||
    cantiereCollegato?.id;
  const preventivoCollegatoACantiere = Boolean(cantiereCollegatoId);

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
    const conferma = window.confirm(
      `Eliminare definitivamente il preventivo ${
        preventivo.numero || `PREV-${preventivo.id}`
      }?`
    );

    if (!conferma) return;

    eliminaPreventivoRepository(preventivo.id);
    navigate(ROUTES.archivio);
  }

  async function generaPDF() {
    try {
      await generaPdfPreventivo({
        preventivo,
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
      });
    } catch {
      setMessaggio("Non è stato possibile generare il PDF.");
    }
  }

  function trasformaInCantiere() {
    try {
      const risultato = convertiPreventivoInCantiere(datiAggiornati());
      setCantiereId(risultato.cantiere.id);
      setStato(risultato.preventivo.stato || "Accettato");
      setMessaggio(
        risultato.creato
          ? "Cantiere creato e collegato al preventivo."
          : "Apro il cantiere già collegato."
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
      <Link
        to={ROUTES.archivio}
        className="text-slate-400 flex items-center gap-2 mb-5"
      >
        <ArrowLeft size={18} />
        Archivio
      </Link>

      <div className="mb-6 pro-panel-strong p-5">

        <p className="section-label">
          {preventivo.numero || `PREV-${preventivo.id}`}
        </p>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight mt-1">
          Dettaglio preventivo
        </h1>
        <p className="text-slate-400 mt-2">
          Modifica lavorazioni, stato, condizioni e documento PDF.
        </p>
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
            <option>Bozza</option>
            <option>Inviato</option>
            <option>Accettato</option>
            <option>Completato</option>
          </select>
        </label>
      </section>

      <section className="pro-panel p-5 mb-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="section-label">Workflow operativo</p>
            <h2 className="text-xl font-black mt-1">🚧 Trasforma in Cantiere</h2>
            <p className="text-sm text-slate-400 mt-2">
              {preventivoCollegatoACantiere
                ? "Preventivo già collegato a un cantiere."
                : "Crea un cantiere con cliente, lavorazioni e note del preventivo."}
            </p>
          </div>

          {preventivoCollegatoACantiere ? (
            <button
              onClick={apriCantiereCollegato}
              className="btn-secondary px-5 py-4 flex items-center justify-center gap-2"
            >
              <HardHat size={19} />
              🏗 Apri Cantiere
            </button>
          ) : (
            <button
              onClick={trasformaInCantiere}
              className="btn-primary px-5 py-4 flex items-center justify-center gap-2"
            >
              <HardHat size={19} />
              CREA CANTIERE
            </button>
          )}
        </div>
      </section>

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
          onClick={generaPDF}
          className="w-full btn-secondary p-5 text-lg flex items-center justify-center gap-2"
        >
          <Download size={20} />
          Genera PDF
        </button>

        <button
          onClick={duplicaPreventivo}
          className="w-full btn-secondary p-5 text-lg flex items-center justify-center gap-2"
        >
          <Copy size={20} />
          Duplica preventivo
        </button>

        <button
          onClick={eliminaPreventivo}
          className="w-full rounded-[14px] border border-red-400/25 bg-red-500/10 p-5 text-lg font-black text-red-100 flex items-center justify-center gap-2"
        >
          <Trash2 size={20} />
          Elimina preventivo
        </button>
      </div>
    </div>
  );
}
