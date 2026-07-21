import { memo, useCallback, useMemo, useState } from "react";
import { Sparkles, Undo2 } from "lucide-react";

import SearchInput from "../../../../components/SearchInput";
import { calcolaTotali } from "../../../../utils/preventivi";
import CarrelloPreventivo from "../../components/CarrelloPreventivo";
import CategorieListino from "../../components/CategorieListino";
import CondizioniAvanzate from "../../components/CondizioniAvanzate";
import KitRapidiBar from "../../components/KitRapidiBar";
import PiuUsatiListino from "../../components/PiuUsatiListino";
import PreventivoAssistantPanel from "../../components/PreventivoAssistantPanel";
import PreventivoExpress from "../../components/PreventivoExpress";
import { useCarrelloPreventivo } from "../../hooks/useCarrelloPreventivo";
import { useComponiPreventivo } from "../../hooks/useComponiPreventivo";
import {
  calcolaNumeroVociCarrello,
  creaMappaQuantitaCarrello,
} from "../../utils/listinoGrouping";
import { opzioneTipoLavoro, TIPO_LAVORO } from "../wizardConfig";

function StepComponi({
  tipoLavoro,
  cliente,
  expressAutoOpen,
  lavorazioni,
  condizioni,
  onAggiornaLavorazioni,
  onAggiornaCondizioni,
  onImpostaCliente,
  onImpostaExpressAutoOpen,
  onAvanti,
}) {
  const opzione = opzioneTipoLavoro(tipoLavoro);
  const isPercorsoExpress = tipoLavoro === TIPO_LAVORO.express;
  const haVoci = lavorazioni.length > 0;

  const [expressOverride, setExpressOverride] = useState(null);
  const [avanzateAperte, setAvanzateAperte] = useState(false);
  const [snapshotExpress, setSnapshotExpress] = useState(null);
  const [feedbackExpress, setFeedbackExpress] = useState("");

  const expressAperto = expressOverride ?? expressAutoOpen;

  const {
    listinoFiltrato,
    piuUsati,
    ricerca,
    setRicerca,
    aggiungiVoce,
    aggiungiKit,
  } = useComponiPreventivo({
    onAggiornaLavorazioni,
  });

  const {
    aumentaQuantita,
    diminuisciQuantita,
    rimuoviLavorazione,
  } = useCarrelloPreventivo({
    onAggiornaLavorazioni,
  });

  const quantitaPerVoce = useMemo(
    () => creaMappaQuantitaCarrello(lavorazioni),
    [lavorazioni]
  );

  const totali = useMemo(
    () => calcolaTotali(lavorazioni, condizioni.sconto, condizioni.iva),
    [lavorazioni, condizioni.sconto, condizioni.iva]
  );

  const numeroVoci = useMemo(
    () => calcolaNumeroVociCarrello(lavorazioni),
    [lavorazioni]
  );

  const apriExpress = useCallback(() => {
    setExpressOverride(true);
  }, []);

  const chiudiExpress = useCallback(() => {
    setExpressOverride(false);
    onImpostaExpressAutoOpen?.(false);
  }, [onImpostaExpressAutoOpen]);

  const applicaBozzaExpress = useCallback(
    ({ lavorazioni: nuoveLavorazioni, condizioni: nuoveCondizioni, cliente: nuovoCliente, avvisi, riepilogo }) => {
      setSnapshotExpress({
        lavorazioni: [...lavorazioni],
        condizioni: { ...condizioni },
        cliente,
      });

      if (nuoveLavorazioni?.length) {
        onAggiornaLavorazioni(nuoveLavorazioni);
      }

      onAggiornaCondizioni(nuoveCondizioni);

      if (nuovoCliente && nuovoCliente !== cliente) {
        onImpostaCliente?.(nuovoCliente);
      }

      const messaggioAvvisi = avvisi?.length ? ` ${avvisi.join(" ")}` : "";
      const messaggioRiepilogo = riepilogo?.vociTrovate
        ? ` ${riepilogo.vociTrovate} lavorazioni applicate.`
        : "";

      setFeedbackExpress(
        `Bozza Express applicata.${messaggioRiepilogo}${messaggioAvvisi}`.trim()
      );
    },
    [
      lavorazioni,
      condizioni,
      cliente,
      onAggiornaLavorazioni,
      onAggiornaCondizioni,
      onImpostaCliente,
    ]
  );

  const annullaExpress = useCallback(() => {
    if (!snapshotExpress) return;

    onAggiornaLavorazioni(snapshotExpress.lavorazioni);
    onAggiornaCondizioni(snapshotExpress.condizioni);

    if (snapshotExpress.cliente !== cliente) {
      onImpostaCliente?.(snapshotExpress.cliente);
    }

    setSnapshotExpress(null);
    setFeedbackExpress("");
  }, [
    snapshotExpress,
    cliente,
    onAggiornaLavorazioni,
    onAggiornaCondizioni,
    onImpostaCliente,
  ]);

  return (
    <div className="flex flex-col min-h-[calc(100vh-11rem)]">
      <div
        className={`px-4 space-y-4 flex-1 ${
          haVoci ? "pb-[min(52vh,320px)]" : "pb-44"
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-slate-400 truncate">
            Cliente: <span className="text-white font-bold">{cliente}</span>
          </p>
          <button
            type="button"
            onClick={apriExpress}
            className="shrink-0 min-h-11 px-3 py-2 rounded-[12px] bg-yellow-400/15 border border-yellow-300/30 text-yellow-100 text-sm font-black flex items-center gap-1.5"
          >
            <Sparkles size={16} aria-hidden="true" />
            Express
          </button>
        </div>

        {isPercorsoExpress ? (
          <div className="pro-panel p-3 border-yellow-300/25 bg-yellow-400/8">
            <p className="text-sm text-yellow-100 font-bold">
              Percorso Express attivo
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Detta o scrivi il preventivo: verrà applicato automaticamente.
            </p>
          </div>
        ) : null}

        {feedbackExpress ? (
          <div
            className="pro-panel p-3 flex items-start justify-between gap-3 border-yellow-300/25"
            role="status"
          >
            <p className="text-sm text-yellow-100">{feedbackExpress}</p>
            {snapshotExpress ? (
              <button
                type="button"
                onClick={annullaExpress}
                className="shrink-0 text-sm font-black text-yellow-200 flex items-center gap-1"
              >
                <Undo2 size={15} aria-hidden="true" />
                Annulla
              </button>
            ) : null}
          </div>
        ) : null}

        <PreventivoAssistantPanel
          tipoLavoro={tipoLavoro}
          lavorazioni={lavorazioni}
          onAggiungiVoce={aggiungiVoce}
        />

        {opzione?.evidenziaKit ? (
          <KitRapidiBar onAggiungiKit={aggiungiKit} />
        ) : null}

        <SearchInput
          label="Cerca lavorazione"
          placeholder="Cerca lavorazione..."
          value={ricerca}
          onChange={(event) => setRicerca(event.target.value)}
        />

        {!ricerca ? (
          <PiuUsatiListino
            voci={piuUsati}
            quantitaPerVoce={quantitaPerVoce}
            onAggiungiVoce={aggiungiVoce}
          />
        ) : null}

        <CategorieListino
          listino={listinoFiltrato}
          quantitaPerVoce={quantitaPerVoce}
          categorieAperteDefault={opzione?.categorieAperte || []}
          onAggiungiVoce={aggiungiVoce}
        />
      </div>

      <CarrelloPreventivo
        lavorazioni={lavorazioni}
        totale={totali.totale}
        numeroVoci={numeroVoci}
        onAumentaQuantita={aumentaQuantita}
        onDiminuisciQuantita={diminuisciQuantita}
        onRimuoviLavorazione={rimuoviLavorazione}
        onApriAvanzate={() => setAvanzateAperte(true)}
        onContinua={onAvanti}
        disabilitato={!haVoci}
      />

      <PreventivoExpress
        open={expressAperto}
        onClose={chiudiExpress}
        clienteCorrente={cliente}
        onApplica={applicaBozzaExpress}
      />

      <CondizioniAvanzate
        open={avanzateAperte}
        onClose={() => setAvanzateAperte(false)}
        condizioni={condizioni}
        onSalva={onAggiornaCondizioni}
      />
    </div>
  );
}

export default memo(StepComponi);
