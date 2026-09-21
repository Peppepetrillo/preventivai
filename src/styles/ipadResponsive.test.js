import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Guardie CSS iPad: le classi DS tablet devono restare definite
 * senza toccare business logic.
 */
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");

describe("iPad responsive CSS tokens", () => {
  const css = readFileSync(join(ROOT, "src/index.css"), "utf8");

  it("definisce breakpoint tablet 768 e large 1024", () => {
    expect(css).toMatch(/@media \(min-width: 768px\)/);
    expect(css).toMatch(/@media \(min-width: 1024px\)/);
  });

  it("espone hub/card/kpi/cta grid e bottom-sheet tablet", () => {
    expect(css).toContain(".ds-hub-grid");
    expect(css).toContain(".ds-card-grid");
    expect(css).toContain(".ds-kpi-grid");
    expect(css).toContain(".ds-cta-row");
    expect(css).toContain(".ds-bottom-sheet");
  });

  it("KPI: 2 colonne a 768px, 4 a 1024px", () => {
    const blocco768 = css.slice(
      css.indexOf("@media (min-width: 768px)"),
      css.indexOf("@media (min-width: 1024px)")
    );
    const blocco1024 = css.slice(css.indexOf("@media (min-width: 1024px)"));
    expect(blocco768).toMatch(
      /\.ds-kpi-grid\s*\{[^}]*repeat\(2,\s*minmax\(0,\s*1fr\)\)/s
    );
    expect(blocco1024).toMatch(
      /\.ds-kpi-grid\s*\{[^}]*repeat\(4,\s*minmax\(0,\s*1fr\)\)/s
    );
  });

  it("BottomSheet monta la classe ds-bottom-sheet", () => {
    const jsx = readFileSync(
      join(ROOT, "src/components/BottomSheet.jsx"),
      "utf8"
    );
    expect(jsx).toContain("ds-bottom-sheet");
    expect(jsx).toContain("md:items-center");
  });
});
