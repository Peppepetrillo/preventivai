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
      <div className="min-h-screen bg-[#060816] text-white flex items-center justify-center">
        <p className="text-white/50 text-lg">Caricamento listino...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060816] text-white p-5 pb-32">
      <div className="mb-8">
        <p className="text-[#3b9cff] text-sm font-bold uppercase">
          Prezzi base
        </p>
        <h1 className="text-4xl font-black">Listino</h1>
        <p className="text-slate-400 mt-2">
          Voci usate per creare rapidamente i preventivi.
        </p>
      </div>

      {messaggio && (
        <div className="bg-blue-500/15 border border-blue-400/20 rounded-2xl p-4 mb-5 text-blue-100">
          {messaggio}
        </div>
      )}

      <div className="space-y-4">
        {listino.map((item) => (
          <div
            key={item.id}
            className="bg-white/5 rounded-[26px] p-5 border border-white/10"
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
                  className="mt-2 w-full bg-black/20 border border-white/10 rounded-2xl p-3 outline-none"
                />
              </label>

              <label>
                <span className="text-sm text-white/45">Unita</span>
                <input
                  value={item.unita || "cad"}
                  onChange={(event) =>
                    aggiornaVoce(item.id, "unita", event.target.value)
                  }
                  className="mt-2 w-full bg-black/20 border border-white/10 rounded-2xl p-3 outline-none"
                />
              </label>

              <button
                onClick={() => salvaPrezzo(item.id, item.prezzo)}
                className="h-[50px] rounded-2xl bg-[#2491ff] flex items-center justify-center"
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
