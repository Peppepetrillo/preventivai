import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import QualityScoreBadge, { fasciaScoreQualita } from "./QualityScoreBadge";

describe("QualityScoreBadge", () => {
  it("fasciaScoreQualita: verde / arancione / rosso", () => {
    expect(fasciaScoreQualita(100)).toBe("verde");
    expect(fasciaScoreQualita(90)).toBe("verde");
    expect(fasciaScoreQualita(89)).toBe("arancione");
    expect(fasciaScoreQualita(70)).toBe("arancione");
    expect(fasciaScoreQualita(69)).toBe("rosso");
    expect(fasciaScoreQualita(0)).toBe("rosso");
  });

  it("rendering score e colore badge", () => {
    const { rerender } = render(<QualityScoreBadge score={92} />);
    expect(screen.getByLabelText(/92 su 100/i)).toHaveAttribute(
      "data-fascia",
      "verde"
    );

    rerender(<QualityScoreBadge score={75} />);
    expect(screen.getByLabelText(/75 su 100/i)).toHaveAttribute(
      "data-fascia",
      "arancione"
    );

    rerender(<QualityScoreBadge score={40} />);
    expect(screen.getByLabelText(/40 su 100/i)).toHaveAttribute(
      "data-fascia",
      "rosso"
    );
  });
});
