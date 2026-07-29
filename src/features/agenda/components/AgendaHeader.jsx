import AgendaGiornoNav from "./AgendaGiornoNav";
import AgendaFilters from "./AgendaFilters";

/**
 * Header Agenda: filtri vista + navigazione giorno.
 */
export default function AgendaHeader({
  vista,
  onCambiaVista,
  giorno,
  oggi,
  onGiornoPrecedente,
  onOggi,
  onGiornoSuccessivo,
  nascondiNavGiorno = false,
}) {
  return (
    <header className="mb-1">
      <AgendaFilters vista={vista} onCambiaVista={onCambiaVista} />
      {!nascondiNavGiorno ? (
        <AgendaGiornoNav
          giorno={giorno}
          oggi={oggi}
          onGiornoPrecedente={onGiornoPrecedente}
          onOggi={onOggi}
          onGiornoSuccessivo={onGiornoSuccessivo}
        />
      ) : (
        <div className="mb-5 text-center">
          <p className="section-label">Agenda</p>
          <h1 className="ds-page-title mt-0.5">Questa settimana</h1>
        </div>
      )}
    </header>
  );
}
