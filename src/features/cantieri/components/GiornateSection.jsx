import ProgrammazioneSection from "./ProgrammazioneSection";
import RegistroLavoriSection from "./RegistroLavoriSection";
import ManodoperaCantiereSection from "../../manodopera/components/ManodoperaCantiereSection";

/**
 * Tab Giornate: Manodopera (costo/pagato) + Previsto + Fatto.
 */
export default function GiornateSection({
  cantiere,
  onAggiungiGiornata,
  onAggiornaGiornata,
  onEliminaGiornata,
  onAggiungiGiornataRegistro,
  onAggiornaGiornataRegistro,
  onEliminaGiornataRegistro,
  onAggiungiGiornataManodopera,
  onAggiornaGiornataManodopera,
  onEliminaGiornataManodopera,
  onImpostaPagatoManodopera,
}) {
  return (
    <div className="space-y-6">
      <ManodoperaCantiereSection
        cantiere={cantiere}
        onAggiungi={onAggiungiGiornataManodopera}
        onAggiorna={onAggiornaGiornataManodopera}
        onElimina={onEliminaGiornataManodopera}
        onImpostaPagato={onImpostaPagatoManodopera}
      />

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
