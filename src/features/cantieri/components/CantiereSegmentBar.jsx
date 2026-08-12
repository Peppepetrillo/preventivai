export const CANTIERE_SEGMENTI = [
  { id: "operativo", etichetta: "Operativo" },
  { id: "economico", etichetta: "Economico" },
  { id: "documenti", etichetta: "Documenti" },
  { id: "impostazioni", etichetta: "Impostazioni" },
];

export default function CantiereSegmentBar({ tabAttivo, onCambiaTab }) {
  return (
    <div
      className="flex gap-2 mb-4 overflow-x-auto pb-0.5"
      role="tablist"
      aria-label="Sezioni cantiere"
    >
      {CANTIERE_SEGMENTI.map((voce) => {
        const attivo = tabAttivo === voce.id;
        return (
          <button
            key={voce.id}
            type="button"
            role="tab"
            aria-selected={attivo}
            onClick={() => onCambiaTab(voce.id)}
            className={`ds-chip min-h-[44px] ${attivo ? "ds-chip-active" : ""}`}
            data-testid={`cantiere-tab-${voce.id}`}
          >
            {voce.etichetta}
          </button>
        );
      })}
    </div>
  );
}
