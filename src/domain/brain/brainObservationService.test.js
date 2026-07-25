import { beforeEach, describe, expect, it } from "vitest";

import {
  cancellaOsservazioni,
  contaOsservazioni,
  elencaOsservazioni,
  salvaOsservazione,
} from "./brainObservationService";

describe("brainObservationService", () => {
  beforeEach(() => {
    localStorage.clear();
    cancellaOsservazioni();
  });

  it("salva un'osservazione completa da input + proposta", () => {
    const input = {
      tipoImmobile: "villa",
      superficieMq: 140,
      numeroLivelli: "2",
      statoImmobile: "ristrutturazione",
      livelloImpianto: "premium",
      serieCivile: "living-now",
      extra: { domotica: true },
    };
    const proposta = {
      puntiStimati: 140,
      quadroSuggerito: "Quadro 24 moduli",
      suggerimenti: ["Gateway"],
      regoleApplicate: [{ id: "RULE_001", nome: "Stima punti impianto" }],
    };

    const obs = salvaOsservazione(input, proposta, {});

    expect(obs).toMatchObject({
      tipoImmobile: "villa",
      superficieMq: 140,
      livelli: 2,
      statoImmobile: "ristrutturazione",
      livelloImpianto: "premium",
      serieCivile: "living-now",
      extra: { domotica: true },
      propostaOriginale: proposta,
      modificheUtente: {},
    });
    expect(obs.id).toBeTruthy();
    expect(typeof obs.createdAt).toBe("number");
    expect(contaOsservazioni()).toBe(1);
    expect(elencaOsservazioni()[0].id).toBe(obs.id);
  });

  it("cancella tutte le osservazioni", () => {
    salvaOsservazione({ tipoImmobile: "appartamento", superficieMq: 50 }, {}, {});
    expect(contaOsservazioni()).toBe(1);
    cancellaOsservazioni();
    expect(contaOsservazioni()).toBe(0);
    expect(elencaOsservazioni()).toEqual([]);
  });
});
