import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Calculator,
  ClipboardList,
  FileCheck2,
  Plus,
  Search,
  Trash2,
  UserPlus,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { listinoBase } from "../data/listinoBase";
import { leggiStorage, salvaStorage } from "../utils/storage";
import {
  calcolaTotali,
  creaNumeroPreventivo,
  formatEuro,
} from "../utils/preventivi";

export default function Preventivi() {
  const navigate = useNavigate();

  const [clienti] = useState(() => leggiStorage("clienti", []));
  const [listino, setListino] = useState(() =>
    leggiStorage("listinoLocale", listinoBase)
  );
  const [clienteSelezionato, setClienteSelezionato] = useState("");
  const [ricerca, setRicerca] = useState("");
  const [lavorazioni, setLavorazioni] = useState([]);
  const [sconto, setSconto] = useState(0);
  const [iva, setIva] = useState(22);
  const [note, setNote] = useState("");
  const [caricamento, setCaricamento] = useState(true);

  useEffect(() => {
    async function caricaListino() {
      try {
        const richiesta = supabase.from("listino").select("*").order("id");
        const timeout = new Promise((resolve) => {
          setTimeout(() => resolve({ data: null, error: true }), 2500);
        });
        const { data, error } = await Promise.race([richiesta, timeout]);

        if (!error && data?.length) {
          const listinoNormalizzato = data.map((voce) => ({
            ...voce,
            categoria: voce.categoria || "Lavorazioni",
            unita: voce.unita || "cad",
          }));
          setListino(listinoNormalizzato);
          salvaStorage("listinoLocale", listinoNormalizzato);
        }
      } finally {
        setCaricamento(false);
      }
    }

    caricaListino();
  }, []);

  const vociFiltrate = useMemo(() => {
    const testo = ricerca.trim().toLowerCase();
    if (!testo) return listino;

    return listino.filter((voce) =>
      `${voce.nome} ${voce.categoria || ""}`.toLowerCase().includes(testo)
    );
  }, [listino, ricerca]);

  const totali = calcolaTotali(lavorazioni, sconto, iva);

  function aggiungiLavorazione(voce) {
    const esistente = lavorazioni.find((item) => item.nome === voce.nome);

    if (esistente) {
      setLavorazioni(
        lavorazioni.map((item) =>
          item.nome === voce.nome
            ? { ...item, quantita: Number(item.quantita || 0) + 1 }
            : item
        )
      );
      return;
    }

    setLavorazioni([
      ...lavorazioni,
      {
        id: `${voce.id ?? voce.nome}-${new Date().getTime()}`,
        nome: voce.nome,
        categoria: voce.categoria || "Lavorazioni",
        prezzo: Number(voce.prezzo || 0),
        quantita: 1,
        unita: voce.unita || "cad",
      },
    ]);
  }

  function aggiornaLavorazione(index, campo, valore) {
    setLavorazioni(
      lavorazioni.map((item, i) =>
        i === index
          ? {
              ...item,
              [campo]:
                campo === "prezzo" || campo === "quantita"
                  ? Number(valore)
                  : valore,
            }
          : item
      )
    );
  }

  function rimuoviLavorazione(index) {
    setLavorazioni(lavorazioni.filter((_, i) => i !== index));
  }

  function salvaPreventivo() {
    if (!clienteSelezionato) {
      alert("Seleziona un cliente prima di salvare il preventivo.");
      return;
    }

    if (lavorazioni.length === 0) {
      alert("Aggiungi almeno una lavorazione al preventivo.");
      return;
    }

    const archivio = leggiStorage("archivioPreventivi", []);
    const id = new Date().getTime();
    const preventivo = {
      id,
      numero: creaNumeroPreventivo(archivio.length + 1),
      cliente: clienteSelezionato,
      lavorazioni,
      sconto: Number(sconto || 0),
      iva: Number(iva || 0),
      note,
      stato: "Bozza",
      data: new Date().toLocaleDateString("it-IT"),
      ...totali,
    };

    salvaStorage("archivioPreventivi", [...archivio, preventivo]);
    window.dispatchEvent(new Event("preventivi-aggiornati"));
    navigate(`/preventivo/${id}`);
  }

  if (caricamento) {
    return (
      <div className="min-h-screen bg-[#070b14] text-white flex items-center justify-center">
        <p className="text-white/50 text-lg">Caricamento listino...</p>
      </div>
    );
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
        <section className="pro-panel p-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h2 className="text-xl font-black">Cliente</h2>
            <Link
              to="/clienti"
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
                      <span className="text-xs text-white/45">Quantita</span>
                      <input
                        type="number"
                        min="0"
                        value={item.quantita}
                        onChange={(event) =>
                          aggiornaLavorazione(index, "quantita", event.target.value)
                        }
                        className="mt-1 input-pro p-3"
                      />
                    </label>

                    <label className="block">
                      <span className="text-xs text-white/45">Prezzo</span>
                      <input
                        type="number"
                        min="0"
                        value={item.prezzo}
                        onChange={(event) =>
                          aggiornaLavorazione(index, "prezzo", event.target.value)
                        }
                        className="mt-1 input-pro p-3"
                      />
                    </label>

                    <label className="block">
                      <span className="text-xs text-white/45">Unita</span>
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
              <input
                type="number"
                min="0"
                value={sconto}
                onChange={(event) => setSconto(Number(event.target.value))}
                className="mt-2 input-pro"
              />
            </label>

            <label>
              <span className="text-sm text-white/50">IVA %</span>
              <input
                type="number"
                min="0"
                value={iva}
                onChange={(event) => setIva(Number(event.target.value))}
                className="mt-2 input-pro"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-sm text-white/50">Note per il cliente</span>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows="4"
              placeholder="Esempio: validita offerta 30 giorni, materiali inclusi, tempi stimati..."
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
                Imponibile {formatEuro(totali.imponibile)}
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
