import { beforeEach, describe, expect, it } from "vitest";

import {
  costruisciPreventivoProposal,
  convertiProposalInPreventivo,
  generaPreventivoEconomico,
  risolviVoceListino,
  risolviVoceListinoDaCatalogo,
} from "./preventivoProposalService";
import { resetConoscenze } from "../brain/personalKnowledgeRepository";
import { arricchisciLavorazioneLegacy } from "../catalogo";
import { listinoBase } from "../../data/listinoBase";

describe("preventivoProposalService — Catalogo", () => {
  beforeEach(() => {
    localStorage.clear();
    resetConoscenze();
  });

  it("risolve prezzi solo tramite catalogoId", () => {
    const { voce, prezzoConfigurato } = risolviVoceListinoDaCatalogo(
      "QUADRO_ELETTRICO",
      listinoBase
    );
    expect(prezzoConfigurato).toBe(true);
    expect(voce.id).toBe("quadro-elettrico");
  });

  it("legacy stringa ancora mappabile via Catalogo (retrocompat)", () => {
    const { voce, prezzoConfigurato, catalogoId } = risolviVoceListino(
      "Quadro 36 moduli",
      listinoBase
    );
    expect(catalogoId).toBe("QUADRO_ELETTRICO");
    expect(prezzoConfigurato).toBe(true);
    expect(voce.prezzo).toBe(350);
  });

  it("Proposal → Totali con Punti + Quadro + Allarme via ID", () => {
    const proposal = costruisciPreventivoProposal({
      conoscenzaProposta: {
        puntiStimati: 110,
        quadroSuggerito: "Quadro 36 moduli",
        quadroCatalogoId: "QUADRO_ELETTRICO",
        quadroModuli: 36,
        suggerimenti: [
          { id: "PUNTO_IMPIANTO", quantita: 110, origine: "BASE" },
          {
            id: "QUADRO_ELETTRICO",
            quantita: 1,
            meta: { moduli: 36 },
            origine: "BASE",
          },
          { id: "ALLARME", quantita: 1, origine: "BASE" },
          { id: "VIDEOSORVEGLIANZA", quantita: 1, origine: "BASE" },
        ],
        regoleApplicate: [],
      },
      listino: listinoBase,
      input: { superficieMq: 110, livelloImpianto: "standard" },
      iva: 22,
    });

    const punti = proposal.lavorazioni.find((l) => l.catalogoId === "PUNTO_IMPIANTO");
    expect(punti.quantita).toBe(110);
    expect(punti.prezzoUnitario).toBe(40);
    expect(punti.prezzoConfigurato).toBe(true);

    const quadro = proposal.lavorazioni.find(
      (l) => l.catalogoId === "QUADRO_ELETTRICO"
    );
    expect(quadro.prezzoUnitario).toBe(350);
    expect(quadro.descrizione).toMatch(/Quadro/);

    const video = proposal.lavorazioni.find(
      (l) => l.catalogoId === "VIDEOSORVEGLIANZA"
    );
    expect(video.prezzoConfigurato).toBe(false);

    // 110*40 + 350 + 700 = 5450; IVA 22%
    expect(proposal.subtotale).toBe(5450);
    expect(proposal.totaleIVA).toBeCloseTo(1199, 5);
    expect(proposal.totale).toBeCloseTo(6649, 5);
  });

  it("generaPreventivoEconomico orchestra KE → Catalogo → Listino", () => {
    const risultato = generaPreventivoEconomico(
      {
        superficieMq: 160,
        numeroLivelli: "1",
        tipoImmobile: "appartamento",
        livelloImpianto: "standard",
        extra: { allarme: true, predisposizioneClima: true },
      },
      { listino: listinoBase, brainPatterns: [] }
    );

    expect(risultato.success).toBe(true);
    const ids = risultato.proposal.lavorazioni.map((l) => l.catalogoId);
    expect(ids).toContain("PUNTO_IMPIANTO");
    expect(ids).toContain("QUADRO_ELETTRICO");
    expect(ids).toContain("CLIMA");

    const punti = risultato.proposal.lavorazioni.find(
      (l) => l.catalogoId === "PUNTO_IMPIANTO"
    );
    expect(punti.quantita).toBe(160);
    expect(punti.prezzoConfigurato).toBe(true);
  });

  it("convertiProposalInPreventivo preserva catalogoId", () => {
    const proposal = costruisciPreventivoProposal({
      conoscenzaProposta: {
        puntiStimati: 50,
        suggerimenti: [{ id: "CLIMA", quantita: 1 }],
        regoleApplicate: [],
      },
      listino: listinoBase,
      input: { superficieMq: 50 },
    });

    const preventivo = convertiProposalInPreventivo(proposal, {
      archivio: [],
      cliente: "Test",
    });

    expect(preventivo.lavorazioni[0].catalogoId).toBe("CLIMA");
    expect(preventivo.lavorazioni[0].listinoId).toBe(
      "predisposizione-termostato"
    );
    expect(preventivo.lavorazioni[0].prezzoConfigurato).toBe(true);
  });

  it("convertiProposalInPreventivo non inventa prezzi senza listino", () => {
    const proposal = costruisciPreventivoProposal({
      conoscenzaProposta: {
        puntiStimati: null,
        suggerimenti: [{ id: "CANCELLO", quantita: 1 }],
        regoleApplicate: [],
      },
      listino: listinoBase,
      input: {},
    });

    const preventivo = convertiProposalInPreventivo(proposal, {
      archivio: [],
      cliente: "Test",
    });

    expect(preventivo.lavorazioni[0].prezzoConfigurato).toBe(false);
    expect(preventivo.lavorazioni[0].prezzo).toBe(0);
  });

  it("appartamento 60 mq: QUADRO_12_MODULI a prezzo Listino, totale aggiornato", () => {
    const out = generaPreventivoEconomico(
      {
        superficieMq: 60,
        tipoImmobile: "appartamento",
        livelli: 1,
        livelloImpianto: "standard",
        extra: {},
      },
      {
        listino: listinoBase,
        conoscenzePersonali: [],
        brainPatterns: [],
        iva: 22,
        sconto: 0,
      }
    );

    expect(out.success).toBe(true);
    const quadro = out.proposal.lavorazioni.find(
      (l) => l.catalogoId === "QUADRO_12_MODULI"
    );
    expect(quadro).toBeTruthy();
    expect(quadro.quantita).toBe(1);
    expect(quadro.prezzoUnitario).toBe(350);
    expect(quadro.listinoId).toBe("quadro-elettrico");
    expect(out.proposal.subtotale).toBe(60 * 40 + 350);
    expect(out.proposal.totale).toBe((60 * 40 + 350) * 1.22);
  });

  it("retrocompat: vecchio preventivo senza catalogoId si apre arricchito", () => {
    const vecchio = {
      id: "old-1",
      nome: "Predisposizione impianto allarme",
      prezzo: 700,
      quantita: 1,
      unita: "cad",
    };
    const arricchito = arricchisciLavorazioneLegacy(vecchio);
    expect(arricchito.catalogoId).toBe("ALLARME");
    expect(arricchito.nome).toBe("Predisposizione impianto allarme");
  });
});
