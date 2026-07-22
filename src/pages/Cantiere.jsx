import { Link, useNavigate, useParams } from "react-router-dom";

import { ROUTES } from "../app/routes";
import PageWrapper from "../components/PageWrapper";
import CantiereOverview from "../features/cantieri/components/CantiereOverview";
import { useCantieri } from "../features/cantieri/hooks/useCantieri";

/**
 * Dettaglio cantiere — route canonica `/cantiere/:id`.
 * L'identità del cantiere deriva solo dall'URL (nessun location.state).
 */
export default function Cantiere() {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    cantiereSelezionato,
    nuovaChecklist,
    nuovoMateriale,
    messaggio,
    avanzamento,
    setNuovaChecklist,
    aggiornaSelezionato,
    iniziaLavoro,
    eliminaCantiere,
    aggiungiChecklist,
    aggiornaChecklist,
    eliminaChecklist,
    aggiornaCampoMateriale,
    aggiungiMateriale,
    eliminaMateriale,
    completaLavoro,
    aggiungiFoto,
    eliminaFoto,
    apriFoto,
  } = useCantieri({ cantiereId: id });

  function gestisciElimina() {
    const eliminato = eliminaCantiere();
    if (eliminato) {
      navigate(ROUTES.cantieri, { replace: true });
    }
  }

  if (!cantiereSelezionato) {
    return (
      <PageWrapper>
        <div className="pro-page text-white min-h-[60vh] flex items-center justify-center">
          <div className="pro-panel p-6 text-center space-y-4">
            <p className="text-xl font-black">Cantiere non trovato</p>
            <Link to={ROUTES.cantieri} className="btn-secondary inline-flex px-5 py-3">
              Torna ai cantieri
            </Link>
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="pro-page text-white">
        {messaggio ? (
          <div className="pro-panel p-4 mb-5 text-yellow-100 border-yellow-300/30">
            {messaggio}
          </div>
        ) : null}

        <CantiereOverview
          cantiere={cantiereSelezionato}
          avanzamento={avanzamento}
          nuovaChecklist={nuovaChecklist}
          nuovoMateriale={nuovoMateriale}
          onAggiornaCampo={aggiornaSelezionato}
          onImpostaChecklist={setNuovaChecklist}
          onAggiungiChecklist={aggiungiChecklist}
          onAggiornaChecklist={aggiornaChecklist}
          onEliminaChecklist={eliminaChecklist}
          onAggiornaCampoMateriale={aggiornaCampoMateriale}
          onAggiungiMateriale={aggiungiMateriale}
          onEliminaMateriale={eliminaMateriale}
          onAggiungiFoto={aggiungiFoto}
          onEliminaFoto={eliminaFoto}
          onApriFoto={apriFoto}
          onEliminaCantiere={gestisciElimina}
          onIniziaLavoro={iniziaLavoro}
          onCompletaLavoro={completaLavoro}
        />
      </div>
    </PageWrapper>
  );
}
