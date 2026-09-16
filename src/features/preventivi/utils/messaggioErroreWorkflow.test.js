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

  it("traduce errori variante/cantiere in italiano", () => {
    expect(messaggioErroreWorkflow("richiede_approvazione")).toMatch(
      /approvata/i
    );
    expect(messaggioErroreWorkflow("variante_non_trovata")).toMatch(
      /non trovata/i
    );
    expect(messaggioErroreWorkflow("preventivo_non_collegato")).toMatch(
      /preventivo collegato/i
    );
    expect(messaggioErroreWorkflow("pagamento_non_valido")).toMatch(
      /pagamento/i
    );
    expect(messaggioErroreWorkflow("spesa_non_valida")).toMatch(/spesa/i);
    expect(messaggioErroreWorkflow("nessun_cantiere")).toMatch(/cantiere/i);
    expect(messaggioErroreWorkflow("titolo_obbligatorio")).toMatch(/titolo/i);
  });
});
