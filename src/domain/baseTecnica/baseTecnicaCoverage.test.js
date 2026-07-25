/**
 * Sprint BT-003 — coverage Base Tecnica ↔ Catalogo ↔ Listino.
 */

import { describe, expect, it } from "vitest";

import {
  isCatalogoId,
  CATALOGO_BY_ID,
  risolviPrezzoDaCatalogo,
} from "../catalogo";
import { listinoBase } from "../../data/listinoBase";
import { runKnowledgeEngine } from "../knowledge/knowledgeEngine";
import {
  BASE_TECNICA_SCHEDE,
  reportCoverageBaseTecnica,
  riepilogoCoverage,
  STATO_COVERAGE,
  statoCoverageCatalogoId,
  validaSchedeBaseTecnica,
} from "./index";

describe("BT-003 — Catalogo completo", () => {
  it("espone LINEA_INDUZIONE e VIDEOCITOFONO", () => {
    expect(isCatalogoId("LINEA_INDUZIONE")).toBe(true);
    expect(isCatalogoId("VIDEOCITOFONO")).toBe(true);

    const induzione = CATALOGO_BY_ID.LINEA_INDUZIONE;
    expect(induzione).toMatchObject({
      id: "LINEA_INDUZIONE",
      nome: expect.any(String),
      categoria: "Cucina",
      unita: "cad",
      chiaveListino: "linea-induzione",
    });
    expect(induzione).not.toHaveProperty("prezzo");

    const video = CATALOGO_BY_ID.VIDEOCITOFONO;
    expect(video).toMatchObject({
      id: "VIDEOCITOFONO",
      chiaveListino: "predisposizione-videocitofono",
    });
    expect(video).not.toHaveProperty("prezzo");
  });

  it("risolve prezzi Listino per le nuove voci (via chiaveListino)", () => {
    const induzione = risolviPrezzoDaCatalogo("LINEA_INDUZIONE", listinoBase);
    expect(induzione.prezzoConfigurato).toBe(true);
    expect(induzione.voceListino.id).toBe("linea-induzione");
    expect(induzione.prezzoUnitario).toBe(120);

    const video = risolviPrezzoDaCatalogo("VIDEOCITOFONO", listinoBase);
    expect(video.prezzoConfigurato).toBe(true);
    expect(video.voceListino.id).toBe("predisposizione-videocitofono");
    expect(video.prezzoUnitario).toBe(180);
  });
});

describe("BT-003 — gap report", () => {
  it("genera report con stati OK | MANCANTE_CATALOGO | MANCANTE_LISTINO", () => {
    const report = reportCoverageBaseTecnica();
    expect(report.length).toBeGreaterThan(0);
    expect(
      report.every((r) =>
        Object.values(STATO_COVERAGE).includes(r.stato)
      )
    ).toBe(true);

    expect(statoCoverageCatalogoId("LINEA_INDUZIONE")).toBe(STATO_COVERAGE.OK);
    expect(statoCoverageCatalogoId("VIDEOCITOFONO")).toBe(STATO_COVERAGE.OK);
    expect(statoCoverageCatalogoId("INESISTENTE_XYZ")).toBe(
      STATO_COVERAGE.MANCANTE_CATALOGO
    );
    expect(statoCoverageCatalogoId("BUS")).toBe(STATO_COVERAGE.MANCANTE_LISTINO);
  });

  it("riepilogo espone gap residui senza LINEA_INDUZIONE / VIDEOCITOFONO", () => {
    const riepilogo = riepilogoCoverage();
    expect(riepilogo.OK).toBeGreaterThan(0);
    const gapIds = riepilogo.gap.map((g) => g.catalogoId);
    expect(gapIds).not.toContain("LINEA_INDUZIONE");
    expect(gapIds).not.toContain("VIDEOCITOFONO");
    expect(gapIds).toEqual(
      expect.arrayContaining(["BUS", "CANCELLO", "VIDEOSORVEGLIANZA"])
    );
  });
});

describe("BT-003 — Base Tecnica ↔ Catalogo", () => {
  it("ogni scheda ha campi spiegabili e catalogoId validi", () => {
    const errori = validaSchedeBaseTecnica();
    expect(errori).toEqual([]);

    for (const scheda of BASE_TECNICA_SCHEDE) {
      expect(scheda.motivazione).toBeTruthy();
      expect(scheda.origine?.tipo).toBeTruthy();
      expect(scheda.verificheProfessionista.length).toBeGreaterThan(0);
      expect(scheda.livelloAffidabilita).toBeTruthy();
      for (const id of scheda.catalogoIds) {
        expect(isCatalogoId(id)).toBe(true);
      }
    }
  });

  it("BT_CUCINA_INDUZIONE e BT_VIDEOCITOFONO collegano catalogoId presenti", () => {
    const induzione = BASE_TECNICA_SCHEDE.find(
      (s) => s.id === "BT_CUCINA_INDUZIONE"
    );
    const video = BASE_TECNICA_SCHEDE.find((s) => s.id === "BT_VIDEOCITOFONO");
    expect(induzione.catalogoIds).toContain("LINEA_INDUZIONE");
    expect(video.catalogoIds).toContain("VIDEOCITOFONO");
    expect(statoCoverageCatalogoId("LINEA_INDUZIONE")).toBe("OK");
    expect(statoCoverageCatalogoId("VIDEOCITOFONO")).toBe("OK");
  });
});

describe("BT-003 — Knowledge Engine → BT", () => {
  it("suggerimenti hanno catalogoId, quantita, schedaTecnicaId e nessun prezzo", () => {
    const proposta = runKnowledgeEngine({
      superficieMq: 60,
      tipoImmobile: "appartamento",
      cucina: "induzione",
      videocitofono: true,
      climatizzazione: true,
    });

    expect(proposta.suggerimenti.length).toBeGreaterThan(0);
    for (const sug of proposta.suggerimenti) {
      expect(sug.catalogoId || sug.id).toBeTruthy();
      expect(Number(sug.quantita)).toBeGreaterThan(0);
      expect(sug).not.toHaveProperty("prezzo");
      expect(sug).not.toHaveProperty("prezzoUnitario");
      const json = JSON.stringify(sug);
      expect(json).not.toMatch(/"prezzoUnitario"|"prezzo":/);
    }

    const induzione = proposta.suggerimenti.find(
      (s) => s.catalogoId === "LINEA_INDUZIONE"
    );
    expect(induzione).toMatchObject({
      catalogoId: "LINEA_INDUZIONE",
      quantita: 1,
      schedaTecnicaId: "BT_CUCINA_INDUZIONE",
    });
    expect(induzione.motivazione).toBeTruthy();
    expect(induzione.origineTecnica?.tipo).toBeTruthy();

    const video = proposta.suggerimenti.find(
      (s) => s.catalogoId === "VIDEOCITOFONO"
    );
    expect(video).toMatchObject({
      catalogoId: "VIDEOCITOFONO",
      schedaTecnicaId: "BT_VIDEOCITOFONO",
    });
  });
});
