import { useMemo, useState } from "react";
import {
  ClipboardCheck,
  Copy,
  MapPin,
  Minus,
  Plus,
  Save,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { leggiStorage, salvaStorage } from "../utils/storage";

const punti = [
  { id: "prese", label: "Prese", valore: 0 },
  { id: "puntiLuce", label: "Punti luce", valore: 0 },
  { id: "interruttori", label: "Interruttori", valore: 0 },
  { id: "linee", label: "Linee dedicate", valore: 0 },
];

const controlli = [
  "Quadro elettrico accessibile",
  "Messa a terra da verificare",
  "Tracce o canaline previste",
  "Foto e misure raccolte",
];

export default function Sopralluogo() {
  const [cliente, setCliente] = useState("");
  const [indirizzo, setIndirizzo] = useState("");
  const [note, setNote] = useState("");
  const [conteggi, setConteggi] = useState(punti);
  const [checklist, setChecklist] = useState([]);
  const [messaggio, setMessaggio] = useState("");

  const totalePunti = useMemo(
    () => conteggi.reduce((acc, item) => acc + Number(item.valore || 0), 0),
    [conteggi]
  );

  function aggiornaConteggio(id, delta) {
    setConteggi(
      conteggi.map((item) =>
        item.id === id
          ? { ...item, valore: Math.max(0, Number(item.valore || 0) + delta) }
          : item
      )
    );
  }

  function cambiaChecklist(voce) {
    setChecklist((attuali) =>
      attuali.includes(voce)
        ? attuali.filter((item) => item !== voce)
        : [...attuali, voce]
    );
  }

  function generaRiepilogo() {
    const righeConteggi = conteggi
      .map((item) => `${item.label}: ${item.valore}`)
      .join("\n");

    return [
      `Sopralluogo: ${cliente || "Cliente non indicato"}`,
      `Indirizzo: ${indirizzo || "-"}`,
      `Punti totali stimati: ${totalePunti}`,
      righeConteggi,
      `Controlli: ${checklist.length ? checklist.join(", ") : "-"}`,
      `Note: ${note || "-"}`,
    ].join("\n");
  }

  async function copiaRiepilogo() {
    try {
      await navigator.clipboard.writeText(generaRiepilogo());
      setMessaggio("Riepilogo copiato.");
    } catch {
      setMessaggio("Copia non disponibile in questo browser. Il riepilogo resta visibile.");
    }
  }

  function salvaSopralluogo() {
    const sopralluoghi = leggiStorage("sopralluoghi", []);
    salvaStorage("sopralluoghi", [
      ...sopralluoghi,
      {
        id: new Date().getTime(),
        cliente,
        indirizzo,
        note,
        conteggi,
        checklist,
        data: new Date().toLocaleDateString("it-IT"),
      },
    ]);
    setMessaggio("Sopralluogo salvato in locale.");
  }

  return (
    <div className="pro-page text-white">
      <div className="mb-6 pro-panel-strong p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="section-label">Rilievo in campo</p>
            <h1 className="text-3xl sm:text-4xl font-black mt-1">
              Sopralluogo
            </h1>
            <p className="text-slate-400 mt-2 max-w-2xl">
              Raccogli dati tecnici prima del preventivo, senza perdere pezzi tra messaggi e appunti.
            </p>
          </div>

          <div className="w-14 h-14 rounded-[16px] bg-yellow-400 text-slate-950 flex items-center justify-center shrink-0">
            <ClipboardCheck size={28} />
          </div>
        </div>
      </div>

      {messaggio && (
        <div className="mb-4 pro-panel p-4 text-yellow-100 border-yellow-300/30">
          {messaggio}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <section className="space-y-4">
          <div className="pro-panel p-5 space-y-4">
            <div className="flex items-center gap-3">
              <MapPin size={21} className="text-yellow-300" />
              <h2 className="text-xl font-black">Dati intervento</h2>
            </div>

            <input
              value={cliente}
              onChange={(event) => setCliente(event.target.value)}
              placeholder="Cliente o cantiere"
              className="input-pro"
            />
            <input
              value={indirizzo}
              onChange={(event) => setIndirizzo(event.target.value)}
              placeholder="Indirizzo"
              className="input-pro"
            />
          </div>

          <div className="pro-panel p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-black">Conteggi rapidi</h2>
              <span className="text-sm text-slate-400">{totalePunti} punti</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {conteggi.map((item) => (
                <div
                  key={item.id}
                  className="rounded-[16px] border border-white/10 bg-black/[0.18] p-4"
                >
                  <p className="text-slate-300 font-bold">{item.label}</p>
                  <div className="flex items-center justify-between mt-3">
                    <button
                      onClick={() => aggiornaConteggio(item.id, -1)}
                      className="w-11 h-11 rounded-[12px] bg-white/[0.08] border border-white/10 flex items-center justify-center"
                      aria-label={`Riduci ${item.label}`}
                    >
                      <Minus size={18} />
                    </button>
                    <span className="text-3xl font-black">{item.valore}</span>
                    <button
                      onClick={() => aggiornaConteggio(item.id, 1)}
                      className="w-11 h-11 rounded-[12px] bg-yellow-400 text-slate-950 flex items-center justify-center"
                      aria-label={`Aumenta ${item.label}`}
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pro-panel p-5">
            <h2 className="text-xl font-black mb-4">Note tecniche</h2>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows="6"
              placeholder="Misure, vincoli, urgenze, materiale particolare, accesso al quadro..."
              className="input-pro resize-none"
            />
          </div>
        </section>

        <aside className="space-y-4">
          <div className="pro-panel p-5">
            <div className="flex items-center gap-3 mb-4">
              <ShieldCheck size={21} className="text-emerald-300" />
              <h2 className="text-xl font-black">Checklist</h2>
            </div>

            <div className="space-y-3">
              {controlli.map((voce) => (
                <label
                  key={voce}
                  className="flex items-center gap-3 rounded-[14px] border border-white/10 bg-black/[0.18] p-3"
                >
                  <input
                    type="checkbox"
                    checked={checklist.includes(voce)}
                    onChange={() => cambiaChecklist(voce)}
                    className="w-5 h-5 accent-yellow-400"
                  />
                  <span className="text-sm text-slate-200">{voce}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="pro-panel-strong p-5">
            <div className="flex items-center gap-3 mb-3">
              <Zap size={21} className="text-yellow-300" />
              <h2 className="text-xl font-black">Riepilogo</h2>
            </div>
            <pre className="whitespace-pre-wrap text-sm text-slate-300 bg-black/[0.24] rounded-[14px] p-4 min-h-44">
              {generaRiepilogo()}
            </pre>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <button
                onClick={copiaRiepilogo}
                className="btn-secondary h-12 flex items-center justify-center gap-2"
              >
                <Copy size={18} />
                Copia
              </button>
              <button
                onClick={salvaSopralluogo}
                className="btn-primary h-12 flex items-center justify-center gap-2"
              >
                <Save size={18} />
                Salva
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
