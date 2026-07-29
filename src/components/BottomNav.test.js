import { describe, expect, it } from "vitest";

import { ROUTES } from "../app/routes";
import { isVoceAttiva } from "./bottomNavUtils";

describe("BottomNav isVoceAttiva RC-2B", () => {
  const voceCantieri = { path: ROUTES.cantieri };
  const voceIncassi = { path: ROUTES.incassi };
  const voceArchivio = { path: ROUTES.archivio };
  const vocePreventivi = { path: ROUTES.preventivi };
  const voceClienti = { path: ROUTES.clienti };
  const voceAgenda = { path: ROUTES.agenda };

  it("evidenzia Cantieri su lista e dettaglio", () => {
    expect(isVoceAttiva({ pathname: "/cantieri" }, voceCantieri)).toBe(true);
    expect(isVoceAttiva({ pathname: "/cantiere/42" }, voceCantieri)).toBe(true);
  });

  it("non evidenzia Incassi sul dettaglio preventivo", () => {
    expect(
      isVoceAttiva({ pathname: "/preventivo/9" }, voceIncassi)
    ).toBe(false);
    expect(isVoceAttiva({ pathname: "/incassi" }, voceIncassi)).toBe(true);
  });

  it("evidenzia la sezione Preventivi su archivio, wizard e dettaglio", () => {
    expect(isVoceAttiva({ pathname: "/archivio" }, voceArchivio)).toBe(true);
    expect(isVoceAttiva({ pathname: "/preventivi" }, voceArchivio)).toBe(true);
    expect(
      isVoceAttiva({ pathname: "/preventivo/9" }, voceArchivio)
    ).toBe(true);
    expect(
      isVoceAttiva({ pathname: "/preventivo/9" }, vocePreventivi)
    ).toBe(true);
  });

  it("evidenzia Clienti sul dettaglio cliente", () => {
    expect(isVoceAttiva({ pathname: "/cliente/3" }, voceClienti)).toBe(true);
    expect(isVoceAttiva({ pathname: "/" }, voceClienti)).toBe(false);
  });

  it("evidenzia Agenda solo sulla route agenda", () => {
    expect(isVoceAttiva({ pathname: "/agenda" }, voceAgenda)).toBe(true);
    expect(isVoceAttiva({ pathname: "/cantieri" }, voceAgenda)).toBe(false);
  });
});
