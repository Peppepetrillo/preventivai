import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Copy, Download, Save, Trash2 } from "lucide-react";
import jsPDF from "jspdf";
import { leggiStorage, salvaStorage } from "../utils/storage";
import {
  calcolaTotali,
  creaNumeroPreventivo,
  formatEuro,
} from "../utils/preventivi";

export default function DettaglioPreventivo() {
  const { id } = useParams();
  const navigate = useNavigate();

  const archivio = leggiStorage("archivioPreventivi", []);
  const indicePreventivo = archivio.findIndex(
    (p) => String(p.id) === String(id)
  );
  const preventivo = archivio[indicePreventivo];
  const datiAzienda = leggiStorage("datiAzienda", {});

  const [cliente, setCliente] = useState(preventivo?.cliente || "");
  const [stato, setStato] = useState(preventivo?.stato || "Bozza");
  const [lavorazioni, setLavorazioni] = useState(
    preventivo?.lavorazioni || []
  );
  const [sconto, setSconto] = useState(preventivo?.sconto || 0);
  const [iva, setIva] = useState(preventivo?.iva ?? 22);
  const [note, setNote] = useState(preventivo?.note || "");

  const totali = calcolaTotali(lavorazioni, sconto, iva);

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

  function eliminaLavorazione(index) {
    setLavorazioni(lavorazioni.filter((_, i) => i !== index));
  }

  function datiAggiornati() {
    return {
      ...preventivo,
      cliente,
      stato: stato || "Bozza",
      lavorazioni,
      sconto: Number(sconto || 0),
      iva: Number(iva || 0),
      note,
      ...totali,
    };
  }

  function salvaModifiche() {
    const archivioAggiornato = archivio.map((item, index) =>
      index === indicePreventivo ? datiAggiornati() : item
    );

    salvaStorage("archivioPreventivi", archivioAggiornato);
    window.dispatchEvent(new Event("preventivi-aggiornati"));
    alert("Preventivo aggiornato.");
  }

  function duplicaPreventivo() {
    const nuovoPreventivo = {
      ...datiAggiornati(),
      id: new Date().getTime(),
      numero: creaNumeroPreventivo(archivio.length + 1),
      cliente: `${cliente} - copia`,
      stato: "Bozza",
      data: new Date().toLocaleDateString("it-IT"),
    };

    salvaStorage("archivioPreventivi", [...archivio, nuovoPreventivo]);
    window.dispatchEvent(new Event("preventivi-aggiornati"));
    alert("Preventivo duplicato.");
  }

  function eliminaPreventivo() {
    const conferma = window.confirm(
      `Eliminare definitivamente il preventivo ${
        preventivo.numero || `PREV-${preventivo.id}`
      }?`
    );

    if (!conferma) return;

    const archivioAggiornato = archivio.filter(
      (item) => String(item.id) !== String(preventivo.id)
    );

    salvaStorage("archivioPreventivi", archivioAggiornato);
    window.dispatchEvent(new Event("preventivi-aggiornati"));
    navigate("/archivio");
  }

  function scriviRigaPDF(doc, colonne, y) {
    doc.text(colonne.descrizione, 18, y);
    doc.text(String(colonne.quantita), 112, y, { align: "right" });
    doc.text(colonne.prezzo, 145, y, { align: "right" });
    doc.text(colonne.totale, 190, y, { align: "right" });
  }

  function generaPDF() {
    const doc = new jsPDF();
    const numero = preventivo.numero || `PREV-${preventivo.id}`;

    doc.setFillColor(7, 11, 20);
    doc.rect(0, 0, 210, 38, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);

    let intestazioneX = 18;
    if (datiAzienda.logo) {
      try {
        const formatoLogo = datiAzienda.logo.includes("image/jpeg")
          ? "JPEG"
          : "PNG";
        doc.addImage(datiAzienda.logo, formatoLogo, 16, 8, 22, 22);
        intestazioneX = 44;
      } catch {
        intestazioneX = 18;
      }
    }

    doc.text(datiAzienda.nomeDitta || "PreventivAI", intestazioneX, 24);

    doc.setFontSize(10);
    doc.text(`Tel. ${datiAzienda.telefono || "-"}`, 145, 16);
    doc.text(datiAzienda.email || "-", 145, 23);

    doc.setTextColor(20, 26, 38);
    doc.setFontSize(22);
    doc.text("Preventivo", 18, 58);

    doc.setFontSize(11);
    doc.text(`Numero: ${numero}`, 18, 70);
    doc.text(`Data: ${preventivo.data || "-"}`, 18, 78);
    doc.text(`Cliente: ${cliente}`, 18, 86);
    doc.text(`Stato: ${stato}`, 18, 94);

    let y = 112;

    doc.setFillColor(230, 236, 245);
    doc.rect(14, y - 8, 182, 10, "F");
    doc.setFontSize(10);
    scriviRigaPDF(
      doc,
      {
        descrizione: "Descrizione",
        quantita: "Qta",
        prezzo: "Prezzo",
        totale: "Totale",
      },
      y - 1
    );

    y += 10;
    doc.setFontSize(10);

    lavorazioni.forEach((item) => {
      if (y > 268) {
        doc.addPage();
        y = 22;
      }

      const totaleRiga = Number(item.quantita || 0) * Number(item.prezzo || 0);
      scriviRigaPDF(
        doc,
        {
          descrizione: String(item.nome || "Lavorazione").slice(0, 48),
          quantita: `${item.quantita || 0} ${item.unita || ""}`.trim(),
          prezzo: formatEuro(item.prezzo),
          totale: formatEuro(totaleRiga),
        },
        y
      );
      y += 9;
    });

    y += 8;
    if (y > 242) {
      doc.addPage();
      y = 24;
    }

    doc.setDrawColor(220, 226, 235);
    doc.line(120, y, 196, y);
    y += 9;

    doc.text("Subtotale", 124, y);
    doc.text(formatEuro(totali.subtotale), 190, y, { align: "right" });
    y += 8;

    doc.text(`Sconto ${sconto || 0}%`, 124, y);
    doc.text(`- ${formatEuro(totali.importoSconto)}`, 190, y, {
      align: "right",
    });
    y += 8;

    doc.text("Imponibile", 124, y);
    doc.text(formatEuro(totali.imponibile), 190, y, { align: "right" });
    y += 8;

    doc.text(`IVA ${iva || 0}%`, 124, y);
    doc.text(formatEuro(totali.importoIva), 190, y, { align: "right" });
    y += 12;

    doc.setFontSize(15);
    doc.setTextColor(0, 95, 180);
    doc.text("Totale", 124, y);
    doc.text(formatEuro(totali.totale), 190, y, { align: "right" });

    if (note) {
      y += 18;
      doc.setFontSize(10);
      doc.setTextColor(20, 26, 38);
      doc.text("Note", 18, y);
      doc.text(doc.splitTextToSize(note, 174), 18, y + 8);
    }

    doc.save(`${numero}-${cliente || "cliente"}.pdf`);
  }

  if (!preventivo) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Preventivo non trovato
      </div>
    );
  }

  return (
    <div className="pro-page text-white">
      <Link
        to="/archivio"
        className="text-slate-400 flex items-center gap-2 mb-5"
      >
        <ArrowLeft size={18} />
        Archivio
      </Link>

      <div className="mb-6 pro-panel-strong p-5">

        <p className="section-label">
          {preventivo.numero || `PREV-${preventivo.id}`}
        </p>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight mt-1">
          Dettaglio preventivo
        </h1>
        <p className="text-slate-400 mt-2">
          Modifica lavorazioni, stato, condizioni e documento PDF.
        </p>
      </div>

      <section className="pro-panel p-5 mb-5 space-y-4">
        <label className="block">
          <span className="text-sm text-slate-400">Cliente</span>
          <input
            value={cliente}
            onChange={(event) => setCliente(event.target.value)}
            className="mt-2 input-pro"
          />
        </label>

        <label className="block">
          <span className="text-sm text-slate-400">Stato</span>
          <select
            value={stato}
            onChange={(event) => setStato(event.target.value)}
            className="mt-2 input-pro"
          >
            <option>Bozza</option>
            <option>Inviato</option>
            <option>Accettato</option>
            <option>Completato</option>
          </select>
        </label>
      </section>

      <section className="space-y-4 mb-5">
        {lavorazioni.map((item, index) => (
          <div
            key={`${item.nome}-${index}`}
            className="pro-panel p-5"
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <input
                value={item.nome}
                onChange={(event) =>
                  aggiornaLavorazione(index, "nome", event.target.value)
                }
                className="w-full bg-transparent text-xl font-black outline-none"
              />

              <button
                onClick={() => eliminaLavorazione(index)}
                className="w-11 h-11 rounded-[14px] bg-red-500/20 text-red-200 flex items-center justify-center shrink-0"
                aria-label="Elimina lavorazione"
              >
                <Trash2 size={18} />
              </button>
            </div>

            <div className="grid grid-cols-[1fr_1fr_72px] gap-3">
              <label>
                <span className="text-xs text-slate-400">Quantità</span>
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

              <label>
                <span className="text-xs text-slate-400">Prezzo</span>
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

              <label>
                <span className="text-xs text-slate-400">Unità</span>
                <input
                  value={item.unita || "cad"}
                  onChange={(event) =>
                    aggiornaLavorazione(index, "unita", event.target.value)
                  }
                  className="mt-1 input-pro p-3"
                />
              </label>
            </div>
          </div>
        ))}
      </section>

      <section className="pro-panel p-5 mb-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <label>
            <span className="text-sm text-slate-400">Sconto %</span>
            <input
              type="number"
              min="0"
              value={sconto}
              onChange={(event) => setSconto(Number(event.target.value))}
              className="mt-2 input-pro"
            />
          </label>

          <label>
            <span className="text-sm text-slate-400">IVA %</span>
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
          <span className="text-sm text-slate-400">Note</span>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows="4"
            className="mt-2 input-pro resize-none"
          />
        </label>
      </section>

      <section className="pro-panel-strong p-6 mb-5">
        <p className="text-lg text-slate-300">Totale IVA incl.</p>
        <h2 className="text-5xl font-black mt-2">
          {formatEuro(totali.totale)}
        </h2>
        <div className="grid grid-cols-2 gap-2 text-sm mt-4 text-slate-400">
          <p>Imponibile {formatEuro(totali.imponibile)}</p>
          <p>IVA {formatEuro(totali.importoIva)}</p>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-3">
        <button
          onClick={salvaModifiche}
          className="w-full btn-primary p-5 text-lg flex items-center justify-center gap-2"
        >
          <Save size={20} />
          Salva modifiche
        </button>

        <button
          onClick={generaPDF}
          className="w-full btn-secondary p-5 text-lg flex items-center justify-center gap-2"
        >
          <Download size={20} />
          Genera PDF
        </button>

        <button
          onClick={duplicaPreventivo}
          className="w-full btn-secondary p-5 text-lg flex items-center justify-center gap-2"
        >
          <Copy size={20} />
          Duplica preventivo
        </button>

        <button
          onClick={eliminaPreventivo}
          className="w-full rounded-[14px] border border-red-400/25 bg-red-500/10 p-5 text-lg font-black text-red-100 flex items-center justify-center gap-2"
        >
          <Trash2 size={20} />
          Elimina preventivo
        </button>
      </div>
    </div>
  );
}
