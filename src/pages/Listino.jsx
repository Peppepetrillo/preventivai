import { useState } from "react";
import { Plus, Save } from "lucide-react";
import { leggiListino, salvaListino } from "../repositories/listinoRepository";
import { formatEuro, normalizzaNumero } from "../utils/preventivi";
import { selezionaZeroAlFocus } from "../utils/inputNumerici";

export default function Listino() {
  const [listino, setListino] = useState(() =>
    leggiListino()
  );
  const [nuovaVoce, setNuovaVoce] = useState({
    categoria: "Materiali",
    nome: "",
    prezzo: "",
    unita: "cad",
  });
  const [messaggio, setMessaggio] = useState("");

  function aggiornaVoce(id, campo, valore) {
    const listinoAggiornato = listino.map((item) =>
      item.id === id
        ? {
            ...item,
            [campo]: campo === "prezzo" ? normalizzaNumero(valore) : valore,
          }
        : item
    );

    setListino(listinoAggiornato);
    salvaListino(listinoAggiornato);
  }

  function aggiornaNuovaVoce(campo, valore) {
    setNuovaVoce({
      ...nuovaVoce,
      [campo]: campo === "prezzo" ? valore : valore,
    });
  }

  function aggiungiVoce() {
    if (!nuovaVoce.nome.trim()) {
      setMessaggio("Inserisci il nome del materiale o della lavorazione.");
      return;
    }

    const voce = {
      id: `locale-${new Date().getTime()}`,
      categoria: nuovaVoce.categoria.trim() || "Materiali",
      nome: nuovaVoce.nome.trim(),
      prezzo: normalizzaNumero(nuovaVoce.prezzo),
      unita: nuovaVoce.unita.trim() || "cad",
    };

    const listinoAggiornato = [voce, ...listino];
    setListino(listinoAggiornato);
    salvaListino(listinoAggiornato);
    setNuovaVoce({
      categoria: "Materiali",
      nome: "",
      prezzo: "",
      unita: "cad",
    });
    setMessaggio("Voce aggiunta al listino locale.");
  }

  function salvaPrezzo() {
    salvaListino(listino);
    setMessaggio("Listino aggiornato in locale.");
  }

  return (
    <div className="pro-page text-white">
      <div className="mb-6 pro-panel-strong p-5">
        <p className="section-label">
          Prezzi base
        </p>
        <h1 className="text-3xl sm:text-4xl font-black mt-1">Listino</h1>
        <p className="text-slate-400 mt-2">
          Voci, unità e prezzi che alimentano i preventivi.
        </p>
      </div>

      {messaggio && (
        <div className="pro-panel p-4 mb-5 text-yellow-100 border-yellow-300/30">
          {messaggio}
        </div>
      )}

      <section className="pro-panel p-5 mb-5">
        <div className="flex items-center gap-3 mb-4">
          <Plus size={22} className="text-yellow-300" />
          <div>
            <h2 className="text-xl font-black">Aggiungi materiale</h2>
            <p className="text-slate-400 text-sm">
              La nuova voce sarà disponibile nei preventivi.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_120px_90px]">
          <input
            value={nuovaVoce.nome}
            onChange={(event) => aggiornaNuovaVoce("nome", event.target.value)}
            placeholder="Nome materiale o lavorazione"
            className="input-pro"
          />
          <input
            value={nuovaVoce.categoria}
            onChange={(event) =>
              aggiornaNuovaVoce("categoria", event.target.value)
            }
            placeholder="Categoria"
            className="input-pro"
          />
          <input
            type="number"
            min="0"
            value={nuovaVoce.prezzo}
            onFocus={selezionaZeroAlFocus}
            onChange={(event) =>
              aggiornaNuovaVoce("prezzo", event.target.value)
            }
            placeholder="Prezzo"
            className="input-pro"
          />
          <input
            value={nuovaVoce.unita}
            onChange={(event) => aggiornaNuovaVoce("unita", event.target.value)}
            placeholder="Unità"
            className="input-pro"
          />
        </div>

        <button
          onClick={aggiungiVoce}
          className="mt-4 btn-primary px-5 py-4 flex items-center justify-center gap-2"
        >
          <Plus size={19} />
          Aggiungi al listino
        </button>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        {listino.map((item) => (
          <div
            key={item.id}
            className="pro-panel p-5"
          >
            <p className="text-white/40 text-xs font-bold uppercase mb-2">
              {item.categoria || "Lavorazioni"}
            </p>

            <input
              value={item.nome}
              onChange={(event) =>
                aggiornaVoce(item.id, "nome", event.target.value)
              }
              className="w-full bg-transparent text-xl font-black outline-none mb-4"
            />

            <div className="grid grid-cols-[1fr_82px_46px] gap-3 items-end">
              <label>
                <span className="text-sm text-white/45">Prezzo</span>
                <input
                  type="number"
                  value={item.prezzo}
                  onFocus={selezionaZeroAlFocus}
                  onChange={(event) =>
                    aggiornaVoce(item.id, "prezzo", event.target.value)
                  }
                  className="mt-2 input-pro p-3"
                />
              </label>

              <label>
                <span className="text-sm text-white/45">Unità</span>
                <input
                  value={item.unita || "cad"}
                  onChange={(event) =>
                    aggiornaVoce(item.id, "unita", event.target.value)
                  }
                  className="mt-2 input-pro p-3"
                />
              </label>

              <button
                onClick={salvaPrezzo}
                className="h-[50px] rounded-[14px] bg-yellow-400 text-slate-950 flex items-center justify-center"
                aria-label="Salva prezzo"
              >
                <Save size={19} />
              </button>
            </div>

            <p className="text-white/40 text-sm mt-3">
              Valore attuale: {formatEuro(item.prezzo)} / {item.unita || "cad"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
