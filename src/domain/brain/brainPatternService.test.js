import { beforeEach, describe, expect, it } from "vitest";

import { cancellaOsservazioni, salvaOsservazione } from "./brainObservationService";
import {
  analizzaOsservazioni,
  contaPattern,
  ottieniPattern,
  resetPattern,
  statistichePattern,
} from "./brainPatternService";
import { BRAIN_PATTERN_STATI } from "./brainPatternTypes";

function seedVillaClima(n = 6) {
  for (let i = 0; i < n; i += 1) {
    salvaOsservazione(
      {
        tipoImmobile: "villa",
        superficieMq: 180,
        numeroLivelli: "2",
        livelloImpianto: "premium",
        statoImmobile: "nuova-costruzione",
        serieCivile: "living-now",
        extra: { predisposizioneClima: true },
      },
      { puntiStimati: 180 },
      {}
    );
  }
}

describe("brainPatternService", () => {
  beforeEach(() => {
    localStorage.clear();
    cancellaOsservazioni();
    resetPattern();
  });

  it("analizzaOsservazioni produce e persiste pattern", () => {
    seedVillaClima(6);
    const { patterns } = analizzaOsservazioni();
    expect(patterns.length).toBeGreaterThanOrEqual(1);
    expect(contaPattern()).toBe(patterns.length);
    expect(ottieniPattern()[0].stato).toBe(BRAIN_PATTERN_STATI.NUOVO);
  });

  it("conserva stato accettato tra rivalutazioni", () => {
    seedVillaClima(6);
    analizzaOsservazioni();
    const primo = ottieniPattern()[0];
    localStorage.setItem(
      "preventivai.brain.patterns",
      JSON.stringify([
        {
          ...primo,
          stato: BRAIN_PATTERN_STATI.ACCETTATO,
        },
      ])
    );

    seedVillaClima(1);
    const { patterns } = analizzaOsservazioni();
    const stesso = patterns.find((p) => p.fingerprint === primo.fingerprint);
    expect(stesso.stato).toBe(BRAIN_PATTERN_STATI.ACCETTATO);
  });

  it("statistichePattern espone conteggi per stato", () => {
    seedVillaClima(6);
    analizzaOsservazioni();
    const stats = statistichePattern();
    expect(stats.totale).toBeGreaterThanOrEqual(1);
    expect(stats.nuovi).toBeGreaterThanOrEqual(1);
  });
});
