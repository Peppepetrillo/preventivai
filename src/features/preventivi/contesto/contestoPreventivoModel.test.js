import { describe, expect, it } from "vitest";

import {
  SERIE_CIVILE_DEFAULT_ID,
  creaContestoPreventivo,
  creaSerieCivile,
  eliminaSerieCivile,
  rinominaSerieCivile,
  aggiornaContestoPreventivo,
  CONTESTO_PREVENTIVO_SLOTS,
} from "./contestoPreventivoModel";

describe("contestoPreventivoModel", () => {
  it("crea contesto con default BTicino Living Now", () => {
    const contesto = creaContestoPreventivo();
    expect(contesto.serieCivileId).toBe(SERIE_CIVILE_DEFAULT_ID);
    expect(contesto.marcaMaterialeId).toBeNull();
    expect(contesto._version).toBe(1);
  });

  it("espone slot futuri riservati", () => {
    const ids = CONTESTO_PREVENTIVO_SLOTS.map((s) => s.id);
    expect(ids).toContain("serieCivile");
    expect(ids).toContain("marcaMateriale");
    expect(ids).toContain("garanzia");
  });

  it("aggiorna solo i campi patchati", () => {
    const base = creaContestoPreventivo();
    const prossimo = aggiornaContestoPreventivo(base, {
      serieCivileId: "custom-1",
    });
    expect(prossimo.serieCivileId).toBe("custom-1");
    expect(prossimo.livelloImpianto).toBeNull();
  });

  it("crea e rinomina serie custom", () => {
    const nuova = creaSerieCivile("Vimar Plana");
    expect(nuova.system).toBe(false);
    const elenco = [{ id: SERIE_CIVILE_DEFAULT_ID, nome: "BTicino Living Now", system: true }, nuova];
    const rinominate = rinominaSerieCivile(elenco, nuova.id, "Vimar Idea");
    expect(rinominate.find((s) => s.id === nuova.id).nome).toBe("Vimar Idea");
  });

  it("impedisce eliminazione serie di sistema o in uso", () => {
    const custom = creaSerieCivile("Gewiss Chorus");
    const elenco = [
      { id: SERIE_CIVILE_DEFAULT_ID, nome: "BTicino Living Now", system: true },
      custom,
    ];

    expect(() =>
      eliminaSerieCivile(elenco, SERIE_CIVILE_DEFAULT_ID, {})
    ).toThrow(/predefinita/i);

    expect(() =>
      eliminaSerieCivile(elenco, custom.id, { serieCivileId: custom.id })
    ).toThrow(/in uso/i);

    const dopo = eliminaSerieCivile(elenco, custom.id, {
      serieCivileId: SERIE_CIVILE_DEFAULT_ID,
    });
    expect(dopo).toHaveLength(1);
  });
});
