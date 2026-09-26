import { describe, expect, it } from "vitest";

import { calcolaLeggeOhm } from "./ohm";
import {
  calcolaCorrenteMonofase,
  calcolaPotenzaMonofase,
  calcolaCorrenteTrifase,
  calcolaPotenzaTrifase,
  potenzaInWatt,
} from "./potenza";
import { calcolaCadutaTensione } from "./cadutaTensione";
import { stimaSezioneCavo, sezioneStandardMinima } from "./sezioneCavo";
import { calcolaEnergia } from "./energia";
import { convertiUnita, invertiUnita } from "./conversioni";
import { calcolaPotenzaImpegnata } from "./potenzaImpegnata";
import { RESISTIVITA, SEZIONI_STANDARD_MM2, SQRT3 } from "./constants";
import { formatNumeroIt, parseNumeroPositivo } from "./format";

describe("calcolaLeggeOhm", () => {
  it("calcola V = I × R", () => {
    const r = calcolaLeggeOhm({ corrente: 5, resistenza: 46 });
    expect(r.ok).toBe(true);
    expect(r.tensione).toBe(230);
    expect(r.formula).toBe("V = I × R");
  });

  it("calcola I = V / R (230/46)", () => {
    const r = calcolaLeggeOhm({ tensione: 230, resistenza: 46 });
    expect(r.ok).toBe(true);
    expect(r.corrente).toBeCloseTo(5, 10);
  });

  it("calcola R = V / I (230/5)", () => {
    const r = calcolaLeggeOhm({ tensione: 230, corrente: 5 });
    expect(r.ok).toBe(true);
    expect(r.resistenza).toBe(46);
  });

  it("230 / 10 → R", () => {
    const r = calcolaLeggeOhm({ tensione: 230, corrente: 10 });
    expect(r.ok).toBe(true);
    expect(r.resistenza).toBe(23);
  });

  it("rifiuta divisione per zero (I)", () => {
    const r = calcolaLeggeOhm({ tensione: 230, corrente: 0 });
    expect(r.ok).toBe(false);
    expect(r.errore).toMatch(/zero/i);
  });

  it("rifiuta divisione per zero (R)", () => {
    const r = calcolaLeggeOhm({ tensione: 230, resistenza: 0 });
    expect(r.ok).toBe(false);
  });

  it("rifiuta negativi", () => {
    expect(calcolaLeggeOhm({ tensione: -1, corrente: 1 }).ok).toBe(false);
  });

  it("richiede esattamente un vuoto", () => {
    expect(calcolaLeggeOhm({ tensione: 230, corrente: 5, resistenza: 46 }).ok).toBe(
      false
    );
    expect(calcolaLeggeOhm({ tensione: 230 }).ok).toBe(false);
  });
});

describe("potenza monofase/trifase", () => {
  it("P = 230 × 10", () => {
    const r = calcolaPotenzaMonofase({ tensioneV: 230, correnteA: 10 });
    expect(r.ok).toBe(true);
    expect(r.potenzaW).toBe(2300);
  });

  it("P = 230 × 16", () => {
    const r = calcolaPotenzaMonofase({ tensioneV: 230, correnteA: 16 });
    expect(r.ok).toBe(true);
    expect(r.potenzaW).toBe(3680);
  });

  it("I = P / V", () => {
    const r = calcolaCorrenteMonofase({ potenzaW: 2000, tensioneV: 230 });
    expect(r.ok).toBe(true);
    expect(r.correnteA).toBeCloseTo(2000 / 230, 10);
  });

  it("trifase P = √3 × V × I × cosφ", () => {
    const V = 400;
    const I = 10;
    const cos = 0.9;
    const r = calcolaPotenzaTrifase({ tensioneV: V, correnteA: I, cosPhi: cos });
    expect(r.ok).toBe(true);
    expect(r.potenzaW).toBeCloseTo(SQRT3 * V * I * cos, 10);
  });

  it("trifase I = P / (√3 × V × cosφ)", () => {
    const P = 11000;
    const V = 400;
    const cos = 0.85;
    const r = calcolaCorrenteTrifase({ potenzaW: P, tensioneV: V, cosPhi: cos });
    expect(r.ok).toBe(true);
    expect(r.correnteA).toBeCloseTo(P / (SQRT3 * V * cos), 10);
  });

  it("rifiuta tensione ≤ 0 e cosφ fuori range", () => {
    expect(
      calcolaCorrenteMonofase({ potenzaW: 1000, tensioneV: 0 }).errore
    ).toMatch(/tensione/i);
    expect(
      calcolaCorrenteTrifase({ potenzaW: 1000, tensioneV: 400, cosPhi: 1.2 }).ok
    ).toBe(false);
    expect(
      calcolaCorrenteTrifase({ potenzaW: 1000, tensioneV: 400, cosPhi: 0 }).ok
    ).toBe(false);
  });

  it("potenzaInWatt kW→W", () => {
    expect(potenzaInWatt(2, "kW")).toBe(2000);
    expect(potenzaInWatt(500, "W")).toBe(500);
  });
});

