/**
 * Re-export contratto Edge Function per test Vitest / client.
 * Stessa logica del backend — nessuna secret.
 */
export {
  AI_AZIONE,
  AI_LIMITI,
  LIVELLI_CONFIDENZA,
  costruisciSystemPrompt,
  costruisciUserPrompt,
  normalizzaDatiConfronto,
  normalizzaListaStringhe,
  troncaStringa,
  validaRichiestaAnalisi,
  validaRispostaInsight,
} from "../../../supabase/functions/analisi-preventivo-intelligence/contract.js";
