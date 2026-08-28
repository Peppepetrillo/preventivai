export const CANTIERE_SEGMENTI = [
  { id: "operativo", etichetta: "Lavoro" },
  { id: "giornate", etichetta: "Giornate" },
  { id: "economico", etichetta: "Pagamenti" },
  { id: "documenti", etichetta: "Diario" },
];

export default function CantiereSegmentBar({ tabAttivo, onCambiaTab }) {
  return (
    <div
      className="grid grid-cols-4 gap-2 mb-4"
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
            className={`ds-chip min-h-[44px] w-full text-center ${attivo ? "ds-chip-active" : ""}`}
            data-testid={`cantiere-tab-${voce.id}`}
          >
            {voce.etichetta}
          </button>
        );
      })}
    </div>
  );
}
