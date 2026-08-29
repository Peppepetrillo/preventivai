import { Link, useNavigate, useParams } from "react-router-dom";
import { useState } from "react";

import { ROUTES } from "../app/routes";
import PageWrapper from "../components/PageWrapper";
import CantiereOverview from "../features/cantieri/components/CantiereOverview";
import { useCantieri } from "../features/cantieri/hooks/useCantieri";
import {
  isRecordCestinato,
  ripristina,
  TIPI_CESTINO,
} from "../domain/cestino";

/**
 * Dettaglio cantiere — route canonica `/cantiere/:id`.
 * L'identità del cantiere deriva solo dall'URL (nessun location.state).
 */
export default function Cantiere() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cestinoTick, setCestinoTick] = useState(0);
  void cestinoTick;

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
    aggiungiMaterialeDaPayload,
    eliminaMateriale,
    toggleMaterialeAcquistato,
    creaVariante,
    sincronizzaVariantePreventivo,
    approvaVariante,
    eseguiVariante,
    annullaVariante,
    variantiTick,
    completaLavoro,
    aggiungiFoto,
    eliminaFoto,
    aggiungiNotaDiario,
    aggiungiGiornata,
    aggiornaGiornata,
    eliminaGiornata,
    aggiungiGiornataRegistro,
    aggiornaGiornataRegistro,
    eliminaGiornataRegistro,
    aggiungiPagamento,
    aggiornaPagamento,
    eliminaPagamento,
    aggiungiSpesa,
    aggiornaSpesa,
    eliminaSpesa,
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

  if (isRecordCestinato(cantiereSelezionato)) {
    return (
      <PageWrapper>
        <div className="pro-page text-white" data-testid="cantiere-nel-cestino">
          <Link to={ROUTES.cantieri} className="ds-back-link mb-5">
            Cantieri
          </Link>
          <div className="pro-panel p-5 space-y-4">
            <p className="section-label">Cestino</p>
            <h1 className="ds-page-title">{cantiereSelezionato.nome}</h1>
            <p className="ds-text-secondary">
              Questo cantiere è nel Cestino. I dati restano intatti fino al
              ripristino o all&apos;eliminazione definitiva.
            </p>
            <div className="grid gap-3">
              <button
                type="button"
                className="btn-primary min-h-[48px]"
                onClick={() => {
                  ripristina(TIPI_CESTINO.cantiere, cantiereSelezionato.id);
                  setCestinoTick((n) => n + 1);
                }}
              >
                Ripristina
              </button>
              <button
                type="button"
                className="btn-secondary min-h-[48px]"
                onClick={() => navigate(ROUTES.cantieri)}
              >
                Torna indietro
              </button>
              <Link
                to={ROUTES.cestino}
                className="btn-secondary min-h-[48px] flex items-center justify-center"
              >
                Apri Cestino
              </Link>
            </div>
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
          onAggiungiMaterialeDaPayload={aggiungiMaterialeDaPayload}
          onEliminaMateriale={eliminaMateriale}
          onToggleMaterialeAcquistato={toggleMaterialeAcquistato}
          onAggiungiFoto={aggiungiFoto}
          onEliminaFoto={eliminaFoto}
          onAggiungiNotaDiario={aggiungiNotaDiario}
          onEliminaCantiere={gestisciElimina}
          onIniziaLavoro={iniziaLavoro}
          onCompletaLavoro={completaLavoro}
          onCreaVariante={creaVariante}
          onSincronizzaVariantePreventivo={sincronizzaVariantePreventivo}
          onApprovaVariante={approvaVariante}
          onEseguiVariante={eseguiVariante}
          onAnnullaVariante={annullaVariante}
          variantiTick={variantiTick}
          onAggiungiGiornata={aggiungiGiornata}
          onAggiornaGiornata={aggiornaGiornata}
          onEliminaGiornata={eliminaGiornata}
          onAggiungiGiornataRegistro={aggiungiGiornataRegistro}
          onAggiornaGiornataRegistro={aggiornaGiornataRegistro}
          onEliminaGiornataRegistro={eliminaGiornataRegistro}
          onAggiungiPagamento={aggiungiPagamento}
          onAggiornaPagamento={aggiornaPagamento}
          onEliminaPagamento={eliminaPagamento}
          onAggiungiSpesa={aggiungiSpesa}
          onAggiornaSpesa={aggiornaSpesa}
          onEliminaSpesa={eliminaSpesa}
        />
      </div>
    </PageWrapper>
  );
}
