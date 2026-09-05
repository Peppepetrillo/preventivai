import { describe, expect, it, vi, afterEach } from "vitest";

import { CATEGORIE_LAVORO_AI, LIVELLI_CONFIDENZA_AI } from "./aiTypes";
import { classificaLavoro } from "./classificaLavoro";
import { trovaLavoriSimili, calcolaScoreSomiglianza } from "./trovaLavoriSimili";
import {
  calcolaStatisticheSimili,
  valutaConfidenzaAi,
  haDatiSufficientiPerStima,
} from "./aiStatistiche";
import {
  costruisciContestoPreventivAI,
  normalizzaNuovoLavoroAi,
} from "./aiContextService";
import { generaInsightDeterministico } from "./aiFallback";
import {
  generaInsightDaProvider,
  normalizzaRispostaInsightAi,
  _resetRateLimitClientPerTest,
} from "./aiProvider";
import { analizzaNuovoLavoroIntelligence } from "./aiInsightsService";
import { costruisciPayloadInsightAi } from "./aiPromptBuilder";
import { AI_LIMITI } from "./aiContract";

function cantiereFixture({
  id,
  nome,
  stato = "Completato",
  descrizione = "",
  tipologiaImpianto = "",
  giornate = [],
  spese = [],
  pagamenti = [],
}) {
  return {
    id,
    nome,
    stato,
    cliente: "Cliente Test NON DA INVIARE",
    indirizzo: "Via Segreta 1",
    telefono: "3330000000",
    descrizioneIntervento: descrizione,
    tipologiaImpianto,
    tipoLavoro: "standard",
    registroGiornate: giornate,
    spese,
    pagamenti,
    materiali: [],
    lavorazioniOrigine: [],
  };
}

describe("classificaLavoro", () => {
  it("classifica fotovoltaico da keyword", () => {
    const r = classificaLavoro({
      titolo: "Impianto fotovoltaico 6kW",
      descrizione: "pannelli e inverter",
    });
    expect(r.categoria).toBe(CATEGORIE_LAVORO_AI.fotovoltaico);
    expect(r.confidence).toBeGreaterThan(0);
  });

  it("restituisce null se dati insufficienti", () => {
    const r = classificaLavoro({ titolo: "", descrizione: "" });
    expect(r.categoria).toBeNull();
    expect(r.confidence).toBe(0);
  });

  it("non inventa categoria su testo generico corto", () => {
    const r = classificaLavoro({ titolo: "xy" });
    expect(r.categoria).toBeNull();
  });
});

describe("trovaLavoriSimili", () => {
  it("ordina per score e filtra sotto soglia", () => {
    const cantieri = [
      cantiereFixture({
        id: "c1",
        nome: "FV Rossi",
        descrizione: "fotovoltaico pannelli inverter",
        tipologiaImpianto: "fotovoltaico",
      }),
      cantiereFixture({
        id: "c2",
        nome: "Bagno",
        descrizione: "sostituzione plafoniera",
      }),
    ];
    const simili = trovaLavoriSimili(
      {
        titolo: "Nuovo fotovoltaico",
        descrizione: "pannelli inverter",
        tipologiaImpianto: "fotovoltaico",
      },
      cantieri
    );
    expect(simili.length).toBeGreaterThanOrEqual(1);
    expect(simili[0].cantiereId).toBe("c1");
    expect(simili[0].score).toBeGreaterThanOrEqual(simili.at(-1)?.score || 0);
    expect(simili[0].motiviSomiglianza.length).toBeGreaterThan(0);
  });

  it("score zero su lavori senza segnali comuni", () => {
    const { score } = calcolaScoreSomiglianza(
      { titolo: "alpha" },
      { titolo: "zzzqqq" },
      null,
      null
    );
    expect(score).toBe(0);
  });
});

