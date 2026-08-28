import { describe, expect, it } from "vitest";

import { AZIONI_PREVENTIVO, EVENTI_WORKFLOW, STATI_PREVENTIVO } from "../../../domain/workflow";
import {
  HERO_CTA,
  etichettaEventoWorkflowUi,
  etichettaStatoUi,
  filtraAzioniSecondarie,
  isPagamentiSuCantiere,
  risolviHeroCta,
  titoloPreventivoHeader,
} from "./preventivoHeroCta";

describe("preventivoHeroCta", () => {
  it("etichettaStatoUi senza emoji", () => {
    expect(etichettaStatoUi(STATI_PREVENTIVO.BOZZA)).toBe("Bozza");
    expect(etichettaStatoUi(STATI_PREVENTIVO.CONVERTITO)).toBe("In cantiere");
    expect(etichettaStatoUi(STATI_PREVENTIVO.LAVORO_COMPLETATO)).toBe(
      "Lavoro finito"
    );
    expect(etichettaStatoUi(STATI_PREVENTIVO.RIFIUTATO)).toBe("Non accettato");
  });

  it("etichettaEventoWorkflowUi evita Convertito", () => {
    expect(
      etichettaEventoWorkflowUi(
        EVENTI_WORKFLOW.PREVENTIVO_CONVERTITO,
        "Preventivo convertito"
      )
    ).toBe("Diventato cantiere");
    expect(
      etichettaEventoWorkflowUi(EVENTI_WORKFLOW.PREVENTIVO_RIFIUTATO)
    ).toBe("Non accettato");
    expect(
      etichettaEventoWorkflowUi(EVENTI_WORKFLOW.LAVORO_COMPLETATO)
    ).toBe("Lavoro finito");
  });

  it("titoloPreventivoHeader usa prima lavorazione", () => {
    expect(
      titoloPreventivoHeader(
        { id: "1", numero: "PREV-1" },
        [{ nome: "Impianto bagno" }]
      )
    ).toBe("Impianto bagno");
  });

  it("Bozza → Condividi preventivo come CTA primaria", () => {
    expect(
      risolviHeroCta({
        stato: STATI_PREVENTIVO.BOZZA,
        azioniDisponibili: [
          AZIONI_PREVENTIVO.INVIA,
          AZIONI_PREVENTIVO.ACCETTA,
        ],
      })
    ).toEqual({ id: HERO_CTA.CONDIVIDI, label: "Condividi preventivo" });
  });

  it("Inviato → Cliente ha accettato come CTA primaria", () => {
    expect(
      risolviHeroCta({
        stato: STATI_PREVENTIVO.INVIATO,
        azioniDisponibili: [AZIONI_PREVENTIVO.ACCETTA],
      })
    ).toEqual({ id: HERO_CTA.ACCETTA, label: "Cliente ha accettato" });
  });

  it("Accettato → Inizia cantiere", () => {
    expect(
      risolviHeroCta({
        stato: STATI_PREVENTIVO.ACCETTATO,
        azioniDisponibili: [AZIONI_PREVENTIVO.CONVERTI_CANTIERE],
      })
    ).toEqual({ id: HERO_CTA.CONVERTI_CANTIERE, label: "Inizia cantiere" });
  });

  it("Convertito → Apri cantiere", () => {
    expect(
      risolviHeroCta({
        stato: STATI_PREVENTIVO.CONVERTITO,
        azioniDisponibili: [AZIONI_PREVENTIVO.APRI_CANTIERE],
        cantiereCollegatoId: "c1",
      })
    ).toEqual({ id: HERO_CTA.APRI_CANTIERE, label: "Apri cantiere" });
  });

  it("isPagamentiSuCantiere per Convertito e cantiereId", () => {
    expect(
      isPagamentiSuCantiere({ stato: STATI_PREVENTIVO.CONVERTITO })
    ).toBe(true);
    expect(
      isPagamentiSuCantiere({
        stato: STATI_PREVENTIVO.LAVORO_COMPLETATO,
        cantiereId: "c1",
      })
    ).toBe(true);
    expect(
      isPagamentiSuCantiere({ stato: STATI_PREVENTIVO.ACCETTATO }, "c9")
    ).toBe(true);
    expect(
      isPagamentiSuCantiere({ stato: STATI_PREVENTIVO.ACCETTATO })
    ).toBe(false);
  });

  it("filtraAzioniSecondarie esclude hero converti", () => {
    expect(
      filtraAzioniSecondarie(
        [
          AZIONI_PREVENTIVO.CONVERTI_CANTIERE,
          AZIONI_PREVENTIVO.RIFIUTA,
        ],
        HERO_CTA.CONVERTI_CANTIERE
      )
    ).toEqual([AZIONI_PREVENTIVO.RIFIUTA]);
  });
});
