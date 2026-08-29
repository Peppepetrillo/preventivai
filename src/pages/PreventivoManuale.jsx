import { useMemo, useState } from "react";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ROUTES, routePreventivo } from "../app/routes";
import { leggiClienti } from "../repositories/clientiRepository";
import { leggiPreventivi, salvaNuovoPreventivo } from "../repositories/preventiviRepository";
import { creaPreventivo } from "../features/preventivi/preventiviDomain";
import { creaLavorazioneManuale } from "../features/preventivi/lavorazionePreventivoUtils";
import TipologiaImpiantoSelector from "../features/preventivi/components/TipologiaImpiantoSelector";
import { TIPOLOGIA_IMPIANTO_DEFAULT } from "../features/preventivi/tipologiaImpiantoConfig";
import { calcolaTotali, formatEuro, normalizzaNumero } from "../utils/preventivi";

function creaRiga() {
  return {
    id: `riga-${Date.now()}-${Math.random()}`,
    nome: "",
    quantita: 1,
    prezzo: 0,
    categoria: "Lavorazioni",
  };
}

export default function PreventivoManuale() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const clienteIdParam = searchParams.get("clienteId");
  const clientiIniziali = leggiClienti();
  const clienteDaParam = clienteIdParam
    ? clientiIniziali.find((c) => String(c.id) === clienteIdParam)
    : null;

  const [nomeCliente, setNomeCliente] = useState(clienteDaParam?.nome || "");
  const [tipologiaImpianto, setTipologiaImpianto] = useState(
    TIPOLOGIA_IMPIANTO_DEFAULT
  );
  const [righe, setRighe] = useState([creaRiga()]);
  const [sconto, setSconto] = useState(0);
  const [iva, setIva] = useState(22);
  const [note, setNote] = useState("");
  const [pagamento, setPagamento] = useState("Bonifico bancario");
  const [errore, setErrore] = useState("");

  const lavorazioniCalcolo = useMemo(
    () =>
      righe.map((r) => ({
        prezzo: normalizzaNumero(r.prezzo),
        quantita: normalizzaNumero(r.quantita, 1),
      })),
    [righe]
  );

  const totali = useMemo(
    () => calcolaTotali(lavorazioniCalcolo, sconto, iva),
    [lavorazioniCalcolo, sconto, iva]
  );

  function aggiornaRiga(id, campo, valore) {
    setRighe((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [campo]: valore } : r))
    );
  }

  function eliminaRiga(id) {
    setRighe((prev) => prev.filter((r) => r.id !== id));
  }

  function aggiungiRiga() {
    setRighe((prev) => [...prev, creaRiga()]);
  }

  function salva() {
    if (!nomeCliente.trim()) {
      setErrore("Inserisci il nome del cliente.");
      return;
    }
    if (righe.length === 0) {
      setErrore("Aggiungi almeno una lavorazione.");
      return;
    }

    const archivio = leggiPreventivi();
    const lavorazioni = righe.map((r) =>
      creaLavorazioneManuale({
        id: r.id,
        nome: r.nome || "Lavorazione",
        quantita: normalizzaNumero(r.quantita, 1),
        prezzo: normalizzaNumero(r.prezzo),
        categoria: r.categoria || "Lavorazioni",
      })
    );

    const preventivo = creaPreventivo({
      archivio,
      cliente: nomeCliente.trim(),
      clienteId:
        clienteDaParam && nomeCliente.trim() === clienteDaParam.nome
          ? clienteDaParam.id
          : undefined,
      lavorazioni,
      sconto,
      iva,
      validita: 30,
      pagamento,
      note,
      tipologiaImpianto,
    });

    salvaNuovoPreventivo(preventivo);
    navigate(routePreventivo(preventivo.id));
  }

  const backTo = clienteIdParam
    ? `${ROUTES.nuovoPreventivo}?clienteId=${clienteIdParam}`
    : ROUTES.nuovoPreventivo;

  return (
    <div className="pro-page text-white">
      <Link to={backTo} className="ds-back-link mb-5">
        <ArrowLeft size={18} />
        Scegli modalità
      </Link>

      <div className="mb-6">
        <p className="section-label">Preventivo Manuale</p>
        <h1 className="text-2xl font-black mt-1">Nuovo preventivo</h1>
      </div>

      {errore && (
        <div className="pro-panel p-4 mb-4 text-red-200 border-red-400/30 text-sm">
          {errore}
        </div>
      )}

      {/* Cliente */}
      <div className="pro-panel p-5 mb-4">
        <h2 className="text-base font-black mb-3">Cliente</h2>
        {clienteDaParam ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="font-black">{clienteDaParam.nome}</p>
              {clienteDaParam.indirizzo && (
                <p className="text-slate-400 text-sm mt-0.5">{clienteDaParam.indirizzo}</p>
              )}
            </div>
            <Link
              to={backTo}
              className="text-sm text-slate-400 underline"
            >
              Cambia
            </Link>
          </div>
        ) : (
          <input
            value={nomeCliente}
            onChange={(e) => {
              setNomeCliente(e.target.value);
              setErrore("");
            }}
            placeholder="Nome cliente"
            className="input-pro"
            autoComplete="organization"
          />
        )}
      </div>

      <div className="pro-panel p-5 mb-4">
        <TipologiaImpiantoSelector
          tipologiaImpianto={tipologiaImpianto}
          onSeleziona={setTipologiaImpianto}
        />
      </div>

      {/* Righe lavorazioni */}
      <div className="pro-panel p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-black">Lavorazioni</h2>
          <button
            onClick={aggiungiRiga}
            className="btn-secondary px-4 py-2 text-sm font-black flex items-center gap-1.5"
          >
            <Plus size={15} />
            Aggiungi
          </button>
        </div>

        {righe.length === 0 && (
          <p className="text-slate-400 text-sm text-center py-4">
            Nessuna lavorazione. Premi "Aggiungi" per iniziare.
          </p>
        )}

        <div className="space-y-3">
          {righe.map((riga, i) => (
            <div key={riga.id} className="bg-white/5 rounded-[14px] p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 w-5 shrink-0 text-center">{i + 1}</span>
                <input
                  value={riga.nome}
                  onChange={(e) => aggiornaRiga(riga.id, "nome", e.target.value)}
                  placeholder="Descrizione lavorazione"
                  className="input-pro flex-1 py-2 text-sm"
                />
                <button
                  onClick={() => eliminaRiga(riga.id)}
                  className="p-2 text-red-400 hover:text-red-300 transition shrink-0"
                  aria-label="Elimina riga"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 pl-7">
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Qtà</label>
                  <input
                    type="number"
                    min="0"
                    value={riga.quantita}
                    onChange={(e) => aggiornaRiga(riga.id, "quantita", e.target.value)}
                    className="input-pro py-2 text-sm text-center"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Prezzo €</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={riga.prezzo}
                    onChange={(e) => aggiornaRiga(riga.id, "prezzo", e.target.value)}
                    className="input-pro py-2 text-sm text-center"
                  />
                </div>
              </div>
              <div className="pl-7 flex justify-end">
                <span className="text-sm font-black text-emerald-300">
                  {formatEuro(
                    normalizzaNumero(riga.quantita) * normalizzaNumero(riga.prezzo)
                  )}
                </span>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={aggiungiRiga}
          className="w-full mt-3 py-3 rounded-[12px] border border-dashed border-white/20 text-slate-400 text-sm hover:border-yellow-300/40 hover:text-yellow-300 transition flex items-center justify-center gap-2"
        >
          <Plus size={16} />
          Aggiungi riga
        </button>
      </div>

      {/* Totali */}
      <div className="pro-panel p-5 mb-4">
        <h2 className="text-base font-black mb-4">Totali</h2>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-sm text-slate-400 block mb-1.5">Sconto generale %</label>
            <input
              type="number"
              min="0"
              max="100"
              value={sconto}
              onChange={(e) => setSconto(e.target.value)}
              className="input-pro"
            />
          </div>
          <div>
            <label className="text-sm text-slate-400 block mb-1.5">IVA %</label>
            <input
              type="number"
              min="0"
              value={iva}
              onChange={(e) => setIva(e.target.value)}
              className="input-pro"
            />
          </div>
        </div>

        <div className="space-y-2 border-t border-white/10 pt-3">
          <div className="flex justify-between text-sm text-slate-400">
            <span>Subtotale</span>
            <span>{formatEuro(totali.subtotale)}</span>
          </div>
          {normalizzaNumero(sconto) > 0 && (
            <div className="flex justify-between text-sm text-slate-400">
              <span>Sconto {normalizzaNumero(sconto)}%</span>
              <span>- {formatEuro(totali.importoSconto)}</span>
            </div>
          )}
          {normalizzaNumero(iva) > 0 && (
            <div className="flex justify-between text-sm text-slate-400">
              <span>IVA {normalizzaNumero(iva)}%</span>
              <span>+ {formatEuro(totali.importoIva)}</span>
            </div>
          )}
          <div className="flex justify-between font-black text-lg border-t border-white/10 pt-2">
            <span>Totale</span>
            <span className="text-emerald-300">{formatEuro(totali.totale)}</span>
          </div>
        </div>
      </div>

      {/* Pagamento e note */}
      <div className="pro-panel p-5 mb-6">
        <h2 className="text-base font-black mb-4">Dettagli</h2>
        <div className="space-y-3">
          <div>
            <label className="text-sm text-slate-400 block mb-1.5">Modalità pagamento</label>
            <input
              value={pagamento}
              onChange={(e) => setPagamento(e.target.value)}
              className="input-pro"
            />
          </div>
          <div>
            <label className="text-sm text-slate-400 block mb-1.5">Note</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="input-pro resize-none"
              placeholder="Eventuali note per il cliente..."
            />
          </div>
        </div>
      </div>

      <button
        onClick={salva}
        className="btn-primary w-full py-4 font-black text-base mb-8"
      >
        Crea preventivo
      </button>
    </div>
  );
}
