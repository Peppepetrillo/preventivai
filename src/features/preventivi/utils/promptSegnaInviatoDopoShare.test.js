import { describe, expect, it } from "vitest";

import { TIPI_CONDIVISIONE } from "../../../domain/condivisione";
import { STATI_PREVENTIVO } from "../../../domain/workflow";
import { deveChiedereSegnaInviatoDopoShare } from "./promptSegnaInviatoDopoShare";

describe("deveChiedereSegnaInviatoDopoShare", () => {
  it("chiede solo su Bozza dopo Email/WhatsApp/Share", () => {
    expect(
      deveChiedereSegnaInviatoDopoShare(STATI_PREVENTIVO.BOZZA, {
        condivisione: { tipo: TIPI_CONDIVISIONE.EMAIL },
      })
    ).toBe(true);
    expect(
      deveChiedereSegnaInviatoDopoShare(STATI_PREVENTIVO.BOZZA, {
        condivisione: { tipo: TIPI_CONDIVISIONE.WHATSAPP },
      })
    ).toBe(true);
    expect(
      deveChiedereSegnaInviatoDopoShare(STATI_PREVENTIVO.BOZZA, {
        condivisione: { tipo: TIPI_CONDIVISIONE.SHARE },
      })
    ).toBe(true);
  });

  it("non chiede dopo Scarica PDF (locale)", () => {
    expect(
      deveChiedereSegnaInviatoDopoShare(STATI_PREVENTIVO.BOZZA, {
        condivisione: { tipo: TIPI_CONDIVISIONE.DOWNLOAD },
      })
    ).toBe(false);
  });

  it("non chiede se già Inviato o Accettato", () => {
    expect(
      deveChiedereSegnaInviatoDopoShare(STATI_PREVENTIVO.INVIATO, {
        condivisione: { tipo: TIPI_CONDIVISIONE.EMAIL },
      })
    ).toBe(false);
    expect(
      deveChiedereSegnaInviatoDopoShare(STATI_PREVENTIVO.ACCETTATO, {
        condivisione: { tipo: TIPI_CONDIVISIONE.SHARE },
      })
    ).toBe(false);
  });
});