describe("caduta tensione", () => {
  it("monofase rame", () => {
    const r = calcolaCadutaTensione({
      tensioneNominaleV: 230,
      correnteA: 16,
      lunghezzaM: 30,
      sezioneMm2: 2.5,
      materiale: "rame",
      sistema: "monofase",
    });
    expect(r.ok).toBe(true);
    const expected =
      (2 * RESISTIVITA.rame * 30 * 16) / 2.5;
    expect(r.cadutaV).toBeCloseTo(expected, 10);
    expect(r.cadutaPercentuale).toBeCloseTo((expected / 230) * 100, 10);
    expect(r.avviso).toMatch(/indicativo/i);
  });

  it("trifase alluminio", () => {
    const r = calcolaCadutaTensione({
      tensioneNominaleV: 400,
      correnteA: 40,
      lunghezzaM: 50,
      sezioneMm2: 16,
      materiale: "alluminio",
      sistema: "trifase",
    });
    expect(r.ok).toBe(true);
    const expected =
      (SQRT3 * RESISTIVITA.alluminio * 50 * 40) / 16;
    expect(r.cadutaV).toBeCloseTo(expected, 10);
  });

  it("errori base", () => {
    expect(
      calcolaCadutaTensione({
        tensioneNominaleV: 0,
        correnteA: 1,
        lunghezzaM: 1,
        sezioneMm2: 1.5,
        materiale: "rame",
        sistema: "monofase",
      }).ok
    ).toBe(false);
  });
});

describe("stima sezione cavo", () => {
  it("caso piccolo monofase", () => {
    const r = stimaSezioneCavo({
      correnteA: 10,
      lunghezzaM: 20,
      tensioneV: 230,
      sistema: "monofase",
      materiale: "rame",
      cadutaMaxPercentuale: 4,
    });
    expect(r.ok).toBe(true);
    expect(r.sezioneStimataMm2).toBeGreaterThanOrEqual(r.sezioneCalcolataMm2);
    expect(SEZIONI_STANDARD_MM2).toContain(r.sezioneStimataMm2);
    expect(r.avviso).toMatch(/caduta di tensione/i);
  });

  it("caso medio trifase", () => {
    const r = stimaSezioneCavo({
      correnteA: 50,
      lunghezzaM: 80,
      tensioneV: 400,
      sistema: "trifase",
      materiale: "rame",
      cadutaMaxPercentuale: 3,
    });
    expect(r.ok).toBe(true);
    expect(r.sezioneStimataMm2).toBeGreaterThanOrEqual(10);
  });

  it("caso grande / limite catalogo", () => {
    const r = stimaSezioneCavo({
      correnteA: 400,
      lunghezzaM: 500,
      tensioneV: 400,
      sistema: "trifase",
      materiale: "alluminio",
      cadutaMaxPercentuale: 1,
    });
    if (r.ok) {
      expect(r.sezioneStimataMm2).toBeLessThanOrEqual(120);
    } else {
      expect(r.sezioneCalcolataMm2).toBeGreaterThan(120);
    }
  });

  it("sezioneStandardMinima arrotonda in su", () => {
    expect(sezioneStandardMinima(1.2)).toBe(1.5);
    expect(sezioneStandardMinima(2.5)).toBe(2.5);
    expect(sezioneStandardMinima(130)).toBeNull();
  });
});

