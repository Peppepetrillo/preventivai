import { memo } from "react";

import { formatEuro } from "../../../utils/preventivi";

function etichettaAzione(voce, quantita) {
  const prezzo = formatEuro(voce.prezzo);

  if (quantita > 0) {
    return `Aumenta quantità di ${voce.nome}, attualmente ${quantita}, prezzo ${prezzo}`;
  }

  return `Aggiungi ${voce.nome}, prezzo ${prezzo}`;
}

function RigaListino({ voce, quantita = 0, onAggiungi, compatto = false }) {
  const haQuantita = quantita > 0;

  return (
    <button
      type="button"
      onClick={() => onAggiungi(voce)}
      className={`w-full flex items-center gap-3 text-left active:scale-[0.99] transition ${
        compatto ? "py-2.5 px-1" : "pro-panel px-3 py-3"
      } ${haQuantita && compatto ? "bg-yellow-400/8 rounded-[12px]" : ""}`}
      aria-label={etichettaAzione(voce, quantita)}
    >
      <div className="min-w-0 flex-1">
        <p
          className={`font-bold leading-tight truncate ${
            compatto ? "text-sm" : "text-base"
          }`}
        >
          {voce.nome}
        </p>
        <p className="text-xs text-yellow-300 font-bold mt-0.5">
          {formatEuro(voce.prezzo)}
          {voce.unita ? ` / ${voce.unita}` : ""}
        </p>
      </div>

      <div
        className={`shrink-0 min-w-[2rem] h-8 px-2 rounded-full flex items-center justify-center text-sm font-black ${
          haQuantita
            ? "bg-yellow-400 text-slate-950"
            : "bg-white/10 text-yellow-200"
        }`}
        aria-hidden="true"
      >
        {haQuantita ? quantita : "+"}
      </div>
    </button>
  );
}

function sonoUguali(precedente, successivo) {
  return (
    precedente.quantita === successivo.quantita &&
    precedente.compatto === successivo.compatto &&
    precedente.onAggiungi === successivo.onAggiungi &&
    precedente.voce.id === successivo.voce.id &&
    precedente.voce.nome === successivo.voce.nome &&
    precedente.voce.prezzo === successivo.voce.prezzo &&
    precedente.voce.unita === successivo.voce.unita
  );
}

export default memo(RigaListino, sonoUguali);
