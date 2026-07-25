import { describe, expect, it } from "vitest";

import {
  creaBrainObservation,
  normalizzaLivelliBrain,
} from "./brainTypes";

describe("brainTypes", () => {
  it("normalizza livelli UI inclusi 4+", () => {
    expect(normalizzaLivelliBrain("1")).toBe(1);
    expect(normalizzaLivelliBrain("4+")).toBe(4);
    expect(normalizzaLivelliBrain(3)).toBe(3);
  });

  it("crea BrainObservation con modificheUtente vuote", () => {
    const obs = creaBrainObservation(
      {
        tipoImmobile: "appartamento",
        superficieMq: 90,
        numeroLivelli: "1",
        statoImmobile: "nuova-costruzione",
        livelloImpianto: "standard",
        serieCivile: "vimar",
        extra: {},
      },
      { puntiStimati: 90 },
      {}
    );

    expect(obs.modificheUtente).toEqual({});
    expect(obs.propostaOriginale.puntiStimati).toBe(90);
    expect(obs.livelli).toBe(1);
  });
});
