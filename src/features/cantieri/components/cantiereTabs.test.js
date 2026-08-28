import { describe, expect, it } from "vitest";

import { CANTIERE_TAB, tabDaSezioneId } from "./cantiereTabs";

describe("cantiereTabs UX-8.3", () => {
  it("mappa sezioni operative", () => {
    expect(tabDaSezioneId("#sezione-checklist")).toBe(CANTIERE_TAB.OPERATIVO);
    expect(tabDaSezioneId("sezione-materiali")).toBe(CANTIERE_TAB.OPERATIVO);
    expect(tabDaSezioneId("#sezione-foto")).toBe(CANTIERE_TAB.OPERATIVO);
  });

  it("mappa programmazione e registro su Giornate", () => {
    expect(tabDaSezioneId("#sezione-programmazione")).toBe(CANTIERE_TAB.GIORNATE);
    expect(tabDaSezioneId("#sezione-registro-lavori")).toBe(CANTIERE_TAB.GIORNATE);
  });

  it("mappa sezioni pagamenti e diario", () => {
    expect(tabDaSezioneId("#sezione-varianti")).toBe(CANTIERE_TAB.ECONOMICO);
    expect(tabDaSezioneId("#sezione-pagamenti")).toBe(CANTIERE_TAB.ECONOMICO);
    expect(tabDaSezioneId("#sezione-documenti")).toBe(CANTIERE_TAB.DOCUMENTI);
    expect(tabDaSezioneId("#sezione-diario")).toBe(CANTIERE_TAB.DOCUMENTI);
  });

  it("stato cantiere in header senza tab dedicato", () => {
    expect(tabDaSezioneId("#sezione-modifica")).toBeNull();
  });

  it("restituisce null per sezione sconosciuta", () => {
    expect(tabDaSezioneId("#sezione-sconosciuta")).toBeNull();
  });
});