describe("statistiche e confidence", () => {
  it("dataset vuoto → insufficiente", () => {
    const stats = calcolaStatisticheSimili([]);
    expect(stats.numeroConfrontabili).toBe(0);
    expect(haDatiSufficientiPerStima(stats)).toBe(false);
    expect(valutaConfidenzaAi(stats, {})).toBe(
      LIVELLI_CONFIDENZA_AI.insufficiente
    );
  });

  it("1 lavoro con dati → bassa", () => {
    const stats = calcolaStatisticheSimili([
      {
        riepilogo: {
          contaGiornate: 3,
          oreLavorate: 24,
          speseMateriali: 100,
          altreSpese: 20,
          uscite: 120,
          entrate: 500,
          saldo: 380,
        },
      },
    ]);
    expect(stats.conDatiUtili).toBe(1);
    expect(haDatiSufficientiPerStima(stats)).toBe(false);
    expect(valutaConfidenzaAi(stats, { categoria: "fotovoltaico" })).toBe(
      LIVELLI_CONFIDENZA_AI.bassa
    );
  });

  it("2+ lavori → media; 4+ con categoria → buona", () => {
    const base = {
      contaGiornate: 2,
      oreLavorate: 16,
      speseMateriali: 200,
      altreSpese: 50,
      uscite: 250,
      entrate: 800,
      saldo: 550,
    };
    const due = calcolaStatisticheSimili([
      { riepilogo: base },
      { riepilogo: { ...base, contaGiornate: 4 } },
    ]);
    expect(haDatiSufficientiPerStima(due)).toBe(true);
    expect(valutaConfidenzaAi(due, {})).toBe(LIVELLI_CONFIDENZA_AI.media);

    const quattro = calcolaStatisticheSimili(
      Array.from({ length: 4 }, () => ({ riepilogo: base }))
    );
    expect(
      valutaConfidenzaAi(quattro, { categoria: "impianto_elettrico" })
    ).toBe(LIVELLI_CONFIDENZA_AI.buona);
  });

  it("non inventa medie su riepiloghi vuoti", () => {
    const stats = calcolaStatisticheSimili([
      { riepilogo: null },
      { riepilogo: { contaGiornate: 0, oreLavorate: 0, uscite: 0, entrate: 0 } },
    ]);
    expect(stats.giornate.media).toBe(0);
    expect(stats.conDatiUtili).toBe(0);
  });
});

describe("contesto e privacy", () => {
  it("normalizza senza PII", () => {
    const n = normalizzaNuovoLavoroAi({
      titolo: "Quadro",
      cliente: "Rossi",
      telefono: "123",
      lavorazioni: [{ nome: "Quadro elettrico", categoria: "Impianti" }],
    });
    expect(n.cliente).toBeUndefined();
    expect(n.telefono).toBeUndefined();
    expect(n.lavorazioni[0].nome).toBe("Quadro elettrico");
  });

  it("costruisce contesto e payload senza contatti", () => {
    const contesto = costruisciContestoPreventivAI({
      nuovoLavoro: {
        titolo: "Impianto elettrico civile",
        descrizione: "punto luce prese",
      },
      cantieri: [
        cantiereFixture({
          id: "a",
          nome: "Civile 1",
          descrizione: "impianto elettrico civili prese",
          giornate: [
            { id: "g1", data: "01/03/2026", operai: ["A"], oreLavorate: 8, attivita: "x" },
          ],
          spese: [
            {
              id: "s1",
              data: "01/03/2026",
              importo: 100,
              descrizione: "cavi",
              categoria: "materiali",
            },
          ],
          pagamenti: [
            {
              id: "p1",
              data: "02/03/2026",
              importo: 500,
              tipo: "acconto",
              metodo: "bonifico",
            },
          ],
        }),
      ],
    });

    const json = JSON.stringify(contesto);
    expect(json).not.toMatch(/Via Segreta/);
    expect(json).not.toMatch(/3330000000/);
    expect(json).not.toMatch(/Cliente Test/);

    const payload = costruisciPayloadInsightAi(contesto);
    expect(payload.azione).toBe("analisiPreventivoIntelligence");
    expect(payload.vincoli.nonInventarePrezzi).toBe(true);
    expect(JSON.stringify(payload)).not.toMatch(/3330000000/);
  });
});

