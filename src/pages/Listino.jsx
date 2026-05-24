import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Listino() {

  const [listino, setListino] = useState([]);
  const [caricamento, setCaricamento] = useState(true);
  const [errore, setErrore] = useState(null);

  useEffect(() => {
    async function caricaListino() {
      const { data, error } = await supabase
        .from("listino")
        .select("*")
        .order("id");

      if (error) {
        setErrore("Errore nel caricamento del listino.");
      } else {
        setListino(data);
      }

      setCaricamento(false);
    }

    caricaListino();
  }, []);

  async function modificaPrezzo(id, nuovoPrezzo) {
    const prezzo = parseFloat(nuovoPrezzo);
    if (isNaN(prezzo) || prezzo < 0) return;

    // Aggiorna UI subito (optimistic update)
    setListino(
      listino.map((item) =>
        item.id === id ? { ...item, prezzo } : item
      )
    );

    const { error } = await supabase
      .from("listino")
      .update({ prezzo })
      .eq("id", id);

    if (error) {
      setErrore("Errore nel salvataggio. Riprova.");
    }
  }

  if (caricamento) {
    return (
      <div className="min-h-screen bg-[#060816] text-white flex items-center justify-center">
        <p className="text-white/50 text-lg">Caricamento listino...</p>
      </div>
    );
  }

  if (errore) {
    return (
      <div className="min-h-screen bg-[#060816] text-white flex items-center justify-center px-6">
        <p className="text-red-400 text-lg text-center">{errore}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060816] text-white p-5">

      <h1 className="text-4xl font-black mb-8">Listino</h1>

      <div className="space-y-4">
        {listino.map((item) => (
          <div
            key={item.id}
            className="bg-white/5 rounded-3xl p-5 border border-white/10"
          >
            <div className="flex items-center justify-between gap-4">

              <h2 className="text-xl font-bold">{item.nome}</h2>

              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={item.prezzo}
                  onChange={(e) => modificaPrezzo(item.id, e.target.value)}
                  className="w-24 bg-black/20 border border-white/10 rounded-xl p-3 text-center outline-none"
                />
                <div className="text-2xl font-black">€</div>
              </div>

            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
