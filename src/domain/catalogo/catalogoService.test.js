import { beforeEach, describe, expect, it } from "vitest";

import {
  CATALOGO_LAVORAZIONI,
  risolviIdDaLegacy,
  risolviPrezzoDaCatalogo,
  normalizzaRiferimentoCatalogo,
  arricchisciLavorazioneLegacy,
  reportSenzaCorrispondenzaListino,
  isCatalogoId,
} from "./index";
import { listinoBase } from "../../data/listinoBase";

describe("catalogo — fonte unica di verità", () => {
  it("espone ID canonici richiesti", () => {
    for (const id of [
      "PUNTO_IMPIANTO",
      "QUADRO_12_MODULI",
      "QUADRO_ELETTRICO",
      "PUNTO_TV",
      "PUNTO_DATI",
      "CLIMA",
      "ALLARME",
      "LINEA_INDUZIONE",
      "VIDEOCITOFONO",
    ]) {
      expect(isCatalogoId(id)).toBe(true);
    }
  });

  it("Catalogo → Listino via chiaveListino (mai per descrizione)", () => {
    const esito = risolviPrezzoDaCatalogo("ALLARME", listinoBase);
    expect(esito.prezzoConfigurato).toBe(true);
    expect(esito.voceListino.id).toBe("predisposizione-impianto-allarme");
    expect(esito.prezzoUnitario).toBe(700);

    const clima = risolviPrezzoDaCatalogo("CLIMA", listinoBase);
    expect(clima.voceListino.id).toBe("predisposizione-termostato");
    expect(clima.prezzoUnitario).toBe(50);

    const quadro = risolviPrezzoDaCatalogo("QUADRO_ELETTRICO", listinoBase);
    expect(quadro.voceListino.id).toBe("quadro-elettrico");
    expect(quadro.prezzoUnitario).toBe(350);

    const quadro12 = risolviPrezzoDaCatalogo("QUADRO_12_MODULI", listinoBase);
    expect(quadro12.voceListino.id).toBe("quadro-elettrico");
    expect(quadro12.prezzoUnitario).toBe(350);

    const punti = risolviPrezzoDaCatalogo("PUNTO_IMPIANTO", listinoBase);
    expect(punti.voceListino.id).toBe("punto-luce");
    expect(punti.prezzoUnitario).toBe(40);
  });

  it("voci senza chiaveListino → prezzo non configurato", () => {
    const bus = risolviPrezzoDaCatalogo("BUS", listinoBase);
    expect(bus.prezzoConfigurato).toBe(false);
    expect(bus.prezzoUnitario).toBeNull();
  });

  it("legacy testo → ID catalogo (solo migrazione)", () => {
    expect(risolviIdDaLegacy("Quadro 36 moduli")).toBe("QUADRO_ELETTRICO");
    expect(risolviIdDaLegacy("Predisposizione climatizzazione")).toBe("CLIMA");
    expect(risolviIdDaLegacy("Illuminazione esterna")).toBe(
      "ILLUMINAZIONE_ESTERNA"
    );
    expect(risolviIdDaLegacy("ALLARME")).toBe("ALLARME");
  });

  it("normalizzaRiferimentoCatalogo accetta { id, quantita }", () => {
    const rif = normalizzaRiferimentoCatalogo({
      id: "PUNTO_IMPIANTO",
      quantita: 48,
    });
    expect(rif).toEqual({
      id: "PUNTO_IMPIANTO",
      quantita: 48,
      meta: {},
    });
  });

  it("retrocompat: arricchisce lavorazione preventivo legacy", () => {
    const legacy = arricchisciLavorazioneLegacy({
      id: "x1",
      nome: "Punto luce",
      prezzo: 40,
      quantita: 2,
    });
    expect(legacy.catalogoId).toBe("PUNTO_LUCE");

    const daListinoId = arricchisciLavorazioneLegacy({
      id: "punto-luce-1710000000000",
      nome: "Punto luce",
      prezzo: 40,
      quantita: 1,
    });
    expect(daListinoId.catalogoId).toBe("PUNTO_LUCE");
    expect(daListinoId.listinoId).toBe("punto-luce");
  });

  it("report voci senza corrispondenza listino", () => {
    const report = reportSenzaCorrispondenzaListino();
    expect(report.length).toBeGreaterThan(0);
    expect(report.every((r) => r.catalogoId && r.motivo)).toBe(true);
    expect(report.every((r) => Array.isArray(r.dove) && r.dove.length > 0)).toBe(
      true
    );
    const ids = report.map((r) => r.catalogoId);
    expect(ids).toContain("BUS");
    expect(ids).toContain("VIDEOSORVEGLIANZA");
  });

  it("ogni voce catalogo ha id, nome, categoria, unita, chiaveListino", () => {
    for (const voce of CATALOGO_LAVORAZIONI) {
      expect(voce.id).toBeTruthy();
      expect(voce.nome).toBeTruthy();
      expect(voce.categoria).toBeTruthy();
      expect(voce.unita).toBeTruthy();
      expect("chiaveListino" in voce).toBe(true);
    }
  });
});
