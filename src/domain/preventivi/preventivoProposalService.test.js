import { beforeEach, describe, expect, it } from "vitest";

import {
  costruisciPreventivoProposal,
  convertiProposalInPreventivo,
  generaPreventivoEconomico,
  risolviVoceListino,
  ORIGINE_LAVORAZIONE,
} from "./preventivoProposalService";
import { resetConoscenze } from "../brain/personalKnowledgeRepository";

const LISTINO_COMPLETO = [
  {
    id: "quadro-elettrico",
    nome: "Quadro elettrico",
    categoria: "Quadri",
    prezzo: 350,
    unita: "cad",
    attiva: true,
  },
  {
    id: "allarme",
    nome: "Predisposizione impianto allarme",
    categoria: "Sicurezza",
    prezzo: 700,
    unita: "cad",
    attiva: true,
  },
  {
    id: "gateway",
    nome: "Gateway Living Now",
    categoria: "Domotica",
    prezzo: 120,
    unita: "cad",
    attiva: true,
  },
];

const LISTINO_INCOMPLETO = [
  {
    id: "quadro-elettrico",
    nome: "Quadro elettrico",
    categoria: "Quadri",
    prezzo: 350,
    unita: "cad",
    attiva: true,
  },
];

describe("preventivoProposalService", () => {
  beforeEach(() => {
    localStorage.clear();
    resetConoscenze();
  });

  describe("risolviVoceListino", () => {
    it("mappa alias quadro → listino senza inventare prezzo", () => {
      const { voce, prezzoConfigurato } = risolviVoceListino(
        "Quadro 36 moduli",
        LISTINO_COMPLETO
      );
      expect(prezzoConfigurato).toBe(true);
      expect(voce.prezzo).toBe(350);
      expect(voce.nome).toBe("Quadro elettrico");
    });

    it("restituisce prezzo non configurato se assente dal listino", () => {
      const { voce, prezzoConfigurato } = risolviVoceListino(
        "Videosorveglianza",
        LISTINO_INCOMPLETO
      );
      expect(prezzoConfigurato).toBe(false);
      expect(voce).toBeNull();
    });
  });

  describe("costruisciPreventivoProposal", () => {
    it("calcola subtotale, IVA e totale solo sulle voci con prezzo", () => {
      const proposal = costruisciPreventivoProposal({
        conoscenzaProposta: {
          puntiStimati: 100,
          quadroSuggerito: "Quadro 36 moduli",
          suggerimenti: [
            { titolo: "Quadro 36 moduli", origine: "BASE" },
            { titolo: "Videosorveglianza", origine: "BASE" },
            { titolo: "Allarme", origine: "BASE" },
          ],
          regoleApplicate: [{ id: "r1", nome: "Regola test" }],
        },
        listino: LISTINO_COMPLETO,
        input: {
          superficieMq: 100,
          livelloImpianto: "standard",
          tipoImmobile: "appartamento",
        },
        iva: 22,
      });

      expect(proposal.riepilogo.puntiStimati).toBe(100);
      expect(proposal.riepilogo.quadroSuggerito).toBe("Quadro 36 moduli");
      expect(proposal.lavorazioni.length).toBe(3);

      const senzaPrezzo = proposal.lavorazioni.find(
        (l) => l.descrizione === "Videosorveglianza"
      );
      expect(senzaPrezzo.prezzoConfigurato).toBe(false);
      expect(senzaPrezzo.prezzoUnitario).toBeNull();
      expect(senzaPrezzo.totale).toBeNull();

      // Quadro 350 + Allarme 700 = 1050; IVA 22% = 231; totale 1281
      expect(proposal.subtotale).toBe(1050);
      expect(proposal.totaleIVA).toBeCloseTo(231, 5);
      expect(proposal.totale).toBeCloseTo(1281, 5);
      expect(proposal.regoleApplicate).toHaveLength(1);
    });

    it("con listino incompleto non inventa prezzi e totalizza solo le voci configurate", () => {
      const proposal = costruisciPreventivoProposal({
        conoscenzaProposta: {
          puntiStimati: 80,
          quadroSuggerito: "Quadro 24 moduli",
          suggerimenti: [
            { titolo: "Quadro 24 moduli", origine: "BASE" },
            { titolo: "Gateway", origine: "BRAIN", perche: "Spesso scelto" },
          ],
          regoleApplicate: [],
        },
        listino: LISTINO_INCOMPLETO,
        input: { superficieMq: 80, livelloImpianto: "base" },
        iva: 22,
      });

      const gateway = proposal.lavorazioni.find(
        (l) => l.descrizione === "Gateway"
      );
      expect(gateway.prezzoConfigurato).toBe(false);
      expect(gateway.origine).toBe(ORIGINE_LAVORAZIONE.BRAIN);
      expect(gateway.perche).toBe("Spesso scelto");

      expect(proposal.subtotale).toBe(350);
      expect(proposal.totaleIVA).toBeCloseTo(77, 5);
      expect(proposal.totale).toBeCloseTo(427, 5);
    });
  });

  describe("convertiProposalInPreventivo", () => {
    it("crea un preventivo Bozza con voci senza prezzo a 0 €", () => {
      const proposal = costruisciPreventivoProposal({
        conoscenzaProposta: {
          puntiStimati: 50,
          quadroSuggerito: "Quadro 24 moduli",
          suggerimenti: [
            { titolo: "Quadro 24 moduli", origine: "BASE" },
            { titolo: "Videosorveglianza", origine: "BASE" },
          ],
          regoleApplicate: [],
        },
        listino: LISTINO_INCOMPLETO,
        input: { superficieMq: 50 },
      });

      const preventivo = convertiProposalInPreventivo(proposal, {
        archivio: [],
        cliente: "Cliente Test",
      });

      expect(preventivo.stato).toBe("Bozza");
      expect(preventivo.cliente).toBe("Cliente Test");
      expect(preventivo.lavorazioni).toHaveLength(2);
      expect(
        preventivo.lavorazioni.find((l) => l.nome === "Videosorveglianza").prezzo
      ).toBe(0);
      expect(
        preventivo.lavorazioni.find((l) => l.nome === "Quadro 24 moduli").prezzo
      ).toBe(350);
      expect(preventivo.note).toMatch(/prezzo/i);
    });
  });

  describe("generaPreventivoEconomico", () => {
    it("orchestra Knowledge → Proposal senza errori", () => {
      const risultato = generaPreventivoEconomico(
        {
          superficieMq: 160,
          numeroLivelli: "1",
          tipoImmobile: "appartamento",
          livelloImpianto: "standard",
          extra: {},
        },
        { listino: LISTINO_COMPLETO, brainPatterns: [] }
      );

      expect(risultato.success).toBe(true);
      expect(risultato.proposal).toBeTruthy();
      expect(risultato.proposal.lavorazioni.length).toBeGreaterThan(0);
      expect(risultato.proposal.riepilogo.puntiStimati).toBe(160);
      expect(typeof risultato.proposal.totale).toBe("number");
    });
  });
});
