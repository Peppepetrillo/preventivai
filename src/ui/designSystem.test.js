import { describe, expect, it } from "vitest";

import { classeBadgeStatoCantiere } from "./designSystem";

describe("designSystem badge stato", () => {
  it("mappa gli stati con semantica fissa DS v1.0", () => {
    expect(classeBadgeStatoCantiere("In corso")).toContain("ds-badge-in-corso");
    expect(classeBadgeStatoCantiere("Da iniziare")).toContain(
      "ds-badge-da-iniziare"
    );
    expect(classeBadgeStatoCantiere("Completato")).toContain(
      "ds-badge-completato"
    );
    expect(classeBadgeStatoCantiere("Sospeso")).toContain("ds-badge-sospeso");
  });
});
