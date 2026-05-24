import { useParams } from "react-router-dom";
import { useState } from "react";
import jsPDF from "jspdf";

export default function DettaglioPreventivo() {

  const { id } = useParams();

  const archivio = JSON.parse(localStorage.getItem("archivioPreventivi")) || [];
  const indicePreventivo = archivio.findIndex((p) => p.id === Number(id));
  const preventivo = archivio[indicePreventivo];

  const datiAzienda = JSON.parse(localStorage.getItem("datiAzienda")) || {};

  if (!preventivo) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Preventivo non trovato
      </div>
    );
  }

  const [cliente, setCliente] = useState(preventivo.cliente || "");
  const [stato, setStato] = useState(preventivo.stato || "Bozza");
  const [lavorazioni, setLavorazioni] = useState(preventivo.lavorazioni || []);

  const totale = lavorazioni.reduce(
    (acc, item) => acc + item.prezzo * item.quantita,
    0
  );

  function aggiornaQuantita(index, valore) {
    setLavorazioni(
      lavorazioni.map((item, i) =>
        i === index ? { ...item, quantita: Number(valore) } : item
      )
    );
  }

  function aggiornaPrezzo(index, valore) {
    setLavorazioni(
      lavorazioni.map((item, i) =>
        i === index ? { ...item, prezzo: Number(valore) } : item
      )
    );
  }

  function eliminaLavorazione(index) {
    setLavorazioni(lavorazioni.filter((_, i) => i !== index));
  }

  function salvaModifiche() {
    archivio[indicePreventivo] = {
      ...preventivo,
      cliente,
      stato,
      lavorazioni,
      totale,
    };
    localStorage.setItem("archivioPreventivi", JSON.stringify(archivio));
    alert("Preventivo aggiornato 😄🔥");
  }

  function duplicaPreventivo() {
    const nuovoPreventivo = {
      ...preventivo,
      id: Date.now(),
      cliente: cliente + " COPIA",
      stato: "Bozza",
      data: new Date().toLocaleDateString(),
    };
    archivio.push(nuovoPreventivo);
    localStorage.setItem("archivioPreventivi", JSON.stringify(archivio));
    alert("Preventivo duplicato 😄🔥");
  }

  function generaPDF() {
    const doc = new jsPDF();

    doc.setFillColor(10, 18, 40);
    doc.rect(0, 0, 210, 40, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.text(datiAzienda.nomeDitta || "PreventivAI", 20, 25);

    doc.setFontSize(11);
    doc.text(`Telefono: ${datiAzienda.telefono || ""}`, 20, 50);
    doc.text(`Email: ${datiAzienda.email || ""}`, 20, 57);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(24);
    doc.text("PREVENTIVO", 20, 80);

    doc.setFontSize(13);
    doc.text(`Cliente: ${cliente}`, 20, 95);
    doc.text(`Data: ${preventivo.data}`, 20, 103);
    doc.text(`Stato: ${stato}`, 20, 111);

    let y = 130;

    doc.setFillColor(230, 230, 230);
    doc.rect(20, y, 170, 10, "F");
    doc.setFontSize(12);
    doc.text("Descrizione", 22, y + 7);
    doc.text("Qtà", 115, y + 7);
    doc.text("Prezzo", 140, y + 7);
    doc.text("Totale", 170, y + 7);

    y += 18;

    lavorazioni.forEach((item) => {
      const totaleRiga = item.quantita * item.prezzo;
      doc.text(item.nome, 22, y);
      doc.text(String(item.quantita), 118, y);
      doc.text(`€ ${item.prezzo}`, 140, y);
      doc.text(`€ ${totaleRiga}`, 170, y);
      y += 10;
    });

    y += 20;

    doc.setFillColor(16, 185, 129);
    doc.roundedRect(20, y, 170, 20, 5, 5, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text(`TOTALE: € ${totale}`, 25, y + 13);

    doc.save(`preventivo-${cliente}.pdf`);
  }

  return (
    <div className="min-h-screen px-5 pt-8 pb-32 text-white bg-[#060816]">

      <div className="mb-8">
        <h1 className="text-4xl font-black tracking-tight">Dettaglio Preventivo</h1>
        <p className="text-slate-400 mt-2">Gestisci preventivo e lavorazioni</p>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-[32px] p-5 mb-8 space-y-5">
        <div>
          <p className="text-slate-400 text-sm mb-2">Cliente</p>
          <input
            type="text"
            value={cliente}
            onChange={(e) => setCliente(e.target.value)}
            className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 outline-none"
          />
        </div>
        <div>
          <p className="text-slate-400 text-sm mb-2">Stato</p>
          <select
            value={stato}
            onChange={(e) => setStato(e.target.value)}
            className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 outline-none"
          >
            <option>Bozza</option>
            <option>Inviato</option>
            <option>Accettato</option>
            <option>Completato</option>
          </select>
        </div>
      </div>

      <div className="space-y-4 mb-8">
        {lavorazioni.map((item, index) => (
          <div
            key={item.id}
            className="bg-white/5 border border-white/10 rounded-[28px] p-5"
          >
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-xl font-bold">{item.nome}</h2>
              <button
                onClick={() => eliminaLavorazione(index)}
                className="text-red-400 text-xl"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-slate-400 text-sm mb-1">Prezzo €</p>
                <input
                  type="number"
                  value={item.prezzo}
                  onChange={(e) => aggiornaPrezzo(index, e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 outline-none"
                />
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-1">Quantità</p>
                <input
                  type="number"
                  value={item.quantita}
                  onChange={(e) => aggiornaQuantita(index, e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 outline-none"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4 mb-8">
        <button
          onClick={salvaModifiche}
          className="w-full bg-blue-600 rounded-[28px] p-5 text-xl font-bold"
        >
          Salva Modifiche
        </button>
        <button
          onClick={duplicaPreventivo}
          className="w-full bg-orange-500 rounded-[28px] p-5 text-xl font-bold"
        >
          Duplica Preventivo
        </button>
        <button
          onClick={generaPDF}
          className="w-full bg-emerald-500 rounded-[28px] p-5 text-xl font-bold"
        >
          Scarica PDF
        </button>
      </div>

      <div className="bg-gradient-to-r from-green-500 to-emerald-400 rounded-[32px] p-6">
        <p className="text-lg opacity-90">Totale</p>
        <h2 className="text-5xl font-black mt-2">€ {totale}</h2>
      </div>

    </div>
  );
}
