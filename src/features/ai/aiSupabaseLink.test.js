import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  endpointAnalisiDaSupabaseUrl,
  getAiAssistantEndpoint,
  generaInsightDaProvider,
  _resetRateLimitClientPerTest,
} from "./aiProvider";
import { costruisciPayloadInsightAi } from "./aiPromptBuilder";
import { analizzaNuovoLavoroIntelligence } from "./aiInsightsService";
import { AI_AZIONE, validaRichiestaAnalisi } from "./aiContract";

const SRC_ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");

function elencaJs(dir, acc = []) {
  for (const nome of readdirSync(dir)) {
    if (nome === "node_modules" || nome === "dist") continue;
    const p = join(dir, nome);
    const st = statSync(p);
    if (st.isDirectory()) elencaJs(p, acc);
    else if (/\.(js|jsx|ts|tsx)$/.test(nome) && !nome.endsWith(".test.js") && !nome.endsWith(".test.jsx")) {
      acc.push(p);
    }
  }
  return acc;
}

describe("Sprint 21B — collegamento Supabase / sicurezza client", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    _resetRateLimitClientPerTest();
  });

  it("costruisce endpoint pubblico da URL progetto", () => {
    expect(
      endpointAnalisiDaSupabaseUrl("https://abcdefgh.supabase.co/")
    ).toBe(
      "https://abcdefgh.supabase.co/functions/v1/analisi-preventivo-intelligence"
    );
  });

  it("VITE_AI_ASSISTANT_ENDPOINT ha priorità", () => {
    vi.stubEnv(
      "VITE_AI_ASSISTANT_ENDPOINT",
      "https://custom.example/functions/v1/analisi-preventivo-intelligence"
    );
    vi.stubEnv("VITE_SUPABASE_URL", "https://abcdefgh.supabase.co");
    expect(getAiAssistantEndpoint()).toBe(
      "https://custom.example/functions/v1/analisi-preventivo-intelligence"
    );
  });

  it("deriva endpoint da VITE_SUPABASE_URL se AI endpoint assente", () => {
    vi.stubEnv("VITE_AI_ASSISTANT_ENDPOINT", "");
    vi.stubEnv("VITE_SUPABASE_URL", "https://abcdefgh.supabase.co");
    expect(getAiAssistantEndpoint()).toBe(
      "https://abcdefgh.supabase.co/functions/v1/analisi-preventivo-intelligence"
    );
  });

  it("endpoint assente → fallback orchestratore", async () => {
    vi.stubEnv("VITE_AI_ASSISTANT_ENDPOINT", "");
    vi.stubEnv("VITE_SUPABASE_URL", "");
    const esito = await analizzaNuovoLavoroIntelligence({
      cantieri: [],
      nuovoLavoro: { titolo: "Quadro" },
      forzaFallback: false,
    });
    expect(esito.usatoProvider).toBe(false);
    expect(esito.insight.fonte).toBe("deterministico");
  });

  it("endpoint configurato → chiama provider", async () => {
    vi.stubEnv(
      "VITE_AI_ASSISTANT_ENDPOINT",
      "https://abcdefgh.supabase.co/functions/v1/analisi-preventivo-intelligence"
    );
    _resetRateLimitClientPerTest();
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        valutazione: "Controlla i materiali rispetto allo storico.",
        motivazione: "Dati aggregati.",
        datiDiConfronto: [{ etichetta: "Giornate", valore: "3" }],
        rischi: [],
        cosaControllare: ["Accessi"],
        suggerimento: "Adatta il preventivo.",
        livelloConfidenza: "media",
      }),
    }));
    const esito = await generaInsightDaProvider(
      {
        nuovoLavoro: { titolo: "Impianto" },
        livelloConfidenza: "media",
        lavoriSimili: [],
        statistiche: { numeroConfrontabili: 2, conDatiUtili: 2 },
        portfolio: {},
      },
      { fetchImpl }
    );
    expect(esito.ok).toBe(true);
    expect(fetchImpl).toHaveBeenCalled();
    const url = fetchImpl.mock.calls[0][0];
    expect(url).toContain("analisi-preventivo-intelligence");
  });

  it("errore Edge Function → fallback", async () => {
    vi.stubEnv(
      "VITE_AI_ASSISTANT_ENDPOINT",
      "https://abcdefgh.supabase.co/functions/v1/analisi-preventivo-intelligence"
    );
    _resetRateLimitClientPerTest();
    const fetchImpl = vi.fn(async () => ({
      ok: false,
      status: 502,
      json: async () => ({ codice: "provider_upstream" }),
    }));
    const esito = await analizzaNuovoLavoroIntelligence({
      cantieri: [],
      nuovoLavoro: { titolo: "x" },
      fetchImpl,
    });
    expect(esito.usatoProvider).toBe(false);
    expect(esito.motivoFallback).toBe("provider_upstream");
    expect(esito.insight.fonte).toBe("deterministico");
  });

  it("payload senza PII e azione corretta", () => {
    const payload = costruisciPayloadInsightAi({
      nuovoLavoro: {
        titolo: "Civile",
        lavorazioni: [{ nome: "Punto luce", categoria: "Impianti" }],
      },
      lavoriSimili: [],
      statistiche: {},
      portfolio: {},
      livelloConfidenza: "bassa",
    });
    expect(payload.azione).toBe(AI_AZIONE);
    const v = validaRichiestaAnalisi(payload);
    expect(v.ok).toBe(true);
    const s = JSON.stringify(payload);
    expect(s).not.toMatch(/telefono|email|iban|codiceFiscale|partitaIva|service_role/i);
  });

  it("OPENAI_API_KEY non compare come valore nei sorgenti client (no test)", () => {
    const files = elencaJs(SRC_ROOT);
    for (const f of files) {
      const text = readFileSync(f, "utf8");
      expect(text).not.toMatch(/OPENAI_API_KEY\s*=\s*['"]sk-/);
      expect(text).not.toMatch(/sk-[a-zA-Z0-9]{20,}/);
      // service_role non deve essere usata nel client
      expect(text).not.toMatch(/service_role/);
    }
  });
});
