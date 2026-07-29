import { Plus } from "lucide-react";
import { useState } from "react";

export default function DiarioQuickNote({ onAddNote }) {
  const [aperto, setAperto] = useState(false);
  const [testo, setTesto] = useState("");

  function salvaNota() {
    const value = String(testo || "").trim();
    if (!value) return;
    onAddNote?.(value);
    setTesto("");
    setAperto(false);
  }

  return (
    <div className="space-y-3">
      {!aperto ? (
        <button
          type="button"
          onClick={() => setAperto(true)}
          className="btn-secondary w-full min-h-[48px] flex items-center justify-center gap-2 text-sm font-black"
        >
          <Plus size={18} />
          Nuova nota
        </button>
      ) : (
        <div className="rounded-[16px] border border-white/10 bg-black/[0.18] p-3.5 space-y-3">
          <textarea
            value={testo}
            onChange={(event) => setTesto(event.target.value)}
            rows={3}
            className="input-pro resize-none"
            placeholder="Cliente preferisce passare il corrugato nel controsoffitto."
          />
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setAperto(false)} className="btn-secondary py-3 font-bold">
              Annulla
            </button>
            <button type="button" onClick={salvaNota} className="btn-primary py-3 font-black">
              Salva nota
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
