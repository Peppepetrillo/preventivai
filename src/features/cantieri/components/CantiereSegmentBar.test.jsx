import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import CantiereSegmentBar from "./CantiereSegmentBar";

describe("CantiereSegmentBar UX-8.3", () => {
  it("renderizza 4 tab con touch target e aria-selected", () => {
    const onCambiaTab = vi.fn();
    render(<CantiereSegmentBar tabAttivo="operativo" onCambiaTab={onCambiaTab} />);

    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(4);
    expect(screen.getByRole("tab", { name: "Lavoro" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    expect(screen.getByRole("tab", { name: "Giornate" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Pagamenti" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Diario" })).toBeInTheDocument();
    tabs.forEach((button) => {
      expect(button).toHaveClass("min-h-[44px]");
    });
  });

  it("notifica cambio tab al click", () => {
    const onCambiaTab = vi.fn();
    render(<CantiereSegmentBar tabAttivo="operativo" onCambiaTab={onCambiaTab} />);

    fireEvent.click(screen.getByRole("tab", { name: "Pagamenti" }));
    expect(onCambiaTab).toHaveBeenCalledWith("economico");
  });
});
