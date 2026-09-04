import { describe, expect, it } from "vitest";

import { ROUTES } from "../app/routes";
import {
  isAltroHubRoute,
  isDistintaEditorRoute,
  isVoceAttiva,
  shouldShowBottomNav,
  shouldShowGlobalCreateFab
} from "./bottomNavUtils";

describe("bottomNavUtils — editor distinta UX-4.3", () => {
  it("identifica le route editor distinta", () => {
    expect(isDistintaEditorRoute(ROUTES.nuovaDistintaMateriali)).toBe(true);
    expect(isDistintaEditorRoute("/distinte-materiali/d1")).toBe(true);
    expect(isDistintaEditorRoute(ROUTES.distinteMateriali)).toBe(false);
    expect(isDistintaEditorRoute("/acquisti")).toBe(false);
    expect(isDistintaEditorRoute("/catalogo-materiali")).toBe(false);
  });

  it("mostra BottomNav fuori dall'editor", () => {
    expect(shouldShowBottomNav({ pathname: ROUTES.distinteMateriali })).toBe(
      true
    );
    expect(shouldShowBottomNav({ pathname: ROUTES.acquisti })).toBe(true);
    expect(shouldShowBottomNav({ pathname: ROUTES.catalogoMateriali })).toBe(
      true
    );
  });

  it("nasconde BottomNav nell'editor distinta", () => {
    expect(
      shouldShowBottomNav({ pathname: ROUTES.nuovaDistintaMateriali })
    ).toBe(false);
    expect(
      shouldShowBottomNav({ pathname: "/distinte-materiali/abc123" })
    ).toBe(false);
  });
});

describe("BottomNav isVoceAttiva UX-8.1", () => {
  const voceCantieri = { path: ROUTES.cantieri };
  const voceIncassi = { path: ROUTES.incassi };
  const vocePreventivi = { path: ROUTES.preventivi };
  const voceAltro = { path: ROUTES.altro };

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

  it("evidenzia Preventivi su lista, wizard nuovo, archivio e dettaglio", () => {
    expect(isVoceAttiva({ pathname: "/archivio" }, vocePreventivi)).toBe(true);
    expect(isVoceAttiva({ pathname: "/preventivi" }, vocePreventivi)).toBe(true);
    expect(
      isVoceAttiva({ pathname: "/preventivi/nuovo" }, vocePreventivi)
    ).toBe(true);
    expect(
      isVoceAttiva({ pathname: "/preventivo/9" }, vocePreventivi)
    ).toBe(true);
    expect(
      isVoceAttiva({ pathname: "/nuovo-preventivo" }, vocePreventivi)
    ).toBe(true);
  });

  it("evidenzia Altro sull'hub e sulle route collegate", () => {
    expect(isVoceAttiva({ pathname: ROUTES.altro }, voceAltro)).toBe(true);
    expect(isVoceAttiva({ pathname: ROUTES.agenda }, voceAltro)).toBe(true);
    expect(isVoceAttiva({ pathname: ROUTES.clienti }, voceAltro)).toBe(true);
    expect(isVoceAttiva({ pathname: "/cliente/3" }, voceAltro)).toBe(true);
    expect(isVoceAttiva({ pathname: ROUTES.impostazioni }, voceAltro)).toBe(true);
    expect(isVoceAttiva({ pathname: ROUTES.cestino }, voceAltro)).toBe(true);
    expect(isVoceAttiva({ pathname: ROUTES.acquisti }, voceAltro)).toBe(true);
    expect(isVoceAttiva({ pathname: "/" }, voceAltro)).toBe(false);
  });

  it("evidenzia Altro sul Cestino", () => {
    expect(isVoceAttiva({ pathname: ROUTES.cestino }, voceAltro)).toBe(true);
  });

  it("isAltroHubRoute copre le route dell'hub", () => {
    expect(isAltroHubRoute(ROUTES.listino)).toBe(true);
    expect(isAltroHubRoute(ROUTES.catalogoMateriali)).toBe(true);
    expect(isAltroHubRoute(ROUTES.distinteMateriali)).toBe(true);
    expect(isAltroHubRoute(ROUTES.economia)).toBe(true);
    expect(isAltroHubRoute(ROUTES.storico)).toBe(true);
    expect(isAltroHubRoute(ROUTES.datiAzienda)).toBe(true);
    expect(isAltroHubRoute("/preventivi")).toBe(false);
  });

  it("nasconde GlobalCreate FAB su Agenda", () => {
    expect(shouldShowGlobalCreateFab({ pathname: ROUTES.agenda })).toBe(false);
    expect(shouldShowGlobalCreateFab({ pathname: ROUTES.dashboard })).toBe(true);
  });
});
