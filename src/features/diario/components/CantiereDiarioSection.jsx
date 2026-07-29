import SearchInput from "../../../components/SearchInput";
import { useCantiereDiario } from "../hooks/useCantiereDiario";
import DiarioFilters from "./DiarioFilters";
import DiarioQuickNote from "./DiarioQuickNote";
import DiarioTimeline from "./DiarioTimeline";

export default function CantiereDiarioSection({
  cantiere,
  onAddManualNote,
  onOpenAttachment,
}) {
  const { filters, filtro, setFiltro, query, setQuery, gruppi } =
    useCantiereDiario(cantiere);

  return (
    <section className="pro-panel p-5 mb-5 scroll-mt-24" id="sezione-diario">
      <div className="mb-4">
        <p className="section-label">Memoria del lavoro</p>
        <h2 className="text-xl font-black mt-1">Diario</h2>
        <p className="text-sm text-slate-400 mt-1">
          Timeline cronologica di foto, note, materiali, checklist e pagamenti.
        </p>
      </div>

      <div className="space-y-4 mb-5">
        <DiarioQuickNote onAddNote={onAddManualNote} />
        <SearchInput
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          label="Cerca nel diario"
          placeholder="Cerca nel diario"
        />
        <DiarioFilters filters={filters} value={filtro} onChange={setFiltro} />
      </div>

      <DiarioTimeline groups={gruppi} onOpenAttachment={onOpenAttachment} />
    </section>
  );
}