describe("fallback e nessun dato inventato", () => {
  it("0 lavori → messaggio obbligatorio dati insufficienti", () => {
    const contesto = costruisciContestoPreventivAI({
      nuovoLavoro: { titolo: "Manutenzione quadro" },
      cantieri: [],
    });
    const insight = generaInsightDeterministico(contesto);
    expect(insight.valutazione).toMatch(/non ho abbastanza/i);
    expect(insight.livelloConfidenza).toBe(
      LIVELLI_CONFIDENZA_AI.insufficiente
    );
    expect(insight.fonte).toBe("deterministico");
  });

  it("5+ lavori simili con dati → confronto utile senza prezzo inventato", () => {
    const cantieri = Array.from({ length: 5 }, (_, i) =>
      cantiereFixture({
        id: `c${i}`,
        nome: `Impianto ${i}`,
        descrizione: "impianto elettrico civile punto luce",
        giornate: [
          {
            id: `g${i}`,
            data: `0${(i % 9) + 1}/02/2026`,
            operai: ["A"],
            oreLavorate: 8,
            attivita: "lavoro",
          },
        ],
        spese: [
          {
            id: `s${i}`,
            data: "01/02/2026",
            importo: 150 + i * 10,
            descrizione: "materiale",
            categoria: "materiali",
          },
        ],
        pagamenti: [
          {
            id: `p${i}`,
            data: "05/02/2026",
            importo: 800,
            tipo: "saldo",
            metodo: "bonifico",
          },
        ],
      })
    );

    const contesto = costruisciContestoPreventivAI({
      nuovoLavoro: {
        titolo: "Nuovo impianto elettrico",
        descrizione: "civile punto luce prese",
      },
      cantieri,
    });
    const insight = generaInsightDeterministico(contesto);
    expect(insight.numeroLavoriSimili).toBeGreaterThanOrEqual(2);
    expect(insight.valutazione).not.toMatch(/€\s*\d{3,}/);
    expect(
      insight.datiDiConfronto.some((r) =>
        /Basato su/i.test(typeof r === "string" ? r : r.valore || "")
      )
    ).toBe(true);
  });
});

