/**
 * Decision Flow Assistente — test.
 */

import { beforeEach, describe, expect, it } from "vitest";
import {
  DECISION_AZIONE_TIPO,
  DECISION_STATO,
  applicaDecisioneConfermataAProposal,
  confermaDecisione,
  confermaEApplicaAProposal,
  creaAzioneProposta,
  derivaAzioneDaRisposta,
  ignoraDecisione,
  modificaProposta,
  resetDecisioniAssistente,
  riceviRisposta,
} from "./index";
import { generaPreventivoEconomico } from "../preventivi";
import { resetMemoriaDecisioni } from "../decisionMemory";
import {
  creaNuovaSessione,
  resetSessioniSopralluogo,
} from "../sopralluogoSession";

describe("Assistente Decision Flow", () => {
  /** @type {string} */
  let sessionId;

  beforeEach(() => {
    resetDecisioniAssistente();
    resetMemoriaDecisioni();
    resetSessioniSopralluogo();
    sessionId = creaNuovaSessione().id;
  });

  it("registra risposta ricevuta senza azione se non mappata", () => {
    const d = riceviRisposta("ASK_CLIMA_PREDISPOSIZIONE", "sì");
    expect(d.stato).toBe(DECISION_STATO.RICEVUTA);
    expect(d.origine).toBe("ASSISTENTE_SOPRALLUOGO");
    expect(d.azione).toBeNull();
    expect(d.risposta).toBe("sì");
    expect(d.timestamp).toBeGreaterThan(0);
  });

  it("crea proposta AGGIORNA_QUANTITA da ASK_CLIMA_QUANTI", () => {
    const d = riceviRisposta("ASK_CLIMA_QUANTI", "3");
    expect(d.stato).toBe(DECISION_STATO.PROPOSTA);
    expect(d.azione).toMatchObject({
      tipo: DECISION_AZIONE_TIPO.AGGIORNA_QUANTITA,
      catalogoId: "CLIMA",
      quantita: 3,
    });
    expect(d.messaggioProposta).toBe("Impostare CLIMA quantità 3?");
    expect(d.azione).not.toHaveProperty("prezzo");
    expect(d.azione).not.toHaveProperty("prezzoUnitario");
  });

  it("crea proposta quantità PUNTO_DATI da ASK_UFFICIO_POSTAZIONI_DATI", () => {
    const azione = derivaAzioneDaRisposta(
      "ASK_UFFICIO_POSTAZIONI_DATI",
      "12 postazioni"
    );
    expect(azione.azione).toMatchObject({
      catalogoId: "PUNTO_DATI",
      quantita: 12,
    });

    const d = riceviRisposta("ASK_UFFICIO_POSTAZIONI_DATI", 12);
    expect(d.stato).toBe(DECISION_STATO.PROPOSTA);
    expect(d.azione.catalogoId).toBe("PUNTO_DATI");
  });

  it("conferma senza apply e senza memoria non altera la proposal rigenerata", () => {
    const d = riceviRisposta("ASK_CLIMA_QUANTI", 3);
    const input = {
      tipoImmobile: "appartamento",
      superficieMq: 90,
      climatizzazione: true,
      livelloImpianto: "standard",
    };
    const prima = generaPreventivoEconomico(input);
    const confermata = confermaDecisione(d.id, { persistiMemoria: false });

    expect(confermata.stato).toBe(DECISION_STATO.CONFERMATA);

    const dopo = generaPreventivoEconomico(input);
    expect(dopo.proposal.lavorazioni).toEqual(prima.proposal.lavorazioni);
    expect(dopo.proposal.subtotale).toBe(prima.proposal.subtotale);
    expect(dopo.proposal.totale).toBe(prima.proposal.totale);
  });

  it("conferma con memoria: la rigenerazione rispetta valoreScelto", () => {
    const d = riceviRisposta("ASK_CLIMA_QUANTI", 3);
    const input = {
      tipoImmobile: "appartamento",
      superficieMq: 90,
      climatizzazione: true,
      livelloImpianto: "standard",
    };
    const prima = generaPreventivoEconomico(input, { sessionId });
    confermaDecisione(d.id, {
      proposal: prima.proposal,
      sessionId,
      persistiMemoria: true,
    });

    const dopo = generaPreventivoEconomico(input, { sessionId });
    const clima = dopo.proposal.lavorazioni.find((l) => l.catalogoId === "CLIMA");
    expect(clima.quantita).toBe(3);
    expect(clima.prezzoUnitario).toBe(
      prima.proposal.lavorazioni.find((l) => l.catalogoId === "CLIMA")
        .prezzoUnitario
    );
  });

  it("ignora la proposta", () => {
    const d = riceviRisposta("ASK_CLIMA_QUANTI", 2);
    const ignorata = ignoraDecisione(d.id, { sessionId });
    expect(ignorata.stato).toBe(DECISION_STATO.IGNORATA);
  });

  it("modifica la proposta ricalcolando l'azione", () => {
    const d = riceviRisposta("ASK_CLIMA_QUANTI", 2);
    const m = modificaProposta(d.id, "5");
    expect(m.stato).toBe(DECISION_STATO.PROPOSTA);
    expect(m.azione.quantita).toBe(5);
    expect(m.messaggioProposta).toContain("5");
  });

  it("nessuna modifica automatica al preventivo alla ricezione risposta", () => {
    const input = {
      tipoImmobile: "appartamento",
      superficieMq: 80,
      climatizzazione: true,
      livelloImpianto: "standard",
    };
    const prima = generaPreventivoEconomico(input);
    riceviRisposta("ASK_CLIMA_QUANTI", 99);
    const dopo = generaPreventivoEconomico(input);

    expect(dopo.proposal.subtotale).toBe(prima.proposal.subtotale);
    expect(dopo.proposal.totale).toBe(prima.proposal.totale);
    const climaPrima = prima.proposal.lavorazioni.find(
      (l) => l.catalogoId === "CLIMA"
    );
    const climaDopo = dopo.proposal.lavorazioni.find(
      (l) => l.catalogoId === "CLIMA"
    );
    expect(climaDopo?.quantita).toBe(climaPrima?.quantita);
  });

  it("pricing invariato finché non si applica esplicitamente", () => {
    const input = {
      tipoImmobile: "appartamento",
      superficieMq: 80,
      climatizzazione: true,
      livelloImpianto: "standard",
    };
    const gen = generaPreventivoEconomico(input);
    expect(gen.success).toBe(true);
    const proposalOriginale = gen.proposal;
    const subtotaleOrig = proposalOriginale.subtotale;

    const d = riceviRisposta("ASK_CLIMA_QUANTI", 7);
    expect(d.stato).toBe(DECISION_STATO.PROPOSTA);

    // Applicazione su non-confermata fallisce
    const no = applicaDecisioneConfermataAProposal(proposalOriginale, d);
    expect(no.success).toBe(false);
    expect(no.error).toBe("decisione_non_confermata");
    expect(proposalOriginale.subtotale).toBe(subtotaleOrig);

    const esito = confermaEApplicaAProposal(d.id, proposalOriginale, {
      sessionId,
    });
    expect(esito.success).toBe(true);
    expect(esito.decisione.stato).toBe(DECISION_STATO.CONFERMATA);

    const clima = esito.proposal.lavorazioni.find(
      (l) => l.catalogoId === "CLIMA"
    );
    expect(clima.quantita).toBe(7);
    // Prezzo unitario invariato (Listino già in proposal)
    const climaOrig = proposalOriginale.lavorazioni.find(
      (l) => l.catalogoId === "CLIMA"
    );
    expect(clima.prezzoUnitario).toBe(climaOrig.prezzoUnitario);
    expect(esito.proposal.subtotale).not.toBe(subtotaleOrig);
    // Originale immutato
    expect(proposalOriginale.subtotale).toBe(subtotaleOrig);
  });

  it("rifiuta azioni con prezzi", () => {
    expect(() =>
      derivaAzioneDaRisposta("ASK_CLIMA_QUANTI", 1)
    ).not.toThrow();

    expect(() =>
      creaAzioneProposta({
        tipo: DECISION_AZIONE_TIPO.AGGIORNA_QUANTITA,
        catalogoId: "CLIMA",
        quantita: 1,
        prezzo: 100,
      })
    ).toThrow(/prezzi/i);
  });
});
