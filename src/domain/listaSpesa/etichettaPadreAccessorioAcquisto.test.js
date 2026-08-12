import { describe, expect, it } from "vitest";

import {
  creaVoceListaSpesa,
  etichettaPadreAccessorioAcquisto,
} from "./listaSpesaDomain";

describe("etichettaPadreAccessorioAcquisto", () => {
  const padre = creaVoceListaSpesa({
    nome: "Presa civile — Bipasso",
    quantita: 12,
    unita: "pz",
    lavoroId: "c1",
    distintaVoceId: "voce-padre",
  });

  const accessorio = creaVoceListaSpesa({
    nome: "Cassetta — 503",
    quantita: 12,
    unita: "pz",
    lavoroId: "c1",
    distintaVoceId: "voce-acc",
    parentVoceId: "voce-padre",
    origineAccessorio: "suggerito",
  });

  it("mostra per: padre quando accessorio suggerito", () => {
    expect(etichettaPadreAccessorioAcquisto(accessorio, [padre, accessorio])).toBe(
      "per: Presa civile — Bipasso"
    );
  });

  it("non mostra nulla per materiali senza campi accessorio", () => {
    expect(etichettaPadreAccessorioAcquisto(padre, [padre, accessorio])).toBe("");
  });

  it("non mostra nulla se manca parentVoceId", () => {
    const voce = { ...accessorio, parentVoceId: undefined };
    expect(etichettaPadreAccessorioAcquisto(voce, [padre])).toBe("");
  });

  it("non mostra nulla se origine non è suggerito", () => {
    const voce = { ...accessorio, origineAccessorio: "manuale" };
    expect(etichettaPadreAccessorioAcquisto(voce, [padre])).toBe("");
  });

  it("non mostra nulla se il padre non è risolvibile", () => {
    expect(etichettaPadreAccessorioAcquisto(accessorio, [accessorio])).toBe("");
  });
});
