import { HardHat, Plus } from "lucide-react";

export default function NuovoCantiereForm({
  cantiere,
  onAggiornaCampo,
  onCreaCantiere,
}) {
  return (
    <section className="pro-panel p-5 mb-5">
      <div className="flex items-center gap-3 mb-4">
        <HardHat size={24} className="text-yellow-300" />
        <h2 className="text-xl font-black">Nuovo cantiere</h2>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_auto]">
        <input
          value={cantiere.nome}
          onChange={(event) => onAggiornaCampo("nome", event.target.value)}
          placeholder="Nome cantiere"
          className="input-pro"
        />
        <input
          value={cantiere.cliente}
          onChange={(event) => onAggiornaCampo("cliente", event.target.value)}
          placeholder="Cliente"
          className="input-pro"
        />
        <input
          value={cantiere.indirizzo}
          onChange={(event) => onAggiornaCampo("indirizzo", event.target.value)}
          placeholder="Indirizzo"
          className="input-pro"
        />
        <button
          onClick={onCreaCantiere}
          className="btn-primary px-5 py-4 flex items-center justify-center gap-2"
        >
          <Plus size={19} />
          Crea
        </button>
      </div>
    </section>
  );
}
