import { memo } from "react";

import { CONTESTO_PREVENTIVO_SLOTS, creaContestoPreventivo } from "../contesto/contestoPreventivoModel";
import SerieCivileField, { ContestoPreventivoIcon } from "./SerieCivileField";

/**
 * Contesto Preventivo — contenitore estendibile in cima alla composizione.
 * Slot riservati documentati in CONTESTO_PREVENTIVO_SLOTS (non renderizzati).
 */
function ContestoPreventivo({ contesto, onAggiornaContesto }) {
  const contestoSicuro = contesto || creaContestoPreventivo();
  return (
    <section
      className="pro-panel px-3 py-3"
      aria-labelledby="contesto-preventivo-titolo"
      data-contesto-slots={CONTESTO_PREVENTIVO_SLOTS.map((s) => s.id).join(",")}
    >
      <div className="flex items-center gap-2 mb-3">
        <ContestoPreventivoIcon />
        <h2
          id="contesto-preventivo-titolo"
          className="text-[15px] font-semibold text-white"
        >
          Contesto Preventivo
        </h2>
      </div>

      <div className="space-y-2">
        <SerieCivileField
          contesto={contestoSicuro}
          onAggiornaContesto={onAggiornaContesto}
        />
        {/* Slot futuri: marca, livello, IVA, sconto, pagamento, garanzia */}
      </div>
    </section>
  );
}

export default memo(ContestoPreventivo);
