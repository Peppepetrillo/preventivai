import { useCallback, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bot,
  Calculator,
  ClipboardList,
  FileCheck2,
  Layers,
  Mic,
  MicOff,
  Plus,
  Search,
  Sparkles,
  Trash2,
  UserPlus,
} from "lucide-react";
import {
  calcolaTotali,
  calcolaSaldo,
  formatEuro,
  normalizzaNumero,
} from "../utils/preventivi";
import NumericInput from "../components/NumericInput";
import { ROUTES, routePreventivo } from "../app/routes";
import { leggiClienti } from "../repositories/clientiRepository";
import { leggiListino } from "../repositories/listinoRepository";
import {
  leggiPreventivi,
  salvaNuovoPreventivo,
} from "../repositories/preventiviRepository";
import {
  aggiornaCampoLavorazione,
  creaLavorazioneDaVoce,
  creaPreventivo,
  incrementaLavorazione,
} from "../features/preventivi/preventiviDomain";
import { generaBozzaPreventivoAI } from "../features/preventivi/assistentePreventivi";
import {
  aggiungiKitALavorazioni,
  KIT_LISTINO,
} from "../features/preventivi/kitListinoDomain";
import { useRiconoscimentoVocale } from "../hooks/useRiconoscimentoVocale";

export default function Preventivi() {
  const navigate = useNavigate();

  const [clienti] = useState(() => leggiClienti());
  const [listino] = useState(() => leggiListino());
  const [clienteSelezionato, setClienteSelezionato] = useState("");
  const [ricerca, setRicerca] = useState("");
  const [lavorazioni, setLavorazioni] = useState([]);
  const [sconto, setSconto] = useState(0);
  const [iva, setIva] = useState(22);
  const [validita, setValidita] = useState(30);
  const [pagamento, setPagamento] = useState("Bonifico bancario");
  const [acconto, setAcconto] = useState(0);
  const [note, setNote] = useState("");
  const [messaggio, setMessaggio] = useState("");
  const [testoAssistente, setTestoAssistente] = useState("");
  const [bozzaAssistente, setBozzaAssistente] = useState(null);
  const [assistenteInElaborazione, setAssistenteInElaborazione] = useState(false);

  const aggiornaTestoDaVoce = useCallback((testo) => {
    setTestoAssistente(testo);
  }, []);

  const {
    supportato: voceSupportata,
    inAscolto,
    avvia,
    ferma,
  } = useRiconoscimentoVocale({
    onTesto: aggiornaTestoDaVoce,
  });

  const vociFiltrate = useMemo(() => {
    const testo = ricerca.trim().toLowerCase();
    if (!testo) return listino;

    return listino.filter((voce) =>
      `${voce.nome} ${voce.categoria || ""}`.toLowerCase().includes(testo)
    );
  }, [listino, ricerca]);

  const totali = calcolaTotali(lavorazioni, sconto, iva);
  const saldo = calcolaSaldo(totali.totale, acconto);

  async function generaBozzaConAssistente() {
    if (!testoAssistente.trim()) {
      setMessaggio("Scrivi o detta una richiesta prima di usare l'assistente.");
      return;
    }

    setAssistenteInElaborazione(true);
    setMessaggio("");

    try {
      const bozza = await generaBozzaPreventivoAI({
        testo: testoAssistente,
        clienti,
        listino,
      });

      setBozzaAssistente(bozza);
      setMessaggio(
        bozza.avvisi?.length
          ? bozza.avvisi.join(" ")
          : "Bozza AI pronta: controlla i dati e applicala al preventivo."
      );
    } catch {
      setMessaggio("Assistente AI non disponibile. Riprova tra poco.");
    } finally {
      setAssistenteInElaborazione(false);
    }
  }

  function applicaBozzaAssistente() {
    if (!bozzaAssistente) return;

    if (bozzaAssistente.cliente) {
      setClienteSelezionato(bozzaAssistente.cliente);
    }

    if (bozzaAssistente.lavorazioni?.length) {
      setLavorazioni(bozzaAssistente.lavorazioni);
    }

    setSconto(normalizzaNumero(bozzaAssistente.sconto));
    setIva(normalizzaNumero(bozzaAssistente.iva, 22));
    setValidita(normalizzaNumero(bozzaAssistente.validita, 30));
    setPagamento(bozzaAssistente.pagamento || "Bonifico bancario");
    setAcconto(normalizzaNumero(bozzaAssistente.acconto));
    setNote(bozzaAssistente.note || testoAssistente);
    setMessaggio("Bozza AI applicata. Verifica il preventivo prima di salvarlo.");
  }

  function aggiungiLavorazione(voce) {
    const esistente = lavorazioni.find((item) => item.nome === voce.nome);

    if (esistente) {
      setLavorazioni(
        lavorazioni.map((item) =>
          item.nome === voce.nome
            ? incrementaLavorazione(item)
            : item
        )
      );
      return;
    }

    setLavorazioni([
      ...lavorazioni,
      creaLavorazioneDaVoce(voce),
    ]);
  }

  function aggiungiKit(kit) {
    setLavorazioni(aggiungiKitALavorazioni(lavorazioni, listino, kit.id));
    setMessaggio(`${kit.nome} aggiunto al preventivo.`);
  }

  function aggiornaLavorazione(index, campo, valore) {
    setLavorazioni(
      lavorazioni.map((item, i) =>
        i === index
          ? aggiornaCampoLavorazione(item, campo, valore)
          : item
      )
    );
  }

  function rimuoviLavorazione(index) {
    setLavorazioni(lavorazioni.filter((_, i) => i !== index));
  }

  function salvaPreventivo() {
    if (!clienteSelezionato) {
      setMessaggio("Seleziona un cliente prima di salvare il preventivo.");
      return;
    }

    if (lavorazioni.length === 0) {
      setMessaggio("Aggiungi almeno una lavorazione al preventivo.");
      return;
    }

    const archivio = leggiPreventivi();
    const preventivo = creaPreventivo({
      archivio,
      cliente: clienteSelezionato,
      lavorazioni,
      sconto: normalizzaNumero(sconto),
      iva: normalizzaNumero(iva),
      validita: normalizzaNumero(validita, 30),
      pagamento: pagamento.trim(),
      acconto: normalizzaNumero(acconto),
      note,
    });

    salvaNuovoPreventivo(preventivo);
    navigate(routePreventivo(preventivo.id));
  }

  return (
    <div className="min-h-screen text-white pb-[230px]">
      <div className="px-5 pt-6 pb-4 sticky top-0 z-30 bg-slate-950/[0.92] backdrop-blur-xl border-b border-white/10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="section-label">
              Nuovo documento
            </p>
            <h1 className="text-4xl font-black tracking-tight">
              Preventivo
            </h1>
          </div>

          <div className="w-12 h-12 rounded-[14px] bg-yellow-400 text-slate-950 flex items-center justify-center">
            <ClipboardList size={24} />
          </div>
        </div>
      </div>

      <div className="px-5 pt-5 space-y-6">
        {messaggio && (
          <div className="pro-panel p-4 text-yellow-100 border-yellow-300/30">
            {messaggio}
          </div>
        )}

        <section className="pro-panel-strong p-4 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-[14px] bg-yellow-400 text-slate-950 flex items-center justify-center">
                <Bot size={22} />
              </div>
              <div>
                <p className="section-label">Assistente AI</p>
                <h2 className="text-xl font-black">Crea da testo o voce</h2>
              </div>
            </div>

            <button
              type="button"
              onClick={inAscolto ? ferma : avvia}
              disabled={!voceSupportata}
              className={`w-12 h-12 rounded-[14px] flex items-center justify-center ${
                inAscolto
                  ? "bg-red-500/20 text-red-100"
                  : "bg-white/10 text-yellow-200 disabled:text-slate-600"
              }`}
              aria-label={inAscolto ? "Ferma dettatura" : "Avvia dettatura"}
            >
              {inAscolto ? <MicOff size={21} /> : <Mic size={21} />}
            </button>
          </div>

          <textarea
            value={testoAssistente}
            onChange={(event) => setTestoAssistente(event.target.value)}
            rows="4"
            placeholder="Esempio: preventivo per Mario Rossi con 4 punti luce, 6 prese, quadro elettrico, sconto 5%, acconto 200 euro, pagamento con bonifico."
            className="input-pro resize-none"
          />

          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <p className="text-sm text-slate-400">
              {voceSupportata
                ? inAscolto
                  ? "Sto ascoltando..."
                  : "Puoi dettare o scrivere la richiesta."
                : "Dettatura non supportata da questo browser."}
            </p>

            <button
              type="button"
              onClick={generaBozzaConAssistente}
              disabled={assistenteInElaborazione}
              className="btn-primary px-5 py-4 flex items-center justify-center gap-2"
            >
              <Sparkles size={19} />
              {assistenteInElaborazione ? "Genero..." : "Genera bozza"}
            </button>
          </div>

          {bozzaAssistente && (
            <div className="rounded-[16px] border border-yellow-300/25 bg-yellow-400/10 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-black">
                    {bozzaAssistente.riepilogo?.vociTrovate || 0} lavorazioni trovate
                  </p>
                  <p className="text-sm text-slate-300 mt-1">
                    Totale stimato {formatEuro(bozzaAssistente.riepilogo?.totale || 0)}
                    {" · "}
                    Saldo {formatEuro(bozzaAssistente.riepilogo?.saldo || 0)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={applicaBozzaAssistente}
                  className="btn-secondary px-5 py-3"
                >
                  Applica bozza
                </button>
              </div>

              {bozzaAssistente.lavorazioni?.length > 0 && (
                <div className="mt-4 grid gap-2">
                  {bozzaAssistente.lavorazioni.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span className="text-slate-200">{item.nome}</span>
                      <span className="text-yellow-200 font-bold">
                        {item.quantita} {item.unita}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        <section className="pro-panel p-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h2 className="text-xl font-black">Cliente</h2>
            <Link
              to={ROUTES.clienti}
              className="text-yellow-300 text-sm font-bold flex items-center gap-1"
            >
              <UserPlus size={16} />
              Nuovo
            </Link>
          </div>

          <select
            value={clienteSelezionato}
            onChange={(event) => setClienteSelezionato(event.target.value)}
            className="input-pro h-14"
          >
            <option value="">Seleziona cliente</option>
            {clienti.map((cliente) => (
              <option key={cliente.id || cliente.nome} value={cliente.nome}>
                {cliente.nome}
              </option>
            ))}
          </select>
        </section>

        <section className="pro-panel p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-[14px] bg-yellow-400/12 text-yellow-200 flex items-center justify-center">
              <Layers size={22} />
            </div>
            <div>
              <p className="section-label">Kit Rapidi</p>
              <h2 className="text-xl font-black">Aggiungi gruppi pronti</h2>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {KIT_LISTINO.map((kit) => (
              <button
                key={kit.id}
                type="button"
                onClick={() => aggiungiKit(kit)}
                className="pro-panel p-4 text-left hover:border-yellow-300/40 transition"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-black">{kit.nome}</h3>
                    <p className="text-sm text-slate-400 mt-1">
                      {kit.voci.length} lavorazioni
                    </p>
                  </div>
                  <div className="w-11 h-11 rounded-[14px] bg-yellow-400 text-slate-950 flex items-center justify-center shrink-0">
                    <Plus size={22} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-black">Listino elettricista</h2>
            <span className="text-white/40 text-sm">{vociFiltrate.length} voci</span>
          </div>

          <div className="relative mb-3">
            <Search
              size={19}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-yellow-300"
            />
            <input
              value={ricerca}
              onChange={(event) => setRicerca(event.target.value)}
              placeholder="Cerca lavorazione..."
              className="w-full h-14 rounded-[14px] bg-slate-950/50 border border-white/10 pl-11 pr-4 outline-none"
            />
          </div>

          <div className="grid gap-3">
            {vociFiltrate.map((voce) => (
              <button
                key={voce.id || voce.nome}
                onClick={() => aggiungiLavorazione(voce)}
                className="w-full pro-panel p-4 text-left active:scale-[0.99] transition hover:border-yellow-300/40"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-white/45 text-xs font-bold uppercase">
                      {voce.categoria || "Lavorazioni"}
                    </p>
                    <h3 className="text-lg font-black leading-tight mt-1">
                      {voce.nome}
                    </h3>
                    <p className="text-yellow-300 font-bold mt-2">
                      {formatEuro(voce.prezzo)} / {voce.unita || "cad"}
                    </p>
                  </div>

                  <div className="w-12 h-12 rounded-[14px] bg-yellow-400 text-slate-950 flex items-center justify-center shrink-0">
                    <Plus size={24} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-black mb-3">Lavorazioni aggiunte</h2>

          {lavorazioni.length === 0 ? (
            <div className="pro-panel border-dashed p-8 text-center">
              <Calculator size={36} className="mx-auto text-white/25 mb-3" />
              <p className="text-white/45">
                Tocca una voce del listino per comporre il preventivo.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {lavorazioni.map((item, index) => (
                <div
                  key={item.id}
                  className="pro-panel p-4"
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <input
                        value={item.nome}
                        onChange={(event) =>
                          aggiornaLavorazione(index, "nome", event.target.value)
                        }
                        className="w-full bg-transparent text-xl font-black outline-none"
                      />
                      <p className="text-white/45 text-sm mt-1">
                        {item.categoria}
                      </p>
                    </div>

                    <button
                      onClick={() => rimuoviLavorazione(index)}
                      className="w-11 h-11 rounded-2xl bg-red-500/20 text-red-200 flex items-center justify-center shrink-0"
                      aria-label="Elimina lavorazione"
                    >
                      <Trash2 size={19} />
                    </button>
                  </div>

                  <div className="grid grid-cols-[1fr_1fr_72px] gap-3">
                    <label className="block">
                      <span className="text-xs text-white/45">Quantità</span>
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

                    <label className="block">
                      <span className="text-xs text-white/45">Prezzo</span>
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

                    <label className="block">
                      <span className="text-xs text-white/45">Unità</span>
                      <input
                        value={item.unita}
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
          )}
        </section>

        <section className="pro-panel p-4 space-y-4">
          <h2 className="text-xl font-black">Condizioni</h2>

          <div className="grid grid-cols-2 gap-3">
            <label>
              <span className="text-sm text-white/50">Sconto %</span>
              <NumericInput
                min="0"
                value={sconto}
                inputMode="decimal"
                onChange={setSconto}
                className="mt-2 input-pro"
              />
            </label>

            <label>
              <span className="text-sm text-white/50">IVA %</span>
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
              <span className="text-sm text-white/50">Validità giorni</span>
              <NumericInput
                min="0"
                value={validita}
                inputMode="numeric"
                onChange={setValidita}
                className="mt-2 input-pro"
              />
            </label>

            <label>
              <span className="text-sm text-white/50">Pagamento</span>
              <input
                value={pagamento}
                onChange={(event) => setPagamento(event.target.value)}
                placeholder="Esempio: 50% acconto, saldo a fine lavori"
                className="mt-2 input-pro"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label>
              <span className="text-sm text-white/50">Acconto</span>
              <NumericInput
                min="0"
                value={acconto}
                inputMode="decimal"
                onChange={setAcconto}
                className="mt-2 input-pro"
              />
            </label>

            <div className="rounded-[14px] border border-white/10 bg-black/[0.18] p-4">
              <span className="text-sm text-white/50">Saldo previsto</span>
              <p className="text-2xl font-black mt-1">{formatEuro(saldo)}</p>
            </div>
          </div>

          <label className="block">
            <span className="text-sm text-white/50">Note per il cliente</span>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows="4"
              placeholder="Esempio: validità offerta 30 giorni, materiali inclusi, tempi stimati..."
              className="mt-2 input-pro resize-none"
            />
          </label>
        </section>
      </div>

      <div className="fixed bottom-[86px] left-0 right-0 px-4 z-40">
        <div className="max-w-xl mx-auto bg-[#0d1320]/95 backdrop-blur-2xl border border-white/10 rounded-[26px] p-3 shadow-[0_20px_70px_rgba(0,0,0,0.55)]">
          <div className="flex items-center justify-between gap-3">
            <div className="px-2">
              <p className="text-white/45 text-xs font-bold uppercase">
                Totale IVA incl.
              </p>
              <h2 className="text-3xl font-black leading-tight">
                {formatEuro(totali.totale)}
              </h2>
              <p className="text-white/45 text-xs">
                Saldo {formatEuro(saldo)}
              </p>
            </div>

            <button
              onClick={salvaPreventivo}
              className="h-16 px-5 btn-primary flex items-center gap-2"
            >
              <FileCheck2 size={21} />
              Salva
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