describe("energia", () => {
  it("2 kW × 5 ore = 10 kWh", () => {
    const r = calcolaEnergia({
      potenza: 2,
      unitaPotenza: "kW",
      tempo: 5,
      unitaTempo: "ore",
    });
    expect(r.ok).toBe(true);
    expect(r.energiaKwh).toBe(10);
    expect(r.energiaWh).toBe(10000);
  });

  it("W × ore", () => {
    const r = calcolaEnergia({
      potenza: 500,
      unitaPotenza: "W",
      tempo: 2,
      unitaTempo: "ore",
    });
    expect(r.energiaKwh).toBe(1);
  });

  it("stima costo opzionale", () => {
    const r = calcolaEnergia({
      potenza: 2,
      unitaPotenza: "kW",
      tempo: 5,
      unitaTempo: "ore",
      costoPerKwh: 0.25,
    });
    expect(r.stimaCostoEuro).toBeCloseTo(2.5, 10);
    expect(r.avvisoCosto).toMatch(/Stima costo/i);
  });
});

describe("conversioni", () => {
  it("W ↔ kW", () => {
    expect(convertiUnita({ valore: 2000, da: "W", a: "kW" }).valore).toBe(2);
    expect(convertiUnita({ valore: 1.5, da: "kW", a: "W" }).valore).toBe(1500);
  });

  it("A ↔ mA", () => {
    expect(convertiUnita({ valore: 1, da: "A", a: "mA" }).valore).toBe(1000);
    expect(convertiUnita({ valore: 250, da: "mA", a: "A" }).valore).toBe(0.25);
  });

  it("m ↔ cm ↔ mm", () => {
    expect(convertiUnita({ valore: 1, da: "m", a: "cm" }).valore).toBe(100);
    expect(convertiUnita({ valore: 1, da: "m", a: "mm" }).valore).toBe(1000);
    expect(convertiUnita({ valore: 25, da: "mm", a: "cm" }).valore).toBe(2.5);
  });

  it("Ω ↔ kΩ", () => {
    expect(convertiUnita({ valore: 2200, da: "Ω", a: "kΩ" }).valore).toBe(2.2);
  });

  it("rifiuta famiglie diverse", () => {
    expect(convertiUnita({ valore: 1, da: "W", a: "A" }).ok).toBe(false);
  });

  it("invertiUnita", () => {
    expect(invertiUnita("W", "kW")).toEqual({ da: "kW", a: "W" });
  });
});

describe("potenza impegnata", () => {
  it("somma carichi + contemporaneità", () => {
    const r = calcolaPotenzaImpegnata({
      carichiW: [2000, 1500, 1800, 500],
      coefficienteContemporaneita: 0.7,
    });
    expect(r.ok).toBe(true);
    expect(r.potenzaInstallataW).toBe(5800);
    expect(r.potenzaContemporaneaW).toBeCloseTo(4060, 10);
    expect(r.avviso).toMatch(/Stima del carico/i);
  });
});

describe("format / parse", () => {
  it("parse rifiuta vuoto e NaN", () => {
    expect(parseNumeroPositivo("").ok).toBe(false);
    expect(parseNumeroPositivo("abc").ok).toBe(false);
    expect(parseNumeroPositivo("-1").ok).toBe(false);
    expect(parseNumeroPositivo("0").ok).toBe(false);
    expect(parseNumeroPositivo("0", { zeroConsentito: true }).value).toBe(0);
  });

  it("formatNumeroIt non mostra Infinity", () => {
    expect(formatNumeroIt(Infinity)).toBe("—");
    expect(formatNumeroIt(8.695652)).toMatch(/8,7/);
  });
});
