import { describe, expect, it } from "vitest";

import {
  creaKnowledgeInput,
  CUCINA_TIPI,
  TIPI_IMMOBILE_KE,
} from "./knowledgeInputTypes";

describe("knowledgeInputTypes — KE 2.0", () => {
  it("espone i tipi immobile richiesti", () => {
    expect(TIPI_IMMOBILE_KE).toEqual(
      expect.arrayContaining([
        "appartamento",
        "villa",
        "ufficio",
        "negozio",
        "garage",
        "altro",
      ])
    );
  });

  it("normalizza form completo caratteristiche", () => {
    const input = creaKnowledgeInput({
      tipoImmobile: "ufficio",
      superficieMq: 95,
      numeroLivelli: "2",
      numeroLocali: 6,
      numeroBagni: 2,
      cucina: "induzione",
      climatizzazione: true,
      citofono: true,
      videocitofono: false,
      impiantoTv: true,
      reteDati: true,
      allarme: true,
      videosorveglianza: false,
      cancelloAutomatico: true,
      predisposizioneFotovoltaico: true,
      predisposizioneColonnina: false,
      domotica: true,
      livelloImpianto: "premium",
    });

    expect(input).toMatchObject({
      tipoImmobile: "ufficio",
      mq: 95,
      livelli: 2,
      numeroLocali: 6,
      numeroBagni: 2,
      cucina: CUCINA_TIPI.INDUZIONE,
      climatizzazione: true,
      citofono: true,
      videocitofono: false,
      impiantoTv: true,
      reteDati: true,
      allarme: true,
      videosorveglianza: false,
      cancelloAutomatico: true,
      predisposizioneFotovoltaico: true,
      predisposizioneColonnina: false,
      domotica: true,
      livelloImpianto: "premium",
    });
  });

  it("retrocompat: extra legacy → flag KE 2.0", () => {
    const input = creaKnowledgeInput({
      superficieMq: 80,
      extra: {
        predisposizioneClima: true,
        allarme: true,
        automazioneCancello: true,
        fotovoltaico: true,
        ricaricaAuto: true,
        reteDati: true,
      },
    });

    expect(input.climatizzazione).toBe(true);
    expect(input.allarme).toBe(true);
    expect(input.cancelloAutomatico).toBe(true);
    expect(input.predisposizioneFotovoltaico).toBe(true);
    expect(input.predisposizioneColonnina).toBe(true);
    expect(input.reteDati).toBe(true);
    expect(input.extra.clima).toBe(true);
  });
});