describe("provider mock", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    _resetRateLimitClientPerTest();
  });

  it("provider non configurato → ok false", async () => {
    vi.stubEnv("VITE_AI_ASSISTANT_ENDPOINT", "");
    const esito = await generaInsightDaProvider({});
    expect(esito.ok).toBe(false);
    expect(esito.motivo).toBe("provider_non_configurato");
  });

  it("provider errore → fallback orchestratore", async () => {
    vi.stubEnv("VITE_AI_ASSISTANT_ENDPOINT", "https://example.test/ai");
    _resetRateLimitClientPerTest();
    const fetchImpl = vi.fn(async () => {
      throw new Error("network");
    });
    const esito = await analizzaNuovoLavoroIntelligence({
      cantieri: [],
      nuovoLavoro: { titolo: "Manutenzione" },
      fetchImpl,
    });
    expect(esito.usatoProvider).toBe(false);
    expect(esito.motivoFallback).toBe("provider_non_raggiungibile");
    expect(esito.insight.fonte).toBe("deterministico");
    expect(esito.insight.valutazione).toMatch(/non ho abbastanza/i);
    expect(esito.puoRiprovare).toBe(true);
  });

  it("provider timeout → motivo timeout", async () => {
    vi.stubEnv("VITE_AI_ASSISTANT_ENDPOINT", "https://example.test/ai");
    _resetRateLimitClientPerTest();
    const fetchImpl = vi.fn(
      (_url, opts) =>
        new Promise((_, reject) => {
          opts.signal.addEventListener("abort", () => {
            const err = new Error("aborted");
            err.name = "AbortError";
            reject(err);
          });
        })
    );
    const esito = await generaInsightDaProvider(
      {
        nuovoLavoro: { titolo: "x" },
        livelloConfidenza: "insufficiente",
        lavoriSimili: [],
        statistiche: {},
        portfolio: {},
      },
      { fetchImpl, timeoutMs: 20 }
    );
    expect(esito.ok).toBe(false);
    expect(esito.motivo).toBe("timeout");
  });

  it("provider 500 → fallback e retry possibile", async () => {
    vi.stubEnv("VITE_AI_ASSISTANT_ENDPOINT", "https://example.test/ai");
    _resetRateLimitClientPerTest();
    const fetchImpl = vi.fn(async () => ({
      ok: false,
      status: 500,
      json: async () => ({ codice: "provider_upstream" }),
    }));
    const esito = await analizzaNuovoLavoroIntelligence({
      cantieri: [],
      nuovoLavoro: { titolo: "x" },
      fetchImpl,
    });
    expect(esito.usatoProvider).toBe(false);
    expect(esito.motivoFallback).toBe("provider_upstream");
    expect(esito.analisiDatiDisponibile).toBe(true);
  });

  it("provider ok → usa valutazione remota ma tiene confidenza dai dati", async () => {
    vi.stubEnv("VITE_AI_ASSISTANT_ENDPOINT", "https://example.test/ai");
    _resetRateLimitClientPerTest();
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        valutazione: "Considera bene i materiali.",
        motivazione: "Dai confronti storici.",
        datiDiConfronto: [{ etichetta: "Giornate", valore: "3" }],
        rischi: ["Variabilità giornate"],
        cosaControllare: ["Accessi cantiere"],
        suggerimento: "Adatta il totale al contesto.",
        livelloConfidenza: "buona",
      }),
    }));

    const esito = await analizzaNuovoLavoroIntelligence({
      cantieri: [],
      nuovoLavoro: { titolo: "x" },
      fetchImpl,
    });
    expect(esito.usatoProvider).toBe(true);
    expect(esito.insight.valutazione).toMatch(/materiali/i);
    expect(esito.insight.livelloConfidenza).toBe(
      LIVELLI_CONFIDENZA_AI.insufficiente
    );
  });

  it("rifiuta chiamate troppo ravvicinate", async () => {
    vi.stubEnv("VITE_AI_ASSISTANT_ENDPOINT", "https://example.test/ai");
    _resetRateLimitClientPerTest();
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => ({ valutazione: "Ok" }),
    }));
    const contesto = {
      nuovoLavoro: { titolo: "x" },
      livelloConfidenza: "bassa",
      lavoriSimili: [],
      statistiche: {},
      portfolio: {},
    };
    const a = await generaInsightDaProvider(contesto, {
      fetchImpl,
      nowMs: 1000,
    });
    expect(a.ok).toBe(true);
    const b = await generaInsightDaProvider(contesto, {
      fetchImpl,
      nowMs: 1000 + AI_LIMITI.minIntervalloClientMs - 100,
    });
    expect(b.ok).toBe(false);
    expect(b.motivo).toBe("troppo_frequente");
  });

  it("payload non contiene PII tipiche", () => {
    const payload = costruisciPayloadInsightAi({
      nuovoLavoro: {
        titolo: "Quadro",
        lavorazioni: [{ nome: "Quadro", categoria: "x" }],
      },
      lavoriSimili: [],
      statistiche: {},
      portfolio: {},
      livelloConfidenza: "bassa",
    });
    const s = JSON.stringify(payload);
    expect(s).not.toMatch(/telefono|email|iban|codiceFiscale|partitaIva/i);
    expect(payload.nuovoLavoro.cliente).toBeUndefined();
  });

  it("normalizza risposta provider", () => {
    const n = normalizzaRispostaInsightAi(
      { valutazione: "Ok", rischi: ["a"] },
      { livelloConfidenza: "media" }
    );
    expect(n.fonte).toBe("provider");
    expect(n.rischi).toEqual(["a"]);
  });
});
