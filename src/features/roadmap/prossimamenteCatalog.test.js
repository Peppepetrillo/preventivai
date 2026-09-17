import { describe, expect, it } from "vitest";

import { PROSSIMAMENTE_VOCI } from "./prossimamenteCatalog";

describe("prossimamenteCatalog", () => {
  it("espone solo roadmap con badge e senza prezzi", () => {
    expect(PROSSIMAMENTE_VOCI.length).toBeGreaterThanOrEqual(7);
    for (const voce of PROSSIMAMENTE_VOCI) {
      expect(voce.id).toBeTruthy();
      expect(voce.titolo).toBeTruthy();
      expect(voce.descrizione).toBeTruthy();
      expect(["IN ARRIVO", "PROSSIMA VERSIONE"]).toContain(voce.badge);
      expect(voce.Icon).toBeTruthy();
      expect(JSON.stringify(voce)).not.toMatch(/\d+\s*€|EUR/i);
    }
  });
});
