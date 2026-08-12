import { memo, useCallback, useMemo, useState } from "react";
import { Plus, Sparkles, Undo2 } from "lucide-react";

import SearchInput from "../../../../components/SearchInput";
import { calcolaTotali } from "../../../../utils/preventivi";
import CarrelloPreventivo from "../../components/CarrelloPreventivo";
import CategorieListino from "../../components/CategorieListino";
import CondizioniAvanzate from "../../components/CondizioniAvanzate";
import ContestoPreventivo from "../../components/ContestoPreventivo";
import KitRapidiBar from "../../components/KitRapidiBar";
import LavorazionePersonalizzataSheet from "../../components/LavorazionePersonalizzataSheet";
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
  contesto,
  onAggiornaLavorazioni,
  onAggiornaCondizioni,
  onAggiornaContesto,
  onImpostaCliente,
  onImpostaExpressAutoOpen,
  onAvanti,
}) {
  const opzione = opzioneTipoLavoro(tipoLavoro);
  const isPercorsoExpress = tipoLavoro === TIPO_LAVORO.express;
  const haVoci = lavorazioni.length > 0;

  const [expressOverride, setExpressOverride] = useState(null);
  const [avanzateAperte, setAvanzateAperte] = useState(false);
  const [personalizzataAperta, setPersonalizzataAperta] = useState(false);
  const [snapshotExpress, setSnapshotExpress] = useState(null);
  const [feedbackExpress, setFeedbackExpress] = useState("");

  const expressAperto = expressOverride ?? expressAutoOpen;

  const {
    listino,
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
    impostaQuantita,
    impostaPrezzo,
    rimuoviLavorazione,
  } = useCarrelloPreventivo({
    onAggiornaLavorazioni,
  });

  const prezzoListinoPerNome = useMemo(() => {
    const mappa = new Map();
    (listino || []).forEach((voce) => {
      if (voce?.nome != null) {
        mappa.set(voce.nome, Number(voce.prezzo) || 0);
      }
      if (voce?.id != null) {
        mappa.set(String(voce.id), Number(voce.prezzo) || 0);
      }
    });
    return mappa;
  }, [listino]);

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

  const aggiungiPersonalizzata = useCallback(
    (lavorazione) => {
      onAggiornaLavorazioni((correnti) => [...correnti, lavorazione]);
    },
    [onAggiornaLavorazioni]
  );

  return (
    <div className="flex flex-col min-h-[calc(100vh-11rem)]">
      <div
        className={`px-4 space-y-4 flex-1 ${
          haVoci ? "pb-[min(52vh,320px)]" : "pb-44"
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-slate-400 truncate">
            Cliente: <span className="text-white font-semibold">{cliente}</span>
          </p>
          <button
            type="button"
            onClick={apriExpress}
            className="shrink-0 min-h-11 px-3 py-2 rounded-[16px] bg-yellow-400/15 border border-yellow-300/30 text-yellow-100 text-sm font-semibold flex items-center gap-1.5"
          >
            <Sparkles size={16} aria-hidden="true" />
            Express
          </button>
        </div>

        <ContestoPreventivo
          contesto={contesto}
          onAggiornaContesto={onAggiornaContesto}
        />

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

        <section aria-labelledby="listino-preventivo-titolo" className="space-y-3">
          <div className="px-1">
            <h2 id="listino-preventivo-titolo" className="ds-card-title">
              Dal tuo listino
            </h2>
            <p className="ds-text-secondary text-sm mt-0.5">
              Tocca una lavorazione per aggiungerla al preventivo.
            </p>
          </div>

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
            ricerca={ricerca}
            quantitaPerVoce={quantitaPerVoce}
            categorieAperteDefault={opzione?.categorieAperte || []}
            onAggiungiVoce={aggiungiVoce}
          />

          <button
            type="button"
            onClick={() => setPersonalizzataAperta(true)}
            className="w-full btn-secondary min-h-[44px] flex items-center justify-center gap-2"
            data-testid="aggiungi-lavorazione-personalizzata"
          >
            <Plus size={18} aria-hidden="true" />
            Lavorazione personalizzata
          </button>
        </section>

        <PreventivoAssistantPanel
          tipoLavoro={tipoLavoro}
          lavorazioni={lavorazioni}
          onAggiungiVoce={aggiungiVoce}
        />

        {opzione?.evidenziaKit ? (
          <KitRapidiBar onAggiungiKit={aggiungiKit} />
        ) : null}
      </div>

      <CarrelloPreventivo
        lavorazioni={lavorazioni}
        totale={totali.totale}
        numeroVoci={numeroVoci}
        prezzoListinoPerNome={prezzoListinoPerNome}
        onAumentaQuantita={aumentaQuantita}
        onDiminuisciQuantita={diminuisciQuantita}
        onImpostaQuantita={impostaQuantita}
        onImpostaPrezzo={impostaPrezzo}
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

      <LavorazionePersonalizzataSheet
        open={personalizzataAperta}
        onClose={() => setPersonalizzataAperta(false)}
        onSalva={aggiungiPersonalizzata}
      />
    </div>
  );
}

export default memo(StepComponi);
