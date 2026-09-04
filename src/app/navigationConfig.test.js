import { describe, expect, it } from "vitest";

import { ROUTES } from "./routes";
import {
  BOTTOM_NAV_ROOTS,
  canUseHistoryBack,
  destinazioneParentOHome,
  isBottomNavRoot,
  isEdgeSwipeDisabilitato,
  richiedeNavigazioneIndietro,
  risolviParentPath
} from "./navigationConfig";

describe("navigationConfig — gerarchia parent", () => {
  it("BottomNav roots senza parent", () => {
    for (const root of BOTTOM_NAV_ROOTS) {
      expect(risolviParentPath(root)).toBeNull();
      expect(richiedeNavigazioneIndietro(root)).toBe(false);
      expect(isEdgeSwipeDisabilitato(root)).toBe(true);
      expect(isBottomNavRoot(root)).toBe(true);
    }
  });

  it("hub Altro → parent Altro", () => {
    expect(risolviParentPath(ROUTES.economia)).toBe(ROUTES.altro);
    expect(risolviParentPath(ROUTES.storico)).toBe(ROUTES.altro);
    expect(risolviParentPath(ROUTES.agenda)).toBe(ROUTES.altro);
    expect(risolviParentPath(ROUTES.clienti)).toBe(ROUTES.altro);
    expect(risolviParentPath(ROUTES.acquisti)).toBe(ROUTES.altro);
    expect(risolviParentPath(ROUTES.listino)).toBe(ROUTES.altro);
    expect(risolviParentPath(ROUTES.catalogoMateriali)).toBe(ROUTES.altro);
    expect(risolviParentPath(ROUTES.distinteMateriali)).toBe(ROUTES.altro);
    expect(risolviParentPath(ROUTES.impostazioni)).toBe(ROUTES.altro);
  });

  it("profondità Impostazioni", () => {
    expect(risolviParentPath(ROUTES.datiAzienda)).toBe(ROUTES.impostazioni);
    expect(risolviParentPath(ROUTES.cestino)).toBe(ROUTES.impostazioni);
  });

  it("cluster Preventivi / Cantieri / Clienti", () => {
    expect(risolviParentPath(ROUTES.incassi)).toBe(ROUTES.preventivi);
    expect(risolviParentPath(ROUTES.preventivoIntelligente)).toBe(
      ROUTES.preventivi
    );
    expect(risolviParentPath(ROUTES.preventiviNuovo)).toBe(ROUTES.preventivi);
    expect(risolviParentPath("/cantiere/abc")).toBe(ROUTES.cantieri);
    expect(risolviParentPath("/preventivo/xyz")).toBe(ROUTES.preventivi);
    expect(risolviParentPath("/cliente/1")).toBe(ROUTES.clienti);
    expect(risolviParentPath("/distinte-materiali/nuova")).toBe(
      ROUTES.distinteMateriali
    );
    expect(risolviParentPath("/distinte-materiali/d1")).toBe(
      ROUTES.distinteMateriali
    );
  });

  it("fallback home se path senza parent", () => {
    expect(destinazioneParentOHome("/sconosciuta")).toBe(ROUTES.dashboard);
  });

  it("Agenda ha Back ma edge swipe disabilitato", () => {
    expect(richiedeNavigazioneIndietro(ROUTES.agenda)).toBe(true);
    expect(isEdgeSwipeDisabilitato(ROUTES.agenda)).toBe(true);
  });

  it("normalizza trailing slash", () => {
    expect(risolviParentPath("/economia/")).toBe(ROUTES.altro);
  });

  it("canUseHistoryBack legge history.state.idx", () => {
    expect(canUseHistoryBack({ history: { state: { idx: 0 } } })).toBe(false);
    expect(canUseHistoryBack({ history: { state: { idx: 2 } } })).toBe(true);
    expect(canUseHistoryBack({ history: { state: {} } })).toBe(false);
    expect(canUseHistoryBack(null)).toBe(false);
  });
});
