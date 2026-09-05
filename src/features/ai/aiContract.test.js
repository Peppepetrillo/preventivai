import { describe, expect, it } from "vitest";

import {
  AI_AZIONE,
  costruisciSystemPrompt,
  costruisciUserPrompt,
  validaRichiestaAnalisi,
  validaRispostaInsight,
} from "./aiContract";

function payloadBase(over = {}) {
  return {
    azione: AI_AZIONE,
    versione: 1,
    nuovoLavoro: {
      titolo: "Impianto civile",
      descrizione: "punto luce",
      voci: [{ nome: "Punto luce", categoria: "Impianti" }],
    },
    portfolio: { lavoriConclusi: 2 },
    livelloConfidenza: "bassa",
    lavoriSimili: [],
    statistiche: { numeroConfrontabili: 0, conDatiUtili: 0 },
    ...over,
  };
}

describe("aiContract — backend validation", () => {
  it("accetta richiesta valida", () => {
    const r = validaRichiestaAnalisi(payloadBase());
    expect(r.ok).toBe(true);
  });

  it("rifiuta richiesta malformata", () => {
    expect(validaRichiestaAnalisi(null).ok).toBe(false);
    expect(validaRichiestaAnalisi({ azione: "altra" }).codice).toBe(
      "azione_non_supportata"
    );
    expect(
      validaRichiestaAnalisi({ azione: AI_AZIONE }).codice
    ).toBe("nuovo_lavoro_mancante");
  });

  it("rifiuta PII esplicita nel payload", () => {
    const r = validaRichiestaAnalisi(
      payloadBase({
        nuovoLavoro: {
          titolo: "x",
          telefono: "3331234567",
        },
      })
    );
    expect(r.ok).toBe(false);
    expect(r.codice).toBe("pii_rifiutata");
  });

  it("rifiuta troppi lavori simili", () => {
    const r = validaRichiestaAnalisi(
      payloadBase({
        lavoriSimili: Array.from({ length: 20 }, (_, i) => ({ score: i })),
      })
    );
    expect(r.ok).toBe(false);
    expect(r.codice).toBe("payload_troppo_grande");
  });

  it("valida risposta AI strutturata", () => {
    const r = validaRispostaInsight({
      titolo: "Analisi",
      valutazione: "Controlla i materiali.",
      motivazione: "Dai confronti.",
      datiDiConfronto: [{ etichetta: "Giornate", valore: "3,5" }],
      rischi: ["Range ampio"],
      cosaControllare: ["Accessi"],
      suggerimento: "Adatta al cantiere.",
      livelloConfidenza: "media",
    });
    expect(r.ok).toBe(true);
    expect(r.insight.datiDiConfronto[0].etichetta).toBe("Giornate");
  });

  it("rifiuta JSON AI invalido / campi mancanti / prezzo forzato", () => {
    expect(validaRispostaInsight(null).ok).toBe(false);
    expect(validaRispostaInsight({ motivazione: "x" }).codice).toBe(
      "campo_mancante"
    );
    expect(
      validaRispostaInsight({
        valutazione: "Il preventivo dovrebbe essere €4500",
      }).codice
    ).toBe("prezzo_non_ammesso");
  });

  it("prompt server non è vuoto e user prompt è JSON dati", () => {
    expect(costruisciSystemPrompt()).toMatch(/non inventare/i);
    const user = JSON.parse(costruisciUserPrompt(payloadBase()));
    expect(user.dati.nuovoLavoro.titolo).toBe("Impianto civile");
    expect(user.dati.nuovoLavoro.telefono).toBeUndefined();
  });
});
