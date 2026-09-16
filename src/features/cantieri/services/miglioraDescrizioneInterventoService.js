/**
 * Migliora descrizione intervento (UX-6.5).
 * Usa endpoint pubblico se configurato — nessuna API key nel frontend.
 * NON inventa contenuti in assenza di endpoint.
 */

import { scrubTestoLiberoAi } from "../../ai/scrubTestoLiberoAi";

const TIMEOUT_MS = 20000;

/**
 * @typedef {object} EsitoMiglioraDescrizione
 * @property {boolean} ok
 * @property {string=} bozza
 * @property {string=} errore
 * @property {boolean=} nonConfigurato
 */

/**
 * @param {string} testo
 * @param {{ stile?: string, timeoutMs?: number }=} opzioni
 * @returns {Promise<EsitoMiglioraDescrizione>}
 */
export async function miglioraDescrizioneIntervento(testo, opzioni = {}) {
  const originale = String(testo || "").trim();
  if (!originale) {
    return {
      ok: false,
      errore: "Inserisci prima una descrizione da migliorare.",
      nonConfigurato: false,
    };
  }

  const endpoint = String(import.meta.env.VITE_AI_ASSISTANT_ENDPOINT || "").trim();
  if (!endpoint) {
    return {
      ok: false,
      nonConfigurato: true,
      errore:
        "Assistente IA non disponibile su questo dispositivo. Puoi continuare a scrivere la descrizione a mano.",
    };
  }

  const stile = String(opzioni.stile || "professionale").trim() || "professionale";
  const timeoutMs =
    Number(opzioni.timeoutMs) > 0 ? Number(opzioni.timeoutMs) : TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const risposta = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        azione: "miglioraDescrizioneIntervento",
        testo: scrubTestoLiberoAi(originale),
        stile,
        vincoli: {
          nonInventare: true,
          soloTestoFornito: true,
          nientePrezzi: true,
          nienteMaterialiNonIndicati: true,
        },
      }),
    });

    if (!risposta.ok) {
      return {
        ok: false,
        errore: "Assistente IA non disponibile. Riprova più tardi.",
      };
    }

    const payload = await risposta.json();
    const bozza = String(
      payload?.bozza || payload?.testo || payload?.descrizione || ""
    ).trim();

    if (!bozza) {
      return {
        ok: false,
        errore: "L'assistente non ha restituito una descrizione valida.",
      };
    }

    return { ok: true, bozza };
  } catch (errore) {
    if (errore?.name === "AbortError") {
      return {
        ok: false,
        errore: "Tempo scaduto. Controlla la connessione e riprova.",
      };
    }
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      return {
        ok: false,
        errore: "Sei offline. Riprova quando hai connessione.",
      };
    }
    return {
      ok: false,
      errore: "Impossibile contattare l'assistente IA.",
    };
  } finally {
    clearTimeout(timer);
  }
}
