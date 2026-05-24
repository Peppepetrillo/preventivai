import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Preventivi() {

  const [clienti] = useState(() => {
    return JSON.parse(localStorage.getItem("clienti")) || [];
  });

  const [listino, setListino] = useState([]);
  const [clienteSelezionato, setClienteSelezionato] = useState("");
  const [mostraAltro, setMostraAltro] = useState(false);
  const [lavorazioni, setLavorazioni] = useState([]);
  const [caricamento, setCaricamento] = useState(true);

  useEffect(() => {
    async function caricaListino() {
      const { data, error } = await supabase
        .from("listino")
        .select("*")
        .order("id");

      if (!error && data) setListino(data);
      setCaricamento(false);
    }
    caricaListino();
  }, []);

  const listinoRapido = listino.slice(0, 4);
  const listinoAltro = listino.slice(4);

  function aggiungiLavorazione(voce) {
    const esistente = lavorazioni.find((item) => item.nome === voce.nome);
    if (esistente) {
      setLavorazioni(
        lavorazioni.map((item) =>
          item.nome === voce.nome
            ? { ...item, quantita: item.quantita + 1 }
            : item
        )
      );
      return;
    }
    setLavorazioni([
      ...lavorazioni,
      { id: Date.now(), nome: voce.nome, prezzo: voce.prezzo, quantita: 1 },
    ]);
  }

  function aumentaQuantita(index) {
    setLavorazioni(
      lavorazioni.map((item, i) =>
        i === index ? { ...item, quantita: item.quantita + 1 } : item
      )
    );
  }

  function diminuisciQuantita(index) {
    setLavorazioni(
      lavorazioni.map((item, i) =>
        i === index && item.quantita > 1
          ? { ...item, quantita: item.quantita - 1 }
          : item
      )
    );
  }

  function rimuoviLavorazione(index) {
    setLavorazioni(lavorazioni.filter((_, i) => i !== index));
  }

  const totale = lavorazioni.reduce(
    (acc, item) => acc + item.prezzo * item.quantita,
    0
  );

  function salvaPreventivo() {
    if (!clienteSelezionato || lavorazioni.length === 0) {
      alert("Seleziona un cliente e aggiungi almeno una lavorazione.");
      return;
    }
    const archivio =
      JSON.parse(localStorage.getItem("archivioPreventivi")) || [];
    archivio.push({
      id: Date.now(),
      cliente: clienteSelezionato,
      lavorazioni,
      totale,
      data: new Date().toLocaleString(),
    });
    localStorage.setItem("archivioPreventivi", JSON.stringify(archivio));
    alert("Preventivo salvato 😄🔥");
    setLavorazioni([]);
    setClienteSelezionato("");
  }

  if (caricamento) {
    return (
      <div className="min-h-screen bg-[#070b14] text-white flex items-center justify-center">
        <p className="text-white/50 text-lg">Caricamento listino...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b14] text-white pb-[220px]">

      {/* HEADER */}
      <div className="px-4 pt-5 flex items-center gap-4 mb-6">
        <button className="w-10 h-10 flex flex-col justify-center gap-[6px]">
          <span className="block w-6 h-[2px] bg-white rounded-full" />
          <span className="block w-6 h-[2px] bg-white rounded-full" />
          <span className="block w-4 h-[2px] bg-white rounded-full" />
        </button>
        <h1 className="text-[38px] font-black tracking-tight leading-none">
          Preventivi
        </h1>
      </div>

      <div className="px-4">

        {/* SELECT CLIENTE */}
        <div className="relative mb-5">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#3b9cff]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
          </div>
          <select
            value={clienteSelezionato}
            onChange={(e) => setClienteSelezionato(e.target.value)}
            className="w-full h-14 rounded-2xl bg-[#161b26] border border-white/10 pl-10 pr-10 text-[16px] outline-none appearance-none"
          >
            <option value="">Seleziona Cliente</option>
            {clienti.map((cliente, index) => (
              <option key={index} value={cliente.nome}>
                {cliente.nome}
              </option>
            ))}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>
        </div>

        {/* LISTINO RAPIDO */}
        <div className="space-y-3">
          {listinoRapido.map((voce, index) => (
            <button
              key={index}
              onClick={() => aggiungiLavorazione(voce)}
              className="w-full bg-[#161b26] rounded-[26px] p-4 active:scale-[0.98] transition-all border border-white/5"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="text-left flex-1">
                  <h2 className="text-[24px] font-black leading-tight text-white">
                    {voce.nome}
                  </h2>
                  <p className="text-[#3b9cff] text-[16px] mt-2 font-semibold">
                    € {voce.prezzo}
                  </p>
                </div>
                <div className="w-[72px] h-[72px] rounded-[22px] bg-[#2491ff] flex items-center justify-center shrink-0">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* ALTRE LAVORAZIONI */}
        <button
          onClick={() => setMostraAltro(!mostraAltro)}
          className="w-full h-14 rounded-2xl bg-[#161b26] border border-white/10 text-[16px] font-bold mt-4 flex items-center justify-between px-4"
        >
          <div className="flex items-center gap-3 text-[#3b9cff]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <circle cx="3" cy="6" r="1" fill="currentColor" />
              <circle cx="3" cy="12" r="1" fill="currentColor" />
              <circle cx="3" cy="18" r="1" fill="currentColor" />
            </svg>
            <span className="text-white">Altre lavorazioni</span>
          </div>
          <svg
            width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"
            className={`transition-transform ${mostraAltro ? "rotate-90" : ""}`}
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>

        {mostraAltro && (
          <div className="space-y-3 mt-3">
            {listinoAltro.map((voce, index) => (
              <button
                key={index}
                onClick={() => aggiungiLavorazione(voce)}
                className="w-full bg-[#161b26] rounded-[24px] p-4 active:scale-[0.98] border border-white/5"
              >
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <h2 className="text-[20px] font-black text-white">{voce.nome}</h2>
                    <p className="text-[#3b9cff] text-[15px] mt-1">
                      € {voce.prezzo}
                    </p>
                  </div>
                  <div className="w-[56px] h-[56px] rounded-[18px] bg-[#2491ff] flex items-center justify-center shrink-0">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* LAVORAZIONI AGGIUNTE */}
        <div className="mt-6">
          <p className="text-[15px] text-white/60 font-semibold mb-3">
            Lavorazioni aggiunte
          </p>

          {lavorazioni.length === 0 ? (
            <div className="bg-[#111723] border border-white/10 rounded-[26px] p-8 flex flex-col items-center justify-center gap-3">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" opacity="0.3">
                <rect x="2" y="7" width="20" height="14" rx="2" />
                <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
                <line x1="12" y1="12" x2="12" y2="16" />
                <line x1="10" y1="14" x2="14" y2="14" />
              </svg>
              <p className="text-white/30 text-[15px] text-center leading-snug">
                Nessuna lavorazione aggiunta<br />
                Aggiungi voci dal listino qui sopra
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {lavorazioni.map((item, index) => (
                <div
                  key={item.id}
                  className="bg-[#111723] border border-white/10 rounded-[26px] p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-[22px] font-black leading-tight">
                        {item.nome}
                      </h2>
                      <p className="text-white/70 text-[16px] mt-1">
                        € {item.prezzo}
                      </p>
                    </div>
                    <div className="text-[28px] font-black">x{item.quantita}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mt-4">
                    <button
                      onClick={() => rimuoviLavorazione(index)}
                      className="h-14 rounded-2xl bg-red-600/40 text-[22px] flex items-center justify-center"
                    >
                      🗑️
                    </button>
                    <button
                      onClick={() => diminuisciQuantita(index)}
                      className="h-14 rounded-2xl bg-[#232632] text-[34px]"
                    >
                      −
                    </button>
                    <button
                      onClick={() => aumentaQuantita(index)}
                      className="h-14 rounded-2xl bg-[#2491ff] text-[34px]"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* FOOTER FISSO */}
      <div className="fixed bottom-[85px] left-0 right-0 px-4 z-50">
        <div style={{ display: "flex", gap: "12px", alignItems: "stretch" }}>

          {/* TOTALE */}
          <div style={{ flex: 1, background: "linear-gradient(to right, #15803d, #22c55e)", borderRadius: "22px", padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 25px 50px rgba(0,0,0,0.5)" }}>
            <div>
              <p style={{ fontSize: "12px", opacity: 0.7, fontWeight: 600, margin: 0 }}>Totale</p>
              <h2 style={{ fontSize: "28px", fontWeight: 900, lineHeight: 1, margin: 0 }}>
                € {totale}
              </h2>
            </div>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" opacity="0.7">
              <rect x="4" y="2" width="16" height="20" rx="2" />
              <line x1="8" y1="6" x2="16" y2="6" />
              <line x1="8" y1="10" x2="10" y2="10" />
              <line x1="12" y1="10" x2="14" y2="10" />
              <line x1="8" y1="14" x2="10" y2="14" />
              <line x1="12" y1="14" x2="14" y2="14" />
              <line x1="8" y1="18" x2="10" y2="18" />
              <line x1="12" y1="18" x2="14" y2="18" />
            </svg>
          </div>

          {/* SALVA */}
          <button
            onClick={salvaPreventivo}
            style={{ flex: 1, borderRadius: "22px", background: "#2491ff", color: "white", fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "14px 12px", border: "none", cursor: "pointer" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
            <span style={{ fontSize: "15px", lineHeight: 1.2, textAlign: "center" }}>SALVA<br />PREVENTIVO</span>
          </button>

        </div>
      </div>

    </div>
  );
}
