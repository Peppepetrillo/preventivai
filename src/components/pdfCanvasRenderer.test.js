import { describe, expect, it } from "vitest";

import {
  PDF_DPR_CAP,
  PDF_MAX_CANVAS_EDGE,
  PDF_ZOOM_RERENDER_THRESHOLD,
  calcolaDimensioniCanvasPdf,
  deveRirenderizzarePerZoom,
  leggiDevicePixelRatio,
} from "./pdfCanvasRenderer";

describe("pdfCanvasRenderer — risoluzione HD", () => {
  it("cap DPR a PDF_DPR_CAP", () => {
    expect(leggiDevicePixelRatio({ devicePixelRatio: 1 })).toBe(1);
    expect(leggiDevicePixelRatio({ devicePixelRatio: 2 })).toBe(2);
    expect(leggiDevicePixelRatio({ devicePixelRatio: 3 })).toBe(3);
    expect(leggiDevicePixelRatio({ devicePixelRatio: 4 })).toBe(PDF_DPR_CAP);
    expect(leggiDevicePixelRatio({ devicePixelRatio: 0 })).toBe(1);
  });

  it("calcola canvas interno = CSS × DPR × zoomRender (senza solo CSS scale)", () => {
    const d = calcolaDimensioniCanvasPdf({
      larghezzaCss: 400,
      pageWidth: 200,
      pageHeight: 280,
      dpr: 2,
      zoomRender: 1,
    });
    // fit scale = 2; viewport = 2 * 2 * 1 = 4 → canvas 800×1120
    expect(d.scalaFit).toBe(2);
    expect(d.canvasWidth).toBe(800);
    expect(d.canvasHeight).toBe(1120);
    expect(d.cssWidth).toBe(400);
    expect(d.cssHeight).toBe(560);
    expect(d.viewportScale).toBe(4);
  });

  it("aumenta i pixel del bitmap quando zoomRender > 1", () => {
    const base = calcolaDimensioniCanvasPdf({
      larghezzaCss: 400,
      pageWidth: 200,
      pageHeight: 280,
      dpr: 2,
      zoomRender: 1,
    });
    const zoomed = calcolaDimensioniCanvasPdf({
      larghezzaCss: 400,
      pageWidth: 200,
      pageHeight: 280,
      dpr: 2,
      zoomRender: 2,
    });
    expect(zoomed.canvasWidth).toBe(base.canvasWidth * 2);
    expect(zoomed.canvasHeight).toBe(base.canvasHeight * 2);
    // CSS size resta fit-width (il pinch CSS continua a gestire il display)
    expect(zoomed.cssWidth).toBe(base.cssWidth);
    expect(zoomed.cssHeight).toBe(base.cssHeight);
  });

  it("rispetta maxEdge per non sforare memoria", () => {
    const d = calcolaDimensioniCanvasPdf({
      larghezzaCss: 800,
      pageWidth: 100,
      pageHeight: 100,
      dpr: 3,
      zoomRender: 4,
      maxEdge: 1000,
    });
    expect(Math.max(d.canvasWidth, d.canvasHeight)).toBeLessThanOrEqual(1000);
    expect(d.zoomRenderEffettivo).toBeLessThan(4);
  });

  it("soglia re-render: evita render a ogni frame del pinch", () => {
    expect(deveRirenderizzarePerZoom(1, 1)).toBe(false);
    expect(deveRirenderizzarePerZoom(1.1, 1)).toBe(false);
    expect(
      deveRirenderizzarePerZoom(1 + PDF_ZOOM_RERENDER_THRESHOLD, 1)
    ).toBe(true);
    expect(deveRirenderizzarePerZoom(2, 1)).toBe(true);
    expect(deveRirenderizzarePerZoom(1, 2.5)).toBe(true);
    expect(deveRirenderizzarePerZoom(2.1, 2)).toBe(false);
  });

  it("costanti di sicurezza presenti", () => {
    expect(PDF_MAX_CANVAS_EDGE).toBeGreaterThanOrEqual(2048);
    expect(PDF_ZOOM_RERENDER_THRESHOLD).toBeGreaterThan(0);
  });
});
