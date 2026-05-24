import { useParams } from "react-router-dom";
import { useState } from "react";
import jsPDF from "jspdf";
import { leggiStorage, salvaStorage } from "../utils/storage";

export default function DettaglioPreventivo() {

  const { id } = useParams();

  const archivio = leggiStorage("archivioPreventivi", []);

  const indicePreventivo = archivio.findIndex(
    (p) => String(p.id) === String(id)
  );

  const preventivo = archivio[indicePreventivo];

  const datiAzienda = leggiStorage("datiAzienda", {});

  if (!preventivo) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-[#060816]">
        Preventivo non trovato
      </div>
    );
  }

  const [cliente, setCliente] = useState(preventivo.cliente || "");
  const [stato, setStato] = useState(preventivo.stato || "Bozza");
  const [lavorazioni, setLavorazioni] = useState(
    preventivo.lavorazioni || []
  );

  const totale = lavorazioni.reduce(
    (acc, item) => acc + item.prezzo * item.quantita,
    0
  );

  function aggiornaQuantita(index, valore) {

    setLavorazioni(
      lavorazioni.map((item, i) =>
        i === index
          ? {
              ...item,
              quantita: Number(valore),
            }
          : item
      )
    );
  }

  function aggiornaPrezzo(index, valore) {

    setLavorazioni(
      lavorazioni.map((item, i) =>
        i === index
          ? {
              ...item,
              prezzo: Number(valore),
            }
          : item
      )
    );
  }

  function eliminaLavorazione(index) {
    setLavorazioni(
      lavorazioni.filter((_, i) => i !== index)
    );
  }

  function salvaModifiche() {

    archivio[indicePreventivo] = {
      ...preventivo,
      cliente,
      stato: stato || "Bozza",
      lavorazioni,
      totale,
    };

    salvaStorage("archivioPreventivi", archivio);

    window.dispatchEvent(
      new Event("preventivi-aggiornati")
    );

    alert("Preventivo aggiornato 😄🔥");
  }

  function duplicaPreventivo() {

    const nuovoPreventivo = {
      ...preventivo,
      id: Date.now(),
      cliente: `${cliente} COPIA`,
      stato: "Bozza",
      data: new Date().toLocaleDateString(),
    };

    archivio.push(nuovoPreventivo);

    salvaStorage("archivioPreventivi", archivio);

    window.dispatchEvent(
      new Event("preventivi-aggiornati")
    );

    alert("Preventivo duplicato 😄🔥");
  }

  function generaPDF() {

    const doc = new jsPDF();

    doc.setFillColor(10, 18, 40);
    doc.rect(0, 0, 210, 40, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);

    doc.text(
      datiAzienda.nomeDitta || "PreventivAI",
      20,
      25
    );

    doc.setFontSize(11);

    doc.text(
      `Telefono: ${datiAzienda.telefono || ""}`,
      20,
      50
    );

    doc.text(
      `Email: ${datiAzienda.email || ""}`,
      20,
      57
    );

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

      if (y > 270) {
        doc.addPage();
        y = 20;
      }

      const totaleRiga = item.quantita * item.prezzo;

      doc.text(item.nome || "Lavorazione", 22, y);
      doc.text(String(item.quantita || 0), 118, y);
      doc.text(`€ ${item.prezzo || 0}`, 140, y);
      doc.text(`€ ${totaleRiga}`, 170, y);

      y += 10;
    });

    y += 20;

    if (y > 260) {
      doc.addPage();
      y = 20;
    }

    doc.setFillColor(16, 185, 129);

    doc.roundedRect(
      20,
      y,
      170,
      20,
      5,
      5,
      "F"
    );

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);

    doc.text(
      `TOTALE: € ${totale}`,
      25,
      y + 13
    );

    doc.save(`preventivo-${cliente}.pdf`);
  }

  return (
    <div className="min-h-screen px-5 pt-8 pb-32 text-white bg-[#060816]">

      <div className="mb-8">
        <h1 className="text-4xl font-black tracking-tight">
          Dettaglio Preventivo
        </h1>

        <p className="text-slate-400 mt-2">
          Gestisci preventivo e lavorazioni
        </p>
      </div>

    </div>
  );
}