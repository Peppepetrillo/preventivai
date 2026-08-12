import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import CantiereSegmentBar from "./CantiereSegmentBar";

describe("CantiereSegmentBar", () => {
  it("renderizza 4 tab con touch target e aria-selected", () => {
    const onCambiaTab = vi.fn();
    render(<CantiereSegmentBar tabAttivo="operativo" onCambiaTab={onCambiaTab} />);

    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(4);
    expect(screen.getByRole("tab", { name: "Operativo" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    tabs.forEach((button) => {
      expect(button).toHaveClass("min-h-[44px]");
    });
  });

  it("notifica cambio tab al click", () => {
    const onCambiaTab = vi.fn();
    render(<CantiereSegmentBar tabAttivo="operativo" onCambiaTab={onCambiaTab} />);

    fireEvent.click(screen.getByRole("tab", { name: "Economico" }));
    expect(onCambiaTab).toHaveBeenCalledWith("economico");
  });
});
