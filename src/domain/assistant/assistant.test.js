/**
 * Assistente Sopralluogo — test attivazione, priorità, Base Tecnica, no pricing.
 */

import { describe, expect, it } from "vitest";
import {
  ASSISTANT_DOMANDE,
  ASSISTANT_PRIORITA,
  contaDomandeAssistente,
  domandeSenzaPrezzi,
  ottieniDomanda,
  proponiDomandeSopralluogo,
} from "./index";
import { generaPreventivoEconomico } from "../preventivi";

describe("Assistente Sopralluogo", () => {
  it("espone le domande attese del primo livello", () => {
    expect(contaDomandeAssistente()).toBe(8);
    expect(ottieniDomanda("ASK_CUCINA_INDUZIONE_LINEA")).toMatchObject({
      categoria: "CUCINA",
      priorita: ASSISTANT_PRIORITA.ALTA,
      catalogoIds: ["LINEA_INDUZIONE"],
      schedaTecnicaId: "BT_CUCINA_INDUZIONE",
    });
  });

  it("attiva la domanda cucina induzione solo con cucina=induzione", () => {
    const conInduzione = proponiDomandeSopralluogo({
      tipoImmobile: "appartamento",
      cucina: "induzione",
    });
    expect(conInduzione.map((d) => d.id)).toContain(
      "ASK_CUCINA_INDUZIONE_LINEA"
    );

    const senza = proponiDomandeSopralluogo({
      tipoImmobile: "appartamento",
      cucina: "standard",
    });
    expect(senza.map((d) => d.id)).not.toContain(
      "ASK_CUCINA_INDUZIONE_LINEA"
    );
  });

  it("attiva le domande clima se climatizzazione=sì", () => {
    const ids = proponiDomandeSopralluogo({
      tipoImmobile: "appartamento",
      climatizzazione: true,
    }).map((d) => d.id);

    expect(ids).toContain("ASK_CLIMA_QUANTI");
    expect(ids).toContain("ASK_CLIMA_PREDISPOSIZIONE");
  });

  it("non attiva le domande clima senza climatizzazione", () => {
    const ids = proponiDomandeSopralluogo({
      tipoImmobile: "appartamento",
      climatizzazione: false,
    }).map((d) => d.id);

    expect(ids).not.toContain("ASK_CLIMA_QUANTI");
    expect(ids).not.toContain("ASK_CLIMA_PREDISPOSIZIONE");
  });

  it("attiva le domande villa / esterni", () => {
    const ids = proponiDomandeSopralluogo({
      tipoImmobile: "villa",
    }).map((d) => d.id);

    expect(ids).toEqual(
      expect.arrayContaining([
        "ASK_VILLA_SPAZI_ESTERNI",
        "ASK_VILLA_ILLUMINAZIONE_ESTERNA",
        "ASK_VILLA_CANCELLO",
      ])
    );
  });

  it("non attiva le domande villa su appartamento", () => {
    const ids = proponiDomandeSopralluogo({
      tipoImmobile: "appartamento",
    }).map((d) => d.id);

    expect(ids).not.toContain("ASK_VILLA_SPAZI_ESTERNI");
    expect(ids).not.toContain("ASK_VILLA_CANCELLO");
  });

  it("attiva la domanda rete dati per ufficio", () => {
    const ids = proponiDomandeSopralluogo({
      tipoImmobile: "ufficio",
    }).map((d) => d.id);

    expect(ids).toContain("ASK_UFFICIO_POSTAZIONI_DATI");
  });

  it("non attiva la domanda ufficio su negozio", () => {
    const ids = proponiDomandeSopralluogo({
      tipoImmobile: "negozio",
    }).map((d) => d.id);

    expect(ids).not.toContain("ASK_UFFICIO_POSTAZIONI_DATI");
  });

  it("attiva la domanda accumulo se fotovoltaico=sì", () => {
    const ids = proponiDomandeSopralluogo({
      tipoImmobile: "villa",
      predisposizioneFotovoltaico: true,
    }).map((d) => d.id);

    expect(ids).toContain("ASK_FV_ACCUMULO");
  });

  it("ordina per priorità ALTA prima di MEDIA", () => {
    const domande = proponiDomandeSopralluogo({
      tipoImmobile: "villa",
      cucina: "induzione",
      climatizzazione: true,
    });

    const priorita = domande.map((d) => d.priorita);
    const primaMedia = priorita.indexOf(ASSISTANT_PRIORITA.MEDIA);
    const ultimaAlta = priorita.lastIndexOf(ASSISTANT_PRIORITA.ALTA);

    if (primaMedia !== -1 && ultimaAlta !== -1) {
      expect(ultimaAlta).toBeLessThan(primaMedia);
    }
    expect(domande[0].priorita).toBe(ASSISTANT_PRIORITA.ALTA);
  });

  it("collega scheda tecnica e motivazione (perché lo chiede)", () => {
    const [domanda] = proponiDomandeSopralluogo({
      cucina: "induzione",
    }).filter((d) => d.id === "ASK_CUCINA_INDUZIONE_LINEA");

    expect(domanda.schedaTecnicaId).toBe("BT_CUCINA_INDUZIONE");
    expect(domanda.percheChiede).toMatchObject({
      schedaTecnicaId: "BT_CUCINA_INDUZIONE",
    });
    expect(domanda.percheChiede.motivazione).toMatch(/induzione/i);
    expect(domanda.percheChiede.origine).toBeTruthy();
  });

  it("non include prezzi nelle domande di dominio", () => {
    expect(domandeSenzaPrezzi()).toBe(true);
    for (const d of ASSISTANT_DOMANDE) {
      expect(d).not.toHaveProperty("prezzo");
      expect(d).not.toHaveProperty("prezzoUnitario");
      expect(d).not.toHaveProperty("quantita");
    }
  });

  it("non impatta il pricing della proposal", () => {
    const input = {
      tipoImmobile: "appartamento",
      superficieMq: 90,
      numeroLivelli: "1",
      numeroLocali: 4,
      numeroBagni: 1,
      cucina: "induzione",
      climatizzazione: true,
      predisposizioneFotovoltaico: true,
      livelloImpianto: "standard",
    };

    const prima = generaPreventivoEconomico(input);
    const domande = proponiDomandeSopralluogo(input);
    const dopo = generaPreventivoEconomico(input);

    expect(domande.length).toBeGreaterThan(0);
    expect(prima.success).toBe(true);
    expect(dopo.success).toBe(true);
    expect(dopo.proposal.subtotale).toBe(prima.proposal.subtotale);
    expect(dopo.proposal.totale).toBe(prima.proposal.totale);
    expect(dopo.proposal.lavorazioni).toEqual(prima.proposal.lavorazioni);
  });

  it("permette di escludere domande già gestite senza alterare il dominio", () => {
    const tutte = proponiDomandeSopralluogo({
      tipoImmobile: "villa",
      cucina: "induzione",
    });
    const filtrate = proponiDomandeSopralluogo(
      { tipoImmobile: "villa", cucina: "induzione" },
      { escludiId: ["ASK_CUCINA_INDUZIONE_LINEA"] }
    );

    expect(tutte.some((d) => d.id === "ASK_CUCINA_INDUZIONE_LINEA")).toBe(
      true
    );
    expect(
      filtrate.some((d) => d.id === "ASK_CUCINA_INDUZIONE_LINEA")
    ).toBe(false);
  });
});
