import { describe, expect, it } from "vitest";

import { CANTIERE_TAB, tabDaSezioneId } from "./cantiereTabs";

describe("cantiereTabs", () => {
  it("mappa sezioni operative", () => {
    expect(tabDaSezioneId("#sezione-checklist")).toBe(CANTIERE_TAB.OPERATIVO);
    expect(tabDaSezioneId("sezione-materiali")).toBe(CANTIERE_TAB.OPERATIVO);
    expect(tabDaSezioneId("#sezione-foto")).toBe(CANTIERE_TAB.OPERATIVO);
  });

  it("mappa sezioni economiche", () => {
    expect(tabDaSezioneId("#sezione-varianti")).toBe(CANTIERE_TAB.ECONOMICO);
    expect(tabDaSezioneId("#sezione-pagamenti")).toBe(CANTIERE_TAB.ECONOMICO);
  });

  it("mappa documenti e impostazioni", () => {
    expect(tabDaSezioneId("#sezione-documenti")).toBe(CANTIERE_TAB.DOCUMENTI);
    expect(tabDaSezioneId("#sezione-diario")).toBe(CANTIERE_TAB.DOCUMENTI);
    expect(tabDaSezioneId("#sezione-modifica")).toBe(CANTIERE_TAB.IMPOSTAZIONI);
  });

  it("restituisce null per sezione sconosciuta", () => {
    expect(tabDaSezioneId("#sezione-sconosciuta")).toBeNull();
  });
});
