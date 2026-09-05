/**
 * Orchestratore PreventivAI Intelligence.
 * DATA → analisi deterministica → (opzionale) AI backend → UI.
 */

import { leggiCantieri } from "../../repositories/cantieriRepository";
import { costruisciContestoPreventivAI } from "./aiContextService";
import { generaInsightDeterministico } from "./aiFallback";
import { ETICHETTE_CONFIDENZA_AI } from "./aiTypes";
import { normalizzaDatiConfronto } from "./aiContract";
import {
  generaInsightDaProvider,
  isAiProviderConfigurato,
  messaggioErroreAi,
} from "./aiProvider";

/**
 * Analizza un nuovo lavoro rispetto allo storico reale.
 *
 * @param {{
 *   nuovoLavoro?: object,
 *   cantieri?: object[],
 *   forzaFallback?: boolean,
 *   fetchImpl?: typeof fetch,
 *   timeoutMs?: number,
 * }} input
 */
export async function analizzaNuovoLavoroIntelligence(input = {}) {
  const cantieri =
    input.cantieri != null ? input.cantieri : leggiCantieri();

  const contesto = costruisciContestoPreventivAI({
    cantieri,
    nuovoLavoro: input.nuovoLavoro || {},
  });

  const fallback = generaInsightDeterministico(contesto);
  let insight = fallback;
  let usatoProvider = false;
  let motivoFallback = null;
  let messaggioUtente = null;
  let puoRiprovare = false;

  const provaProvider =
    !input.forzaFallback && isAiProviderConfigurato();

  if (provaProvider) {
    const esito = await generaInsightDaProvider(contesto, {
      fetchImpl: input.fetchImpl,
      timeoutMs: input.timeoutMs,
    });
    if (esito.ok) {
      usatoProvider = true;
      const datiConfronto =
        esito.insight.datiDiConfronto?.length > 0
          ? esito.insight.datiDiConfronto
          : fallback.datiDiConfronto;

      insight = {
        ...fallback,
        ...esito.insight,
        fonte: "provider",
        datiDiConfronto: normalizzaDatiConfronto(datiConfronto),
        livelloConfidenza: contesto.livelloConfidenza,
        livelloConfidenzaEtichetta:
          ETICHETTE_CONFIDENZA_AI[contesto.livelloConfidenza] ||
          contesto.livelloConfidenza,
        numeroLavoriSimili: contesto.statistiche?.numeroConfrontabili || 0,
        numeroConDatiUtili: contesto.statistiche?.conDatiUtili || 0,
      };
    } else {
      motivoFallback = esito.motivo;
      messaggioUtente =
        esito.messaggioUtente || messaggioErroreAi(esito.motivo);
      puoRiprovare = Boolean(esito.puoRiprovare);
      insight = generaInsightDeterministico(contesto, {
        motivo:
          esito.motivo === "provider_non_configurato"
            ? null
            : "analisi AI non disponibile, uso i tuoi dati",
      });
    }
  }

  return {
    ok: true,
    contesto,
    insight,
    usatoProvider,
    motivoFallback,
    messaggioUtente,
    puoRiprovare,
    providerConfigurato: isAiProviderConfigurato(),
    analisiDatiDisponibile: true,
  };
}
