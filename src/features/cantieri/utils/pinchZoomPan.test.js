import { describe, expect, it } from "vitest";

import {
  applicaDoppioTap,
  applicaPan,
  applicaZoomAt,
  stileTransformZoom,
  ZOOM_MAX,
  ZOOM_MIN,
} from "./pinchZoomPan";

describe("pinchZoomPan", () => {
  it("applica zoom avanti e indietro entro limiti", () => {
    const base = { scale: 1, x: 0, y: 0 };
    const zoomed = applicaZoomAt(base, 2, { cx: 100, cy: 100 });
    expect(zoomed.scale).toBe(2);
    expect(zoomed.scale).toBeLessThanOrEqual(ZOOM_MAX);

    const capped = applicaZoomAt(base, 10, { cx: 50, cy: 50 });
    expect(capped.scale).toBe(ZOOM_MAX);

    const reset = applicaZoomAt(zoomed, 0.1, { cx: 100, cy: 100 });
    expect(reset.scale).toBe(ZOOM_MIN);
    expect(reset.x).toBe(0);
    expect(reset.y).toBe(0);
  });

  it("pan solo se zoomato", () => {
    expect(applicaPan({ scale: 1, x: 0, y: 0 }, { dx: 10, dy: 5 })).toEqual({
      scale: ZOOM_MIN,
      x: 0,
      y: 0,
    });
    expect(applicaPan({ scale: 2, x: 1, y: 2 }, { dx: 10, dy: 5 })).toEqual({
      scale: 2,
      x: 11,
      y: 7,
    });
  });

  it("doppio tap alterna zoom", () => {
    const up = applicaDoppioTap({ scale: 1, x: 0, y: 0 }, { cx: 40, cy: 40 });
    expect(up.scale).toBeGreaterThan(1);
    const down = applicaDoppioTap(up, { cx: 40, cy: 40 });
    expect(down.scale).toBe(ZOOM_MIN);
  });

  it("stile transform per CSS", () => {
    const stile = stileTransformZoom({ scale: 2, x: 10, y: -5 });
    expect(stile.transform).toContain("translate3d(10px, -5px, 0)");
    expect(stile.transform).toContain("scale(2)");
    expect(stile.touchAction).toBe("none");
  });
});
