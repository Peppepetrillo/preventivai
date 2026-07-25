/**
 * Base Tecnica — test dominio (struttura spiegabile).
 */

import { describe, expect, it } from "vitest";

import {
  BASE_TECNICA_AFFIDABILITA,
  BASE_TECNICA_CATEGORIE,
  BASE_TECNICA_ORIGINE_TIPO,
  BASE_TECNICA_PRIORITA,
  BASE_TECNICA_SCHEDE,
  BASE_TECNICA_SEZIONI,
  catalogoIdsDaBaseTecnica,
  contaSchede,
  condizioniSchedaSoddisfatte,
  consultaBaseTecnica,
  creaSchedaTecnica,
  elencaSchedeTecniche,
  mappaCatalogoIdASchedaTecnica,
  ottieniMotivazione,
  ottieniOrigine,
  ottieniSchedaTecnica,
  ottieniVerificheProfessionista,
  risolviSchedaTecnicaId,
  statisticheBaseTecnica,
  trovaPerCategoria,
} from "./index";
import { creaKnowledgeInput } from "../knowledge/knowledgeInputTypes";
import { runKnowledgeEngine } from "../knowledge/knowledgeEngine";

const schedaMinimaValida = (override = {}) => ({
  id: "BT_TEST",
  categoria: BASE_TECNICA_CATEGORIE.CUCINA,
  titolo: "Test",
  descrizione: "Descrizione test",
  condizioni: {},
  catalogoIds: ["CLIMA"],
  priorita: BASE_TECNICA_PRIORITA.MEDIA,
  noteTecniche: "Nota",
  origine: { tipo: BASE_TECNICA_ORIGINE_TIPO.BUONA_PRATICA },
  motivazione: "Motivazione di test",
  verificheProfessionista: ["Verifica A"],
  livelloAffidabilita: BASE_TECNICA_AFFIDABILITA.MEDIO,
  ...override,
});

describe("baseTecnicaTypes — struttura spiegabile", () => {
  it("creaSchedaTecnica richiede origine, motivazione, verifiche, affidabilità", () => {
    const scheda = creaSchedaTecnica(
      schedaMinimaValida({
        origine: {
          tipo: BASE_TECNICA_ORIGINE_TIPO.NORMATIVA,
          riferimento: "CEI 64-8",
        },
      })
    );
    expect(scheda.origine).toEqual({
      tipo: "NORMATIVA",
      riferimento: "CEI 64-8",
    });
    expect(scheda.motivazione).toBe("Motivazione di test");
    expect(scheda.verificheProfessionista).toEqual(["Verifica A"]);
    expect(scheda.livelloAffidabilita).toBe("MEDIO");
    expect(Object.isFrozen(scheda)).toBe(true);
  });

  it("valida campi obbligatori", () => {
    expect(() =>
      creaSchedaTecnica(schedaMinimaValida({ motivazione: "" }))
    ).toThrow(/motivazione/);
    expect(() =>
      creaSchedaTecnica(schedaMinimaValida({ origine: { tipo: "ALTRO" } }))
    ).toThrow(/origine\.tipo/);
    expect(() =>
      creaSchedaTecnica(schedaMinimaValida({ verificheProfessionista: [] }))
    ).toThrow(/verifica/);
    expect(() =>
      creaSchedaTecnica(schedaMinimaValida({ livelloAffidabilita: "TOP" }))
    ).toThrow(/livelloAffidabilita/);
    expect(() =>
      creaSchedaTecnica(schedaMinimaValida({ titolo: "" }))
    ).toThrow(/titolo/);
  });
});

describe("baseTecnicaData — schede aggiornate", () => {
  it("tutte le schede hanno campi di spiegabilità", () => {
    expect(BASE_TECNICA_SCHEDE.length).toBeGreaterThanOrEqual(12);
    for (const scheda of BASE_TECNICA_SCHEDE) {
      expect(scheda.origine?.tipo).toBeTruthy();
      expect(
        Object.values(BASE_TECNICA_ORIGINE_TIPO)
      ).toContain(scheda.origine.tipo);
      expect(scheda.motivazione.length).toBeGreaterThan(10);
      expect(scheda.verificheProfessionista.length).toBeGreaterThan(0);
      expect(
        Object.values(BASE_TECNICA_AFFIDABILITA)
      ).toContain(scheda.livelloAffidabilita);
      expect(scheda).not.toHaveProperty("prezzo");
      expect(scheda).not.toHaveProperty("quantita");
    }
  });

  it("sezioni documentate includono Punti impianto", () => {
    expect(BASE_TECNICA_SEZIONI.length).toBeGreaterThanOrEqual(12);
    const stats = statisticheBaseTecnica();
    for (const sezione of BASE_TECNICA_SEZIONI) {
      expect(stats.perCategoria[sezione.id]).toBeGreaterThanOrEqual(1);
    }
    expect(ottieniSchedaTecnica("BT_PUNTO_IMPIANTO")?.catalogoIds).toContain(
      "PUNTO_IMPIANTO"
    );
  });
});

