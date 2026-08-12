import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Copy, FileText, MessageCircle } from "lucide-react";
import { describe, expect, it, vi } from "vitest";

import ShareSheet from "./ShareSheet";

function ultimoDialog() {
  const dialogs = screen.getAllByRole("dialog");
  return dialogs[dialogs.length - 1];
}

describe("ShareSheet UX-2.3", () => {
  it("non renderizza il dialog quando chiuso", () => {
    render(
      <ShareSheet
        open={false}
        onClose={vi.fn()}
        preview="Testo"
        actions={[]}
      />
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("apre con titolo Condividi, preview e azioni", () => {
    render(
      <ShareSheet
        open
        onClose={vi.fn()}
        sheetTestId="share-test"
        preview="Anteprima condivisa"
        previewTestId="share-preview"
        actions={[
          {
            id: "whatsapp",
            label: "WhatsApp",
            icon: MessageCircle,
            variant: "primary",
            onPress: vi.fn(),
            testId: "share-whatsapp",
          },
          {
            id: "copy",
            label: "Copia testo",
            icon: Copy,
            variant: "secondary",
            onPress: vi.fn(),
            testId: "share-copy",
          },
          {
            id: "pdf",
            label: "PDF",
            icon: FileText,
            variant: "secondary",
            onPress: vi.fn(),
            testId: "share-pdf",
          },
        ]}
      />
    );

    const dialog = ultimoDialog();
    expect(within(dialog).getByRole("heading", { name: /Condividi/i })).toBeInTheDocument();
    expect(within(dialog).getByTestId("share-test")).toBeInTheDocument();
    expect(within(dialog).getByTestId("share-preview")).toHaveTextContent(
      "Anteprima condivisa"
    );
    expect(within(dialog).getByTestId("share-whatsapp")).toHaveClass("btn-primary");
    expect(within(dialog).getByTestId("share-copy")).toHaveClass("btn-secondary");
    expect(within(dialog).getByTestId("share-pdf")).toHaveClass("btn-secondary");
  });

  it("invoca onPress per WhatsApp, copia e PDF", async () => {
    const user = userEvent.setup();
    const onWhatsApp = vi.fn();
    const onCopy = vi.fn();
    const onPdf = vi.fn();

    render(
      <ShareSheet
        open
        onClose={vi.fn()}
        actions={[
          {
            id: "whatsapp",
            label: "WhatsApp",
            variant: "primary",
            onPress: onWhatsApp,
            testId: "share-whatsapp",
          },
          {
            id: "copy",
            label: "Copia testo",
            variant: "secondary",
            onPress: onCopy,
            testId: "share-copy",
          },
          {
            id: "pdf",
            label: "PDF",
            variant: "secondary",
            onPress: onPdf,
            testId: "share-pdf",
          },
        ]}
      />
    );

    await user.click(screen.getByTestId("share-whatsapp"));
    await user.click(screen.getByTestId("share-copy"));
    await user.click(screen.getByTestId("share-pdf"));

    expect(onWhatsApp).toHaveBeenCalledTimes(1);
    expect(onCopy).toHaveBeenCalledTimes(1);
    expect(onPdf).toHaveBeenCalledTimes(1);
  });

  it("disabilita azione e mostra loadingLabel", () => {
    render(
      <ShareSheet
        open
        onClose={vi.fn()}
        actions={[
          {
            id: "pdf",
            label: "PDF",
            variant: "secondary",
            onPress: vi.fn(),
            disabled: true,
            loadingLabel: "Generazione…",
            testId: "share-pdf",
          },
        ]}
      />
    );

    const pdf = screen.getByTestId("share-pdf");
    expect(pdf).toBeDisabled();
    expect(pdf).toHaveTextContent("Generazione…");
  });

  it("mostra error state", () => {
    render(
      <ShareSheet
        open
        onClose={vi.fn()}
        error="Impossibile condividere."
        actions={[]}
      />
    );

    expect(screen.getByTestId("share-sheet-error")).toHaveTextContent(
      "Impossibile condividere."
    );
  });

  it("touch target >=44px sulle azioni", () => {
    render(
      <ShareSheet
        open
        onClose={vi.fn()}
        actions={[
          {
            id: "whatsapp",
            label: "WhatsApp",
            variant: "primary",
            onPress: vi.fn(),
            testId: "share-whatsapp",
          },
          {
            id: "copy",
            label: "Copia testo",
            variant: "secondary",
            onPress: vi.fn(),
            testId: "share-copy",
          },
        ]}
      />
    );

    expect(screen.getByTestId("share-whatsapp").className).toMatch(/min-h-\[52px\]/);
    expect(screen.getByTestId("share-copy").className).toMatch(/min-h-\[48px\]/);
  });

  it("chiude con Escape", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(<ShareSheet open onClose={onClose} actions={[]} />);

    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalled();
  });
});
