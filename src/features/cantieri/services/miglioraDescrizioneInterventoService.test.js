import { afterEach, describe, expect, it, vi } from "vitest";

import { miglioraDescrizioneIntervento } from "./miglioraDescrizioneInterventoService";

describe("miglioraDescrizioneIntervento", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("rifiuta testo vuoto senza chiamare endpoint", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const esito = await miglioraDescrizioneIntervento("  ");
    expect(esito.ok).toBe(false);
    expect(esito.errore).toMatch(/descrizione/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("senza endpoint non inventa bozza e non crasha", async () => {
    vi.stubEnv("VITE_AI_ASSISTANT_ENDPOINT", "");
    const esito = await miglioraDescrizioneIntervento("cambiato mt");
    expect(esito.ok).toBe(false);
    expect(esito.nonConfigurato).toBe(true);
    expect(esito.bozza).toBeUndefined();
  });

  it("con endpoint restituisce bozza senza sostituire automaticamente", async () => {
    vi.stubEnv("VITE_AI_ASSISTANT_ENDPOINT", "https://example.test/ai");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          bozza:
            "Sostituito il magnetotermico e verificato il quadro elettrico.",
        }),
      }))
    );

    const esito = await miglioraDescrizioneIntervento("cambiato mt e controllato quadro");
    expect(esito.ok).toBe(true);
    expect(esito.bozza).toMatch(/magnetotermico/i);
  });
});
