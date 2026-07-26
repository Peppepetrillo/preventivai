import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import QualityCheckCard from "./QualityCheckCard";

const REPORT_OK = {
  errors: [],
  warnings: [],
  infos: [],
  score: 100,
};

const REPORT_MISTO = {
  score: 67,
  errors: [
    {
      id: "CHECK_CLIENTE_001",
      type: "ERROR",
      title: "Cliente non selezionato",
      message: "Il preventivo non può essere completato.",
      relatedItem: "CLIENTE",
      autoFix: false,
    },
  ],
  warnings: [
    {
      id: "CHECK_INDUZIONE_001",
      type: "WARNING",
      title: "Verifica linea induzione",
      message: "Controlla che sia prevista una linea dedicata.",
      relatedItem: "LINEA_INDUZIONE",
      autoFix: false,
    },
    {
      id: "CHECK_FV_001",
      type: "WARNING",
      title: "Verifica accumulo FV",
      message:
        "Verifica se il cliente desidera predisporre anche un sistema di accumulo.",
      relatedItem: "FOTOVOLTAICO",
      autoFix: false,
    },
  ],
  infos: [
    {
      id: "CHECK_QUADRO_001",
      type: "INFO",
      title: "Quadro elettrico",
      message: "Valuta un quadro di dimensioni superiori.",
      relatedItem: "QUADRO_ELETTRICO",
      autoFix: false,
    },
  ],
};

describe("QualityCheckCard", () => {
  it("rendering score", () => {
    render(<QualityCheckCard report={{ ...REPORT_OK, score: 92 }} controlliTotali={7} />);
    expect(screen.getByLabelText(/92 su 100/i)).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /Controllo qualità/i }) || screen.getByText(/Controllo qualità/i)).toBeTruthy();
  });

  it("empty state quando score 100 senza criticità", () => {
    render(<QualityCheckCard report={REPORT_OK} controlliTotali={7} />);
    expect(screen.getByText(/Ottimo lavoro/i)).toBeInTheDocument();
    expect(screen.getByText(/Non sono state rilevate criticità/i)).toBeInTheDocument();
    expect(document.querySelector('[data-qc-empty="true"]')).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: /Visualizza dettagli/i })
    ).not.toBeInTheDocument();
  });

  it("mostra warning, error, info e relatedItem in espansione", async () => {
    const user = userEvent.setup();
    render(
      <QualityCheckCard report={REPORT_MISTO} controlliTotali={7} />
    );

    expect(screen.getByText(/2 verifiche consigliate/i)).toBeInTheDocument();
    expect(screen.getByText(/1 errore/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/67 su 100/i)).toHaveAttribute(
      "data-fascia",
      "rosso"
    );

    await user.click(
      screen.getByRole("button", { name: /Visualizza dettagli/i })
    );

    expect(screen.getByText(/Cliente non selezionato/i)).toBeInTheDocument();
    expect(screen.getByText(/Verifica linea induzione/i)).toBeInTheDocument();
    expect(screen.getByText(/Verifica accumulo FV/i)).toBeInTheDocument();
    expect(screen.getByText(/Quadro elettrico/i)).toBeInTheDocument();

    const deepLinks = screen.getAllByRole("button", {
      name: /Apri lavorazione/i,
    });
    expect(deepLinks.length).toBeGreaterThanOrEqual(3);
    expect(deepLinks[0]).toHaveAttribute("data-related-item");
  });

  it("espansione e chiusura dettagli", async () => {
    const user = userEvent.setup();
    render(
      <QualityCheckCard report={REPORT_MISTO} controlliTotali={7} />
    );

    const toggle = screen.getByRole("button", {
      name: /Visualizza dettagli/i,
    });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByRole("button", { name: /Nascondi dettagli/i })
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Nascondi dettagli/i }));
    expect(
      screen.getByRole("button", { name: /Visualizza dettagli/i })
    ).toHaveAttribute("aria-expanded", "false");
  });

  it("responsive: card con layout a larghezza piena", () => {
    const { container } = render(
      <QualityCheckCard report={REPORT_MISTO} controlliTotali={7} />
    );
    const section = container.querySelector("section.pro-panel");
    expect(section).toBeTruthy();
    expect(section.className).toMatch(/p-5/);
    // touch target sul toggle
    const btn = screen.getByRole("button", { name: /Visualizza dettagli/i });
    expect(btn.className).toMatch(/min-h-\[44px\]/);
  });
});
