import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { listinoBase } from "../data/listinoBase";
import { leggiStorage, salvaStorage } from "../utils/storage";
import { formatEuro } from "../utils/preventivi";

export default function Listino() {
  const [listino, setListino] = useState(() =>
    leggiStorage("listinoLocale", listinoBase)
  );
  const [caricamento, setCaricamento] = useState(true);
  const [messaggio, setMessaggio] = useState("");

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

  function aggiornaVoce(id, campo, valore) {
    const listinoAggiornato = listino.map((item) =>
      item.id === id
        ? {
            ...item,
            [campo]: campo === "prezzo" ? Number(valore) : valore,
          }
        : item
    );

    setListino(listinoAggiornato);
    salvaStorage("listinoLocale", listinoAggiornato);
  }

  async function salvaPrezzo(id, prezzo) {
    setMessaggio("Salvataggio listino...");

    const { error } = await supabase
      .from("listino")
      .update({ prezzo: Number(prezzo || 0) })
      .eq("id", id);

    setMessaggio(
      error
        ? "Salvato in locale. Supabase non ha confermato la modifica."
        : "Listino aggiornato."
    );
  }

  if (caricamento) {
    return (
      <div className="min-h-screen text-white flex items-center justify-center">
        <p className="text-white/50 text-lg">Caricamento listino...</p>
      </div>
    );
  }

  return (
    <div className="pro-page text-white">
      <div className="mb-6 pro-panel-strong p-5">
        <p className="section-label">
          Prezzi base
        </p>
        <h1 className="text-3xl sm:text-4xl font-black mt-1">Listino</h1>
        <p className="text-slate-400 mt-2">
          Voci, unita e prezzi che alimentano i preventivi.
        </p>
      </div>

      {messaggio && (
        <div className="pro-panel p-4 mb-5 text-yellow-100 border-yellow-300/30">
          {messaggio}
        </div>
      )}

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
                onClick={() => salvaPrezzo(item.id, item.prezzo)}
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
