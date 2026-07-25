import { describe, expect, it } from "vitest";

import {
  arrotondaAffidabilita,
  calcolaStatistichePattern,
  eseguiPatternEngine,
  estraiFirmeModifica,
  individuaExtraRicorrenti,
  individuaModificheRicorrenti,
  raggruppaOsservazioni,
} from "./brainPatternEngine";
import {
  BRAIN_PATTERN_SOGLIE,
  BRAIN_PATTERN_STATI,
  risolviFasciaMq,
} from "./brainPatternTypes";

function oss({
  tipo = "villa",
  mq = 160,
  livelli = 2,
  impianto = "premium",
  extra = { predisposizioneClima: true },
  modifiche = {},
} = {}) {
  return {
    id: `o-${Math.random()}`,
    createdAt: Date.now(),
    tipoImmobile: tipo,
    superficieMq: mq,
    livelli,
    livelloImpianto: impianto,
    extra,
    propostaOriginale: {},
    modificheUtente: modifiche,
  };
}

describe("brainPatternTypes / soglie", () => {
  it("espone soglie configurabili", () => {
    expect(BRAIN_PATTERN_SOGLIE.MIN_OSSERVAZIONI).toBe(5);
    expect(BRAIN_PATTERN_SOGLIE.MIN_RIPETIZIONE).toBe(0.8);
  });

  it("risolve fasce mq incluso >150", () => {
    expect(risolviFasciaMq(40).label).toBe("≤50 mq");
    expect(risolviFasciaMq(120).id).toBe("101-150");
    expect(risolviFasciaMq(160).label).toBe(">150 mq");
  });
});

describe("brainPatternEngine", () => {
  it("non propone pattern sotto le soglie", () => {
    const osservazioni = Array.from({ length: 4 }, () => oss());
    expect(eseguiPatternEngine(osservazioni).patterns).toEqual([]);
  });

  it("trova pattern clima su ville >150 mq con ripetizione ≥ 80%", () => {
    const osservazioni = [
      ...Array.from({ length: 8 }, () =>
        oss({ extra: { predisposizioneClima: true } })
      ),
      ...Array.from({ length: 1 }, () => oss({ extra: {} })),
    ];
    // 8/9 ≈ 88.9% ≥ 80%, gruppo size 9 ≥ 5
    const { patterns } = eseguiPatternEngine(osservazioni);
    expect(patterns.length).toBeGreaterThanOrEqual(1);
    const clima = patterns.find((p) => p.suggerimento?.chiave === "predisposizioneClima");
    expect(clima).toBeTruthy();
    expect(clima.nome).toContain("VILLA");
    expect(clima.nome).toContain(">150 mq");
    expect(clima.nome.toUpperCase()).toContain("CLIMA");
    expect(clima.suggerimento.testo).toBe("Predisposizione climatizzazione");
    expect(clima.osservazioni).toBe(8);
    expect(clima.affidabilita).toBeGreaterThanOrEqual(80);
    expect(clima.stato).toBe(BRAIN_PATTERN_STATI.NUOVO);
  });

  it("individua modifiche utente ripetute", () => {
    const osservazioni = Array.from({ length: 5 }, () =>
      oss({
        extra: {},
        modifiche: { campo: "puntiStimati", a: 200 },
      })
    );
    const gruppo = Object.values(raggruppaOsservazioni(osservazioni))[0];
    const candidati = individuaModificheRicorrenti(gruppo, 0.8);
    expect(candidati).toHaveLength(1);
    expect(candidati[0].suggerimento.chiave).toBe("puntiStimati");
    expect(candidati[0].affidabilita).toBe(100);
  });

  it("rispetta soglie custom", () => {
    const osservazioni = Array.from({ length: 3 }, () =>
      oss({ extra: { domotica: true } })
    );
    expect(
      eseguiPatternEngine(osservazioni, {
        MIN_OSSERVAZIONI: 3,
        MIN_RIPETIZIONE: 1,
      }).patterns.length
    ).toBeGreaterThanOrEqual(1);
  });

  it("calcola affidabilità e statistiche", () => {
    expect(arrotondaAffidabilita(0.944)).toBe(94.4);
    expect(
      calcolaStatistichePattern([
        { stato: "nuovo" },
        { stato: "nuovo" },
        { stato: "accettato" },
        { stato: "rifiutato" },
      ])
    ).toEqual({
      totale: 4,
      nuovi: 2,
      proposti: 0,
      accettati: 1,
      rifiutati: 1,
    });
  });

  it("estrae firme modifica da array e oggetti", () => {
    expect(
      estraiFirmeModifica([{ campo: "quadro", a: "36" }])[0].testo
    ).toContain("quadro");
    expect(estraiFirmeModifica({})).toEqual([]);
    expect(
      estraiFirmeModifica({ puntiStimati: 120 })[0].chiave
    ).toBe("puntiStimati");
  });

  it("extra sotto soglia ripetizione non genera pattern", () => {
    const osservazioni = [
      ...Array.from({ length: 5 }, () => oss({ extra: { predisposizioneClima: true } })),
      ...Array.from({ length: 5 }, () => oss({ extra: {} })),
    ];
    // 5/10 = 50% < 80%
    const gruppo = Object.values(raggruppaOsservazioni(osservazioni))[0];
    expect(individuaExtraRicorrenti(gruppo, 0.8)).toEqual([]);
  });
});
