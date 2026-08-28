import ProgrammazioneSection from "./ProgrammazioneSection";
import RegistroLavoriSection from "./RegistroLavoriSection";

/**
 * Tab Giornate: Previsto (programmazione) + Fatto (registro consuntivo).
 * UX-8.3/8.5 — solo UI; programmazione[] e registroGiornate[] invariati.
 */
export default function GiornateSection({
  cantiere,
  onAggiungiGiornata,
  onAggiornaGiornata,
  onEliminaGiornata,
  onAggiungiGiornataRegistro,
  onAggiornaGiornataRegistro,
  onEliminaGiornataRegistro,
}) {
  return (
    <div className="space-y-6">
      <p className="ds-text-secondary">
        Confronta i giorni previsti con il lavoro fatto su questo cantiere.
        L&apos;Agenda mostra invece tutta la giornata.
      </p>

      <ProgrammazioneSection
        cantiere={cantiere}
        onAggiungiGiornata={onAggiungiGiornata}
        onAggiornaGiornata={onAggiornaGiornata}
        onEliminaGiornata={onEliminaGiornata}
        onRegistraConsuntivo={onAggiungiGiornataRegistro}
      />

      <RegistroLavoriSection
        cantiere={cantiere}
        onAggiungi={onAggiungiGiornataRegistro}
        onAggiorna={onAggiornaGiornataRegistro}
        onElimina={onEliminaGiornataRegistro}
      />
    </div>
  );
}
