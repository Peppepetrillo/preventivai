import { memo } from "react";

import RigaListino from "./RigaListino";
import { quantitaDaMappa } from "../utils/listinoGrouping";

function PiuUsatiListino({ voci, quantitaPerVoce, onAggiungiVoce }) {
  if (!voci?.length) return null;

  return (
    <section className="space-y-2" aria-label="Lavorazioni più usate">
      <p className="text-xs font-bold uppercase text-slate-500 px-1">
        <span aria-hidden="true">⭐ </span>
        Più usati
      </p>
      <div className="pro-panel p-2 space-y-1">
        {voci.map((voce) => (
          <RigaListino
            key={`piu-usato-${voce.id || voce.nome}`}
            voce={voce}
            compatto
            quantita={quantitaDaMappa(quantitaPerVoce, voce)}
            onAggiungi={onAggiungiVoce}
          />
        ))}
      </div>
    </section>
  );
}

export default memo(PiuUsatiListino);
