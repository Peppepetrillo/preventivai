import { beforeEach, describe, expect, it, vi } from "vitest";

import { generaPropostaPreventivo } from "../knowledge/preventivoIntelligenteService";
import {
  costruisciPreventivoProposal,
  generaPreventivoEconomico,
} from "./preventivoProposalService";
import * as knowledgeService from "../knowledge/preventivoIntelligenteService";
import * as listinoService from "../../features/listino/listinoCatalogService";
import * as brainPattern from "../brain/brainPatternService";
import { resetConoscenze } from "../brain/personalKnowledgeRepository";

describe("pipeline KE → Proposal Service", () => {
  beforeEach(() => {
    localStorage.clear();
    resetConoscenze();
    vi.restoreAllMocks();
  });

  it("dopo generaPropostaPreventivo chiama costruisciPreventivoProposal via facade", () => {
    const spyKe = vi.spyOn(knowledgeService, "generaPropostaPreventivo");

    const out = generaPreventivoEconomico({
      superficieMq: 160,
      numeroLivelli: "1",
      tipoImmobile: "appartamento",
      livelloImpianto: "standard",
      extra: { allarme: true },
    });

    expect(spyKe).toHaveBeenCalledTimes(1);
    expect(out.success).toBe(true);

    const p = out.proposal;
    expect(p.lavorazioni.length).toBeGreaterThan(0);
    expect(p.riepilogo.puntiStimati).toBe(160);
    expect(typeof p.totale).toBe("number");
    expect(typeof p.totaleIVA).toBe("number");

    // PreventivoProposal shape — non output KE grezzo
    expect(p.suggerimenti).toBeUndefined();
    expect(p.puntiStimati).toBeUndefined();
    expect(p.conoscenzaProposta).toBeTruthy();
    expect(Array.isArray(p.regoleApplicate)).toBe(true);
  });

  it("se listino fallisce, costruisce comunque la PreventivoProposal", () => {
    vi.spyOn(listinoService, "caricaCatalogoListino").mockImplementation(() => {
      throw new Error("listino_rotto");
    });

    const out = generaPreventivoEconomico({
      superficieMq: 160,
      tipoImmobile: "appartamento",
      livelloImpianto: "standard",
      extra: {},
    });

    expect(out.success).toBe(true);
    expect(out.proposal.riepilogo.puntiStimati).toBe(160);
    expect(out.proposal.lavorazioni.length).toBeGreaterThan(0);
    // Senza listino: nessuna voce con prezzo inventato
    expect(
      out.proposal.lavorazioni.every((l) => l.prezzoConfigurato === false)
    ).toBe(true);
    expect(out.proposal.totale).toBe(0);
  });

  it("se Brain pattern fallisce, la proposal economica resta disponibile", () => {
    vi.spyOn(brainPattern, "ottieniPattern").mockImplementation(() => {
      throw new Error("brain_rotto");
    });

    const out = generaPreventivoEconomico({
      superficieMq: 120,
      tipoImmobile: "appartamento",
      extra: {},
    });

    expect(out.success).toBe(true);
    expect(out.proposal.brainInsights.patterns).toEqual([]);
  });

  it("costruisciPreventivoProposal produce lo stesso elenco lavorazioni del KE", () => {
    const form = {
      superficieMq: 160,
      numeroLivelli: "1",
      tipoImmobile: "appartamento",
      livelloImpianto: "standard",
      extra: {},
    };
    const ke = generaPropostaPreventivo(form);
    const listino = listinoService.caricaCatalogoListino();
    const proposal = costruisciPreventivoProposal({
      conoscenzaProposta: ke.proposta,
      listino,
      input: form,
    });

    const titoliKe = new Set(
      (ke.proposta.suggerimenti || []).map((s) => s.titolo)
    );
    if (ke.proposta.quadroSuggerito) {
      titoliKe.add(ke.proposta.quadroSuggerito);
    }
    const titoliProp = new Set(
      proposal.lavorazioni.map((l) => l.descrizione)
    );
    expect([...titoliKe].sort()).toEqual([...titoliProp].sort());
  });
});
