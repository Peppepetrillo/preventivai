import { describe, expect, it } from "vitest";

import {
  TRIAL_GIORNI,
  PIANO,
  calcolaStatoFreemium,
  giorniTrascorsiDalTrial,
  valutaAccessoFeature,
} from "./freemiumDomain";

describe("freemiumDomain", () => {
  it("espone trial di 15 giorni", () => {
    expect(TRIAL_GIORNI).toBe(15);
  });

  it("trial attivo con giorni rimanenti", () => {
    const inizio = new Date("2026-10-01T10:00:00.000Z");
    const ora = new Date("2026-10-05T10:00:00.000Z");
    const stato = calcolaStatoFreemium({ trialIniziatoIl: inizio }, ora);

    expect(stato.piano).toBe(PIANO.TRIAL);
    expect(stato.trialAttivo).toBe(true);
    expect(stato.giorniTrascorsi).toBe(4);
    expect(stato.giorniRimanenti).toBe(11);
    expect(stato.datiConservati).toBe(true);
    expect(stato.messaggioUtente).toMatch(/11 giorni/);
  });

  it("dopo 15 giorni passa a FREE senza cancellare dati", () => {
    const inizio = new Date("2026-09-01T08:00:00.000Z");
    const ora = new Date("2026-09-20T08:00:00.000Z");
    const stato = calcolaStatoFreemium({ trialIniziatoIl: inizio }, ora);

    expect(stato.piano).toBe(PIANO.FREE);
    expect(stato.trialScaduto).toBe(true);
    expect(stato.giorniRimanenti).toBe(0);
    expect(stato.datiConservati).toBe(true);
    expect(stato.messaggioUtente).toMatch(/dati restano/);
  });

  it("override PRO e abbonamento", () => {
    expect(
      calcolaStatoFreemium({ abbonamentoAttivo: true }).piano
    ).toBe(PIANO.PRO);
    expect(
      calcolaStatoFreemium({ pianoOverride: PIANO.PRO }).piano
    ).toBe(PIANO.PRO);
  });

  it("senza data trial: messaggio onboarding, dati conservati", () => {
    const stato = calcolaStatoFreemium({});
    expect(stato.piano).toBe(PIANO.TRIAL);
    expect(stato.trialAttivo).toBe(false);
    expect(stato.giorniRimanenti).toBe(TRIAL_GIORNI);
    expect(stato.datiConservati).toBe(true);
  });

  it("giorni trascorsi non negativi", () => {
    const inizio = new Date("2026-10-10T00:00:00.000Z");
    const ora = new Date("2026-10-01T00:00:00.000Z");
    expect(giorniTrascorsiDalTrial(inizio, ora)).toBe(0);
  });

  it("valutaAccessoFeature non blocca Free finché catalogo piani non definito", () => {
    const free = valutaAccessoFeature({ piano: PIANO.FREE, feature: "ai" });
    expect(free.consentito).toBe(true);
    expect(free.codice).toBe("free_senza_limiti_ancora");
  });
});
