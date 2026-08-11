import AcquistiVoceRow from "./AcquistiVoceRow";

/**
 * Gruppo voci per lavoro/cantiere.
 */
export default function AcquistiGruppoLavoro({ gruppo, onToggleVoce }) {
  const titolo = [gruppo.cliente, gruppo.titoloLavoro]
    .filter(Boolean)
    .join(" — ");

  return (
    <section
      className="space-y-2"
      data-testid="acquisti-gruppo"
      data-lavoro-id={gruppo.lavoroId || "senza-lavoro"}
    >
      <h2 className="ds-card-title px-0.5">{titolo || "Senza lavoro"}</h2>
      <ul className="space-y-2" role="list">
        {(gruppo.voci || []).map((voce) => (
          <li key={voce.id}>
            <AcquistiVoceRow voce={voce} onToggle={onToggleVoce} />
          </li>
        ))}
      </ul>
    </section>
  );
}
