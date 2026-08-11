import { useMemo, useState } from "react";
import { Check, ClipboardList } from "lucide-react";

import BottomSheet from "../../../components/BottomSheet";
import SearchInput from "../../../components/SearchInput";

/**
 * Sheet: ricerca e selezione distinta da collegare a un preventivo.
 */
export default function CollegaDistintaSheet({
  open,
  onClose,
  distinte = [],
  distintaSelezionataId = null,
  onConferma,
  ricerca = "",
  onRicerca,
}) {
  const [selezionataId, setSelezionataId] = useState(null);

  const attivaId = selezionataId || distintaSelezionataId;
  const selezionata = useMemo(
    () => distinte.find((d) => String(d.id) === String(attivaId || "")),
    [distinte, attivaId]
  );

  function conferma() {
    if (!selezionata?.id) return;
    onConferma?.(selezionata.id);
  }

  return (
    <BottomSheet
      open={open}
      onClose={() => {
        setSelezionataId(null);
        onClose?.();
      }}
      title="Collega distinta"
      descrizione="La distinta resta autonoma: non diventa una riga economica del preventivo."
    >
      <div className="space-y-3 pb-2">
        <SearchInput
          label="Cerca distinta"
          placeholder="Cerca per titolo o cliente..."
          value={ricerca}
          onChange={(e) => onRicerca?.(e.target.value)}
        />

        {distinte.length === 0 ? (
          <p className="ds-text-secondary text-sm text-center py-6">
            Nessuna distinta trovata. Creane una da Distinte materiali.
          </p>
        ) : (
          <ul className="space-y-2" role="list" data-testid="collega-distinta-lista">
            {distinte.map((d) => {
              const attivo = String(d.id) === String(attivaId || "");
              return (
                <li key={d.id}>
                  <button
                    type="button"
                    onClick={() => setSelezionataId(d.id)}
                    className={`flex min-h-[56px] w-full items-start gap-3 rounded-[16px] border px-4 py-3 text-left ${
                      attivo
                        ? "border-yellow-300/40 bg-yellow-400/10"
                        : "border-white/10 bg-black/30"
                    }`}
                    data-testid={`collega-distinta-${d.id}`}
                  >
                    <ClipboardList
                      size={18}
                      aria-hidden="true"
                      className="text-yellow-300 shrink-0 mt-1"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="ds-text-primary block truncate">
                        {d.titolo || "Senza titolo"}
                      </span>
                      <span className="ds-text-secondary text-sm block">
                        {d.nVoci} {d.nVoci === 1 ? "materiale" : "materiali"}
                        {d.clienteNome ? ` · ${d.clienteNome}` : ""}
                      </span>
                      {d.collegataAltrove ? (
                        <span className="ds-text-secondary text-xs block mt-1 text-amber-200">
                          Già collegata a un altro preventivo (verrà riassegnata)
                        </span>
                      ) : null}
                    </span>
                    {attivo ? (
                      <Check
                        size={18}
                        aria-hidden="true"
                        className="text-yellow-300 shrink-0 mt-1"
                      />
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <button
          type="button"
          disabled={!selezionata}
          onClick={conferma}
          className="btn-primary w-full min-h-[52px] font-bold disabled:opacity-50"
          data-testid="collega-distinta-conferma"
        >
          Conferma collegamento
        </button>
      </div>
    </BottomSheet>
  );
}
