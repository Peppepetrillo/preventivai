import { HardHat, Plus } from "lucide-react";

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

      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto]">
        <input
          value={cantiere.nome}
          onChange={(event) => onAggiornaCampo("nome", event.target.value)}
          placeholder="Nome cantiere"
          className="input-pro py-3 text-[16px]"
          aria-label="Nome cantiere"
          autoComplete="off"
        />
        <input
          value={cantiere.cliente}
          onChange={(event) => onAggiornaCampo("cliente", event.target.value)}
          placeholder="Cliente"
          className="input-pro py-3 text-[16px]"
          aria-label="Cliente"
          autoComplete="organization"
        />
        <input
          value={cantiere.indirizzo}
          onChange={(event) => onAggiornaCampo("indirizzo", event.target.value)}
          placeholder="Indirizzo"
          className="input-pro py-3 text-[16px] sm:col-span-2 lg:col-span-1"
          aria-label="Indirizzo"
          autoComplete="street-address"
        />
        <button
          type="button"
          onClick={onCreaCantiere}
          className="btn-primary min-h-[48px] px-5 py-3 flex items-center justify-center gap-2 text-sm font-black sm:col-span-2 lg:col-span-1"
        >
          <Plus size={18} aria-hidden="true" />
          Crea
        </button>
      </div>
    </section>
  );
}
