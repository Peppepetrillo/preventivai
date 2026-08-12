import { describe, expect, it } from "vitest";

import { messaggioErroreWorkflow } from "./messaggioErroreWorkflow";

describe("messaggioErroreWorkflow", () => {
  it("traduce i codici workflow principali", () => {
    expect(messaggioErroreWorkflow("solo_accettato_convertibile")).toMatch(
      /Accetta il preventivo/i
    );
    expect(messaggioErroreWorkflow("gia_convertito")).toMatch(/già collegato/i);
    expect(messaggioErroreWorkflow("preventivo_non_trovato")).toMatch(
      /non trovato/i
    );
  });

  it("usa fallback se codice sconosciuto", () => {
    expect(messaggioErroreWorkflow("codice_ignoto", "Riprova più tardi.")).toBe(
      "Riprova più tardi."
    );
  });
});
