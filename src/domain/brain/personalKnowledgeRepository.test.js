import { beforeEach, describe, expect, it } from "vitest";

import { STORAGE_KEYS } from "../../app/storageKeys";
import {
  aggiornaConoscenza,
  contaConoscenze,
  creaConoscenza,
  eliminaConoscenza,
  elencaConoscenze,
  resetConoscenze,
} from "./personalKnowledgeRepository";

describe("personalKnowledgeRepository", () => {
  beforeEach(() => {
    localStorage.clear();
    resetConoscenze();
  });

  it("CRUD e persistenza su chiave dedicata", () => {
    const creata = creaConoscenza({
      titolo: "Villa: citofono sempre",
      categoria: "Immobile",
    });

    expect(elencaConoscenze()).toHaveLength(1);
    expect(
      JSON.parse(localStorage.getItem(STORAGE_KEYS.brainPersonalKnowledge))[0]
        .titolo
    ).toBe("Villa: citofono sempre");

    const aggiornata = aggiornaConoscenza(creata.id, {
      titolo: "Villa: videocitofono",
    });
    expect(aggiornata.titolo).toBe("Villa: videocitofono");
    expect(contaConoscenze()).toBe(1);

    expect(eliminaConoscenza(creata.id)).toBe(true);
    expect(elencaConoscenze()).toEqual([]);
    expect(contaConoscenze()).toBe(0);
  });
});
