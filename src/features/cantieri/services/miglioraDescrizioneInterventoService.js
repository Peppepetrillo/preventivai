/**
 * Migliora descrizione intervento (UX-6.5).
 * Usa VITE_AI_ASSISTANT_ENDPOINT se configurato — nessuna API key nel frontend.
 * NON inventa contenuti in assenza di endpoint.
 */

/**
 * @typedef {object} EsitoMiglioraDescrizione
 * @property {boolean} ok
 * @property {string=} bozza
 * @property {string=} errore
 * @property {boolean=} nonConfigurato
 */

/**
 * @param {string} testo
 * @param {{ stile?: string }=} opzioni
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
        "Assistente IA non configurato. Imposta VITE_AI_ASSISTANT_ENDPOINT per abilitarlo.",
    };
  }

  const stile = String(opzioni.stile || "professionale").trim() || "professionale";

  try {
    const risposta = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        azione: "miglioraDescrizioneIntervento",
        testo: originale,
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
  } catch {
    return {
      ok: false,
      errore: "Impossibile contattare l'assistente IA.",
    };
  }
}
