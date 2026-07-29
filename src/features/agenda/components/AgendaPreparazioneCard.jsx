import { AlertTriangle, Check } from "lucide-react";

export default function AgendaPreparazioneCard({ riepilogo }) {
  if (!riepilogo || riepilogo.interventi === 0) return null;

  const { etichetta, interventi, materiali } = riepilogo;
  const { daPortare, mancanti } = materiali;

  return (
    <section className="pro-panel-strong p-5 mb-5 ux-enter">
      <p className="section-label">{etichetta}</p>
      <h2 className="ds-card-title mt-1">
        {interventi === 1 ? "1 intervento" : `${interventi} interventi`}
      </h2>

      {daPortare.length > 0 && (
        <div className="mt-4">
          <p className="ds-text-secondary mb-2">Materiale da portare</p>
          <ul className="space-y-1.5">
            {daPortare.map((item) => (
              <li
                key={item.nome}
                className="flex items-center gap-2 ds-text-primary text-sm"
              >
                <Check size={14} className="text-emerald-400 shrink-0" />
                <span>
                  {item.quantita > 0 ? `${item.quantita} ${item.unita} ` : ""}
                  {item.nome}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {mancanti.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="ds-text-secondary mb-2 flex items-center gap-1.5 text-amber-200">
            <AlertTriangle size={14} />
            Mancano
          </p>
          <ul className="space-y-1.5">
            {mancanti.map((item) => (
              <li
                key={item.nome}
                className="flex items-center gap-2 text-sm text-amber-100"
              >
                <AlertTriangle size={14} className="shrink-0 text-amber-300" />
                <span>
                  {item.quantita > 0 ? `${item.quantita} ${item.unita} ` : ""}
                  {item.nome}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
