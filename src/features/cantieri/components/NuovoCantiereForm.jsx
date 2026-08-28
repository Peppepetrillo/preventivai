import { HardHat, Plus } from "lucide-react";

import { TIPI_INTERVENTO } from "../cantieriDomain";

export default function NuovoCantiereForm({
  cantiere,
  onAggiornaCampo,
  onCreaCantiere,
  compatto = false,
}) {
  return (
    <section className={compatto ? "space-y-3" : "pro-panel p-5 mb-5"}>
      {!compatto ? (
        <div className="flex items-center gap-3 mb-4">
          <HardHat size={24} className="text-yellow-300" aria-hidden="true" />
          <h2 className="text-xl font-black">Nuovo cantiere</h2>
        </div>
      ) : null}

      <fieldset>
        <legend className="ds-text-secondary text-xs font-bold uppercase tracking-wide mb-2">
          Tipo intervento
        </legend>
        <div className="flex flex-wrap gap-2" data-testid="nuovo-cantiere-tipi">
          {TIPI_INTERVENTO.map((tipo) => {
            const attivo = (cantiere.tipoIntervento || "Riparazione") === tipo;
            return (
              <button
                key={tipo}
                type="button"
                onClick={() => onAggiornaCampo("tipoIntervento", tipo)}
                className={`min-h-[44px] px-3 rounded-[14px] text-sm font-bold border ${
                  attivo
                    ? "border-yellow-400 bg-yellow-400/20 text-yellow-100"
                    : "border-white/10 bg-black/20 text-slate-300"
                }`}
              >
                {tipo}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="grid gap-2.5 sm:grid-cols-2">
        <input
          value={cantiere.nome}
          onChange={(event) => onAggiornaCampo("nome", event.target.value)}
          placeholder="Nome lavoro"
          className="input-pro py-3 text-[16px] min-h-[48px]"
          aria-label="Nome lavoro"
          autoComplete="off"
        />
        <input
          value={cantiere.cliente}
          onChange={(event) => onAggiornaCampo("cliente", event.target.value)}
          placeholder="Cliente"
          className="input-pro py-3 text-[16px] min-h-[48px]"
          aria-label="Cliente"
          autoComplete="organization"
        />
        <input
          value={cantiere.indirizzo}
          onChange={(event) => onAggiornaCampo("indirizzo", event.target.value)}
          placeholder="Indirizzo"
          className="input-pro py-3 text-[16px] min-h-[48px] sm:col-span-2"
          aria-label="Indirizzo"
          autoComplete="street-address"
        />
        <textarea
          value={cantiere.descrizioneIntervento || ""}
          onChange={(event) =>
            onAggiornaCampo("descrizioneIntervento", event.target.value)
          }
          placeholder="Descrizione iniziale (opzionale)"
          rows={3}
          className="input-pro py-3 text-[16px] min-h-[72px] resize-none sm:col-span-2"
          aria-label="Descrizione iniziale"
        />
        <button
          type="button"
          onClick={onCreaCantiere}
          className="btn-primary min-h-[48px] px-5 py-3 flex items-center justify-center gap-2 text-sm font-black sm:col-span-2"
          data-testid="nuovo-cantiere-crea"
        >
          <Plus size={18} aria-hidden="true" />
          Crea lavoro
        </button>
      </div>
    </section>
  );
}
