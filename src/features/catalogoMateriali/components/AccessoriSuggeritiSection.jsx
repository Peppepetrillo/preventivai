import { useId, useState } from "react";
import { Link2, Plus, Trash2 } from "lucide-react";

import NumericInput from "../../../components/NumericInput";
import SelettoreMaterialeSheet from "../../distinteMateriali/components/SelettoreMaterialeSheet";
import {
  chiaveAccessorioSuggerito,
  risolviAccessoriSuggeritiValidi,
} from "../accessoriSuggeritiUi";

/**
 * Sezione "Va spesso con" — gestisce accessoriSuggeriti sul catalogo.
 */
export default function AccessoriSuggeritiSection({
  accessori = [],
  catalogo = [],
  onChange,
  escludiFamigliaId = "",
  escludiVarianteId = "",
  readOnly = false,
  nascondiSeVuoto = false,
}) {
  const titleId = useId();
  const [selettoreAperto, setSelettoreAperto] = useState(false);

  const risolti = risolviAccessoriSuggeritiValidi(accessori, catalogo, {
    escludiFamigliaId,
    escludiVarianteId,
  });

  if (nascondiSeVuoto && risolti.length === 0) {
    return null;
  }

  function aggiornaLista(prossima) {
    onChange?.(prossima);
  }

  function rimuovi(accessorio) {
    const chiave = chiaveAccessorioSuggerito(accessorio);
    aggiornaLista(
      (accessori || []).filter(
        (item) => chiaveAccessorioSuggerito(item) !== chiave
      )
    );
  }

  function aggiornaQuantita(accessorio, valore) {
    const qty = Number(valore);
    const quantitaPerUnita =
      Number.isFinite(qty) && qty > 0 ? qty : accessorio.quantitaPerUnita || 1;
    const chiave = chiaveAccessorioSuggerito(accessorio);
    aggiornaLista(
      (accessori || []).map((item) =>
        chiaveAccessorioSuggerito(item) === chiave
          ? { ...item, quantitaPerUnita }
          : item
      )
    );
  }

  function aggiungiDaCatalogo(payload) {
    if (!payload?.famigliaId && !payload?.varianteId) return;

    const nuovo = {
      famigliaId: payload.famigliaId || undefined,
      varianteId: payload.varianteId || undefined,
      quantitaPerUnita:
        Number.isFinite(Number(payload.quantita)) && Number(payload.quantita) > 0
          ? Number(payload.quantita)
          : 1,
      obbligatorio: false,
    };

    if (
      escludiVarianteId &&
      nuovo.varianteId &&
      String(nuovo.varianteId) === String(escludiVarianteId)
    ) {
      return;
    }
    if (
      escludiFamigliaId &&
      nuovo.famigliaId &&
      String(nuovo.famigliaId) === String(escludiFamigliaId)
    ) {
      return;
    }

    const chiave = chiaveAccessorioSuggerito(nuovo);
    const senzaDuplicati = (accessori || []).filter(
      (item) => chiaveAccessorioSuggerito(item) !== chiave
    );
    aggiornaLista([...senzaDuplicati, nuovo]);
  }

  return (
    <section
      className="space-y-3"
      aria-labelledby={titleId}
      data-testid="accessori-suggeriti-section"
    >
      <div className="flex items-center gap-2 px-1">
        <Link2 size={16} className="text-yellow-200 shrink-0" aria-hidden="true" />
        <h3 id={titleId} className="ds-card-title text-base">
          Va spesso con
        </h3>
      </div>

      <p className="ds-text-secondary text-sm px-1">
        Accessori tipici da suggerire in distinta.
      </p>

      {risolti.length === 0 ? (
        <div className="pro-panel px-4 py-3">
          <p className="ds-text-secondary text-sm">
            Nessun accessorio collegato.
          </p>
        </div>
      ) : (
        <ul className="space-y-2" role="list">
          {risolti.map(({ accessorio, titolo, sottotitolo }) => (
            <li
              key={chiaveAccessorioSuggerito(accessorio)}
              className="pro-panel px-3 py-3"
              data-testid="accessorio-suggerito-row"
            >
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="ds-text-primary truncate">{titolo}</p>
                  {sottotitolo ? (
                    <p className="ds-text-secondary text-xs mt-1">{sottotitolo}</p>
                  ) : null}
                </div>
                {!readOnly ? (
                  <button
                    type="button"
                    onClick={() => rimuovi(accessorio)}
                    className="w-11 h-11 rounded-[14px] bg-red-500/15 text-red-200 flex items-center justify-center shrink-0"
                    aria-label={`Rimuovi ${titolo}`}
                    data-testid="accessorio-rimuovi"
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                ) : null}
              </div>

              {!readOnly ? (
                <label className="mt-3 flex items-center gap-3">
                  <span className="ds-text-secondary text-xs shrink-0">
                    Qty ×
                  </span>
                  <NumericInput
                    className="w-24 min-h-[44px] rounded-[16px] border border-white/10 bg-black/30 px-3 text-white"
                    value={accessorio.quantitaPerUnita}
                    min={0.001}
                    onChange={(valore) => aggiornaQuantita(accessorio, valore)}
                    aria-label={`Quantità per unità di ${titolo}`}
                  />
                </label>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {!readOnly ? (
        <>
          <button
            type="button"
            onClick={() => setSelettoreAperto(true)}
            className="w-full btn-secondary min-h-[48px] flex items-center justify-center gap-2"
            data-testid="accessorio-aggiungi"
          >
            <Plus size={18} aria-hidden="true" />
            Aggiungi accessorio
          </button>

          <SelettoreMaterialeSheet
            open={selettoreAperto}
            onClose={() => setSelettoreAperto(false)}
            onConferma={aggiungiDaCatalogo}
            title="Aggiungi accessorio"
            descrizione="Scegli dal catalogo cosa va spesso insieme."
            labelConferma="Collega accessorio"
          />
        </>
      ) : null}
    </section>
  );
}