describe("baseTecnicaService — motivazione / origine / collegamento", () => {
  it("recupera motivazione e origine", () => {
    expect(ottieniMotivazione("BT_CUCINA_INDUZIONE")).toMatch(/induzione/i);
    expect(ottieniOrigine("BT_CUCINA_INDUZIONE")).toMatchObject({
      tipo: "NORMATIVA",
    });
    expect(ottieniOrigine("BT_CUCINA_INDUZIONE").riferimento).toMatch(/CEI/);
    expect(
      ottieniVerificheProfessionista("BT_CLIMA_PREDISPOSIZIONE").length
    ).toBeGreaterThan(0);
  });

  it("mappa catalogoId → schedaTecnicaId", () => {
    const input = creaKnowledgeInput({ climatizzazione: true });
    expect(risolviSchedaTecnicaId("CLIMA", input)).toBe(
      "BT_CLIMA_PREDISPOSIZIONE"
    );
    const mappa = mappaCatalogoIdASchedaTecnica(input);
    expect(mappa.get("CLIMA")).toBe("BT_CLIMA_PREDISPOSIZIONE");
  });

  it("consulta e catalogoIds senza quantità", () => {
    const input = creaKnowledgeInput({
      reteDati: true,
      allarme: true,
      superficieMq: 60,
      tipoImmobile: "appartamento",
    });
    const ids = catalogoIdsDaBaseTecnica(input);
    expect(ids).toEqual(
      expect.arrayContaining(["PUNTO_DATI", "ALLARME", "QUADRO_12_MODULI"])
    );
    expect(consultaBaseTecnica(input).every((s) => s.motivazione)).toBe(true);
    expect(contaSchede()).toBe(elencaSchedeTecniche().length);
    expect(trovaPerCategoria(BASE_TECNICA_CATEGORIE.CUCINA)).toHaveLength(1);
  });
});

describe("Knowledge Engine → scheda tecnica (solo metadati)", () => {
  it("collega suggerimenti a schedaTecnicaId senza cambiare le regole", () => {
    const proposta = runKnowledgeEngine({
      superficieMq: 70,
      tipoImmobile: "appartamento",
      climatizzazione: true,
      allarme: true,
      reteDati: true,
    });

    const clima = proposta.suggerimenti.find((s) => s.catalogoId === "CLIMA");
    expect(clima).toMatchObject({
      catalogoId: "CLIMA",
      quantita: 1,
      schedaTecnicaId: "BT_CLIMA_PREDISPOSIZIONE",
    });

    const allarme = proposta.suggerimenti.find((s) => s.catalogoId === "ALLARME");
    expect(allarme.schedaTecnicaId).toBe("BT_ALLARME");

    const quadro = proposta.suggerimenti.find(
      (s) => s.catalogoId === "QUADRO_12_MODULI"
    );
    expect(quadro.schedaTecnicaId).toBe("BT_QUADRO_12_APPARTAMENTO");

    const schedaClima = proposta.schedeTecniche.find(
      (s) => s.id === "BT_CLIMA_PREDISPOSIZIONE"
    );
    expect(schedaClima.motivazione).toBeTruthy();
    expect(schedaClima.origine.tipo).toBeTruthy();
    expect(schedaClima.verificheProfessionista.length).toBeGreaterThan(0);
  });
});

describe("condizioniSchedaSoddisfatte", () => {
  it("rispetta flag e range mq", () => {
    expect(
      condizioniSchedaSoddisfatte(
        { climatizzazione: true },
        { climatizzazione: true }
      )
    ).toBe(true);
    expect(
      condizioniSchedaSoddisfatte({ mqMin: 101 }, { mq: 80 })
    ).toBe(false);
  });
});
