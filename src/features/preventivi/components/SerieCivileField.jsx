import { useCallback, useId, useState } from "react";
import { Check, ChevronDown, Layers, Pencil, Plus, Trash2 } from "lucide-react";

import BottomSheet from "../../../components/BottomSheet";
import { useSerieCivili } from "../contesto/useSerieCivili";

/**
 * Campo Serie civile — select + BottomSheet gestione catalogo.
 */
export default function SerieCivileField({ contesto, onAggiornaContesto }) {
  const baseId = useId();
  const [sheetAperto, setSheetAperto] = useState(false);
  const [modo, setModo] = useState("lista"); // lista | nuova | rinomina
  const [bozzaNome, setBozzaNome] = useState("");
  const [serieInModificaId, setSerieInModificaId] = useState("");

  const {
    serie,
    serieSelezionata,
    messaggio,
    setMessaggio,
    aggiungi,
    rinomina,
    elimina,
    idsInUso,
  } = useSerieCivili(contesto);

  const chiudiSheet = useCallback(() => {
    setSheetAperto(false);
    setModo("lista");
    setBozzaNome("");
    setSerieInModificaId("");
    setMessaggio("");
  }, [setMessaggio]);

  const seleziona = useCallback(
    (serieId) => {
      onAggiornaContesto?.({ serieCivileId: serieId });
      chiudiSheet();
    },
    [chiudiSheet, onAggiornaContesto]
  );

  function avviaNuova() {
    setModo("nuova");
    setBozzaNome("");
    setMessaggio("");
  }

  function avviaRinomina(voce) {
    setModo("rinomina");
    setSerieInModificaId(voce.id);
    setBozzaNome(voce.nome);
    setMessaggio("");
  }

  function confermaForm() {
    if (modo === "nuova") {
      const creata = aggiungi(bozzaNome);
      if (creata) {
        onAggiornaContesto?.({ serieCivileId: creata.id });
        setModo("lista");
        setBozzaNome("");
      }
      return;
    }

    if (modo === "rinomina") {
      const ok = rinomina(serieInModificaId, bozzaNome);
      if (ok) {
        setModo("lista");
        setBozzaNome("");
        setSerieInModificaId("");
      }
    }
  }

  function gestisciElimina(voce) {
    const inUsoCorrente =
      String(contesto?.serieCivileId) === String(voce.id);
    const inUsoAltrove = idsInUso.includes(String(voce.id));
    if (voce.system || inUsoCorrente || inUsoAltrove) return;
    elimina(voce.id);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setSheetAperto(true)}
        className="w-full flex items-center justify-between gap-3 min-h-[48px] px-3 py-2 rounded-[16px] border border-white/10 bg-white/[0.04] text-left transition-colors duration-150 hover:border-yellow-300/30"
        aria-haspopup="dialog"
        aria-expanded={sheetAperto}
      >
        <span className="min-w-0">
          <span className="block text-[12px] font-medium text-slate-500">
            Serie civile
          </span>
          <span className="block text-[15px] font-semibold text-white truncate mt-0.5">
            {serieSelezionata?.nome || "Seleziona"}
          </span>
        </span>
        <ChevronDown size={18} className="text-slate-400 shrink-0" aria-hidden="true" />
      </button>

      <BottomSheet
        open={sheetAperto}
        onClose={chiudiSheet}
        title="Serie civile"
        descrizione="Scegli o gestisci le serie del contesto preventivo."
      >
        {messaggio ? (
          <p className="mb-3 text-[14px] text-amber-200" role="status">
            {messaggio}
          </p>
        ) : null}

        {modo === "lista" ? (
          <div className="space-y-2">
            <ul className="space-y-1" role="listbox" aria-label="Serie civili">
              {serie.map((voce) => {
                const selezionata =
                  String(voce.id) === String(contesto?.serieCivileId);
                const bloccata =
                  Boolean(voce.system) ||
                  selezionata ||
                  idsInUso.includes(String(voce.id));

                return (
                  <li
                    key={voce.id}
                    className="flex items-center gap-1 rounded-[16px] border border-white/[0.06] bg-white/[0.03]"
                  >
                    <button
                      type="button"
                      role="option"
                      aria-selected={selezionata}
                      onClick={() => seleziona(voce.id)}
                      className="flex-1 min-w-0 min-h-[48px] px-3 py-2 text-left flex items-center gap-2"
                    >
                      <span className="truncate text-[15px] font-medium text-white">
                        {voce.nome}
                      </span>
                      {selezionata ? (
                        <Check
                          size={16}
                          className="text-yellow-300 shrink-0"
                          aria-hidden="true"
                        />
                      ) : null}
                    </button>

                    {!voce.system ? (
                      <>
                        <button
                          type="button"
                          onClick={() => avviaRinomina(voce)}
                          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400"
                          aria-label={`Rinomina ${voce.nome}`}
                        >
                          <Pencil size={15} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => gestisciElimina(voce)}
                          disabled={bloccata}
                          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-500 disabled:opacity-30"
                          aria-label={
                            bloccata
                              ? `Non eliminabile: ${voce.nome} in uso`
                              : `Elimina ${voce.nome}`
                          }
                        >
                          <Trash2 size={15} aria-hidden="true" />
                        </button>
                      </>
                    ) : null}
                  </li>
                );
              })}
            </ul>

            <button
              type="button"
              onClick={avviaNuova}
              className="w-full btn-secondary min-h-[48px] mt-3 flex items-center justify-center gap-2 text-[14px] font-semibold"
            >
              <Plus size={16} aria-hidden="true" />
              Nuova serie
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <label htmlFor={`${baseId}-nome`} className="block">
              <span className="text-[12px] font-medium text-slate-400">
                Nome serie
              </span>
              <input
                id={`${baseId}-nome`}
                type="text"
                value={bozzaNome}
                onChange={(event) => setBozzaNome(event.target.value)}
                placeholder="Es. Vimar Plana"
                className="input-pro mt-2"
                autoComplete="off"
              />
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setModo("lista");
                  setBozzaNome("");
                  setMessaggio("");
                }}
                className="flex-1 btn-secondary min-h-[48px] text-[14px] font-semibold"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={confermaForm}
                className="flex-1 btn-primary min-h-[48px] text-[14px] font-semibold"
              >
                Salva
              </button>
            </div>
          </div>
        )}
      </BottomSheet>
    </>
  );
}

/** Icona sezione contesto — riusabile */
export function ContestoPreventivoIcon() {
  return <Layers size={18} className="text-yellow-300" aria-hidden="true" />;
}
