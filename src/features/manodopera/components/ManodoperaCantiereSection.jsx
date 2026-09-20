import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { MoreHorizontal, Plus, Pencil, Trash2 } from "lucide-react";

import BottomSheet from "../../../components/BottomSheet";
import ConfirmDialog from "../../../components/ConfirmDialog";
import { ROUTES } from "../../../app/routes";
import { useDatiLocaliSincronizzati } from "../../../hooks/useDatiLocaliSincronizzati";
import { leggiOperaiTutti } from "../../../repositories/operaiRepository";
import {
  leggiGiornateManodopera,
  raggruppaGiornatePerData,
  riepilogoManodoperaCantiere,
} from "../giornateManodoperaService";
import { nomeCompletoOperaio } from "../operaiDomain";
import GiornataManodoperaSheet from "./GiornataManodoperaSheet";

function formatEuro(n) {
  return Number(n || 0).toLocaleString("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });
}

/**
 * Sezione manodopera nel tab Giornate del cantiere.
 * Non scrive in spese[] / economia.
 */
export default function ManodoperaCantiereSection({
  cantiere,
  onAggiungi,
  onAggiorna,
  onElimina,
  onImpostaPagato,
}) {
  const [operai] = useDatiLocaliSincronizzati(leggiOperaiTutti);
  const [sheetAperto, setSheetAperto] = useState(false);
  const [inModifica, setInModifica] = useState(null);
  const [menuVoce, setMenuVoce] = useState(null);
  const [daEliminareId, setDaEliminareId] = useState(null);
  const [confermaElimina, setConfermaElimina] = useState(false);
  const busyRef = useRef(false);

  const giornate = useMemo(
    () => leggiGiornateManodopera(cantiere),
    [cantiere]
  );
  const gruppi = useMemo(() => raggruppaGiornatePerData(giornate), [giornate]);
  const riepilogo = useMemo(
    () => riepilogoManodoperaCantiere(cantiere),
    [cantiere]
  );

  const mappaOperai = useMemo(() => {
    const m = new Map();
    for (const o of operai || []) m.set(String(o.id), o);
    return m;
  }, [operai]);

  async function salvaGiornata(giornata) {
    if (busyRef.current) return { success: false };
    busyRef.current = true;
    try {
      if (inModifica?.id) {
        return onAggiorna?.(giornata.id, giornata);
      }
      return onAggiungi?.(giornata);
    } finally {
      busyRef.current = false;
    }
  }

  function togglePagato(voce) {
    if (busyRef.current || !voce) return;
    busyRef.current = true;
    try {
      onImpostaPagato?.(voce.id, !voce.pagato);
    } finally {
      // unlock next tick to block double-tap
      setTimeout(() => {
        busyRef.current = false;
      }, 350);
    }
  }

  return (
    <section
      className="pro-panel p-5 mb-5"
      data-testid="manodopera-cantiere-section"
      id="sezione-manodopera"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="ds-card-title">Manodopera</h2>
          <p className="ds-text-secondary text-sm mt-1">
            Giornate, costi e pagamenti operai su questo cantiere.
          </p>
        </div>
        <button
          type="button"
          className="btn-primary min-h-[48px] px-3 inline-flex items-center gap-1.5 text-sm font-semibold shrink-0"
          data-testid="manodopera-registra"
          onClick={() => {
            setInModifica(null);
            setSheetAperto(true);
          }}
        >
          <Plus size={18} aria-hidden="true" />
          Registra
        </button>
      </div>

      {riepilogo.giornate > 0 ? (
        <div
          className="mt-4 grid grid-cols-2 gap-3"
          data-testid="manodopera-cantiere-riepilogo"
        >
          <div className="rounded-[16px] bg-black/25 p-3">
            <p className="ds-text-secondary text-xs">Giornate</p>
            <p className="ds-text-primary mt-1">{riepilogo.giornate}</p>
          </div>
          <div className="rounded-[16px] bg-black/25 p-3">
            <p className="ds-text-secondary text-xs">Ore</p>
            <p className="ds-text-primary mt-1">{riepilogo.ore}</p>
          </div>
          <div className="rounded-[16px] bg-black/25 p-3">
            <p className="ds-text-secondary text-xs">Costo</p>
            <p className="ds-text-primary mt-1">{formatEuro(riepilogo.costo)}</p>
          </div>
          <div className="rounded-[16px] bg-black/25 p-3">
            <p className="ds-text-secondary text-xs">Da pagare</p>
            <p className="text-amber-200 mt-1 font-medium">
              {formatEuro(riepilogo.daPagare)}
            </p>
          </div>
        </div>
      ) : null}

      <p className="ds-text-secondary text-xs mt-3">
        Questi importi non entrano automaticamente nelle Spese/Economia (niente
        doppi conteggi).{" "}
        <Link to={ROUTES.operai} className="text-yellow-300 underline">
          Gestisci operai
        </Link>
      </p>

      {giornate.length === 0 ? (
        <div className="ds-empty mt-4 text-center" data-testid="manodopera-cantiere-vuoto">
          <p className="ds-text-secondary text-sm">
            Nessuna giornata registrata. Aggiungi chi ha lavorato e il costo.
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-5">
          {gruppi.map((gruppo) => (
            <div key={gruppo.data}>
              <h3 className="ds-text-secondary text-sm font-medium mb-2">
                {gruppo.etichetta}
              </h3>
              <ul className="space-y-2 list-none p-0 m-0">
                {gruppo.voci.map((voce) => {
                  const op = mappaOperai.get(String(voce.operaioId));
                  return (
                    <li
                      key={voce.id}
                      className="rounded-[16px] border border-white/10 bg-black/20 p-3"
                      data-testid="manodopera-giornata-card"
                    >
                      <div className="flex items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="ds-text-primary font-medium truncate">
                            {nomeCompletoOperaio(op)}
                          </p>
                          <p className="ds-text-secondary text-sm mt-1">
                            {voce.ore || 0}h · {formatEuro(voce.costo)}
                          </p>
                          <button
                            type="button"
                            className={`mt-2 text-sm font-medium min-h-[40px] ${
                              voce.pagato
                                ? "text-emerald-300"
                                : "text-amber-200"
                            }`}
                            data-testid="manodopera-toggle-pagato"
                            onClick={() => togglePagato(voce)}
                          >
                            {voce.pagato
                              ? "✅ Pagato — tocca per segnare da pagare"
                              : "⚠️ Da pagare — tocca per segnare pagato"}
                          </button>
                        </div>
                        <button
                          type="button"
                          className="btn-secondary min-h-[44px] min-w-[44px] px-2"
                          aria-label="Azioni giornata"
                          data-testid="manodopera-giornata-menu"
                          onClick={() => setMenuVoce(voce)}
                        >
                          <MoreHorizontal size={18} />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}

      <GiornataManodoperaSheet
        open={sheetAperto}
        cantiereId={cantiere?.id}
        operai={operai}
        giornata={inModifica}
        onClose={() => {
          setSheetAperto(false);
          setInModifica(null);
        }}
        onSalva={salvaGiornata}
      />

      <BottomSheet
        open={Boolean(menuVoce)}
        onClose={() => setMenuVoce(null)}
        title="Giornata"
      >
        <div className="flex flex-col gap-3 p-1">
          <button
            type="button"
            className="pro-panel p-4 flex items-center gap-3 min-h-[56px] text-left"
            onClick={() => {
              setInModifica(menuVoce);
              setMenuVoce(null);
              setSheetAperto(true);
            }}
          >
            <Pencil className="text-yellow-300" size={18} />
            <span className="ds-card-title">Modifica</span>
          </button>
          <button
            type="button"
            className="pro-panel p-4 flex items-center gap-3 min-h-[56px] text-left text-rose-200"
            onClick={() => {
              setDaEliminareId(menuVoce?.id || null);
              setConfermaElimina(true);
              setMenuVoce(null);
            }}
          >
            <Trash2 size={18} />
            <span className="ds-card-title">Elimina</span>
          </button>
        </div>
      </BottomSheet>

      <ConfirmDialog
        open={confermaElimina}
        title="Eliminare questa giornata?"
        description="L'operazione non può essere annullata."
        confirmLabel="Elimina"
        cancelLabel="Annulla"
        onConfirm={() => {
          const id = daEliminareId;
          setConfermaElimina(false);
          setDaEliminareId(null);
          if (id != null) onElimina?.(id);
        }}
        onCancel={() => {
          setConfermaElimina(false);
          setDaEliminareId(null);
        }}
        testId="conferma-elimina-giornata-manodopera"
      />
    </section>
  );
}
