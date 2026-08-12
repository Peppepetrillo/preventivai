import { describe, expect, it } from "vitest";

import { AZIONI_PREVENTIVO, STATI_PREVENTIVO } from "../../../domain/workflow";
import {
  HERO_CTA,
  etichettaStatoUi,
  filtraAzioniSecondarie,
  risolviHeroCta,
  titoloPreventivoHeader,
} from "./preventivoHeroCta";

describe("preventivoHeroCta", () => {
  it("etichettaStatoUi senza emoji", () => {
    expect(etichettaStatoUi(STATI_PREVENTIVO.BOZZA)).toBe("Bozza");
    expect(etichettaStatoUi(STATI_PREVENTIVO.CONVERTITO)).toBe("In cantiere");
  });

  it("titoloPreventivoHeader usa prima lavorazione", () => {
    expect(
      titoloPreventivoHeader(
        { id: "1", numero: "PREV-1" },
        [{ nome: "Impianto bagno" }]
      )
    ).toBe("Impianto bagno");
  });

  it("Bozza → Accetta come CTA primaria", () => {
    expect(
      risolviHeroCta({
        stato: STATI_PREVENTIVO.BOZZA,
        azioniDisponibili: [
          AZIONI_PREVENTIVO.INVIA,
          AZIONI_PREVENTIVO.ACCETTA,
        ],
      })
    ).toEqual({ id: HERO_CTA.ACCETTA, label: "Accetta" });
  });

  it("Inviato → Accetta come CTA primaria", () => {
    expect(
      risolviHeroCta({
        stato: STATI_PREVENTIVO.INVIATO,
        azioniDisponibili: [AZIONI_PREVENTIVO.ACCETTA],
      })
    ).toEqual({ id: HERO_CTA.ACCETTA, label: "Accetta" });
  });

  it("Bozza senza Accetta → Modifica preventivo", () => {
    expect(
      risolviHeroCta({
        stato: STATI_PREVENTIVO.BOZZA,
        azioniDisponibili: [AZIONI_PREVENTIVO.INVIA],
      })
    ).toEqual({ id: HERO_CTA.MODIFICA, label: "Modifica preventivo" });
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
