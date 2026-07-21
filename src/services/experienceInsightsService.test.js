import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getAttivitaFrequenti,
  getDurataMediaPerTipo,
  getInsights,
  getMaterialiFrequenti,
  getStatisticheGenerali,
  getTipiLavoroFrequenti,
} from "./experienceInsightsService";
import * as experienceService from "./experienceService";

vi.mock("./cloudSyncService", () => ({
  salvaDatoCloud: vi.fn(),
}));

const esperienzaImpianto = {
  id: 1,
  cantiereId: 100,
  tipoLavoro: "impianto",
  durataGiorni: 6,
  checklistCompletata: [
    { testo: "Eseguire Punto luce", completata: true },
    { testo: "Verifica finale", completata: true },
  ],
  attivitaAggiunte: ["Verifica finale"],
  materiali: [
    { nome: "Cavo 2.5mm", quantita: 50, unita: "m" },
    { nome: "Canalina", quantita: 10, unita: "m" },
  ],
};

const esperienzaIntervento = {
  id: 2,
  cantiereId: 101,
  tipoLavoro: "intervento",
  durataGiorni: 2,
  checklistCompletata: [
    { testo: "Eseguire Punto luce", completata: true },
  ],
  attivitaAggiunte: [],
  materiali: [
    { nome: "Cavo 2.5mm", quantita: 20, unita: "m" },
  ],
};

const esperienzaExpress = {
  id: 3,
  cantiereId: 102,
  tipoLavoro: "impianto",
  durataGiorni: 4,
  checklistCompletata: [
    { testo: "Eseguire Punto luce", completata: false },
  ],
  attivitaAggiunte: ["Pulizia cantiere"],
  materiali: [
    { nome: "cavo 2.5mm", quantita: 5, unita: "m" },
  ],
};

describe("experienceInsightsService", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe("nessuna esperienza", () => {
    it("restituisce zeri e array vuoti", () => {
      expect(getStatisticheGenerali([])).toEqual({
        totaleEsperienze: 0,
        totaleCantieriCompletati: 0,
        durataMedia: 0,
        totaleMaterialiUtilizzati: 0,
        totaleAttivitaRegistrate: 0,
      });
      expect(getTipiLavoroFrequenti([])).toEqual([]);
      expect(getAttivitaFrequenti([])).toEqual([]);
      expect(getMaterialiFrequenti([])).toEqual([]);
      expect(getDurataMediaPerTipo([])).toEqual([]);
    });

    it("getInsights aggrega risultati vuoti", () => {
      const insights = getInsights([]);
      expect(insights.statistiche.totaleEsperienze).toBe(0);
      expect(insights.tipiLavoro).toEqual([]);
      expect(insights.attivita).toEqual([]);
      expect(insights.materiali).toEqual([]);
      expect(insights.durataMedia).toEqual([]);
    });
  });

  describe("una esperienza", () => {
    it("calcola statistiche corrette", () => {
      const stats = getStatisticheGenerali([esperienzaImpianto]);

      expect(stats).toEqual({
        totaleEsperienze: 1,
        totaleCantieriCompletati: 1,
        durataMedia: 6,
        totaleMaterialiUtilizzati: 2,
        totaleAttivitaRegistrate: 3,
      });
    });

    it("estrae tipo, attività e materiali", () => {
      expect(getTipiLavoroFrequenti([esperienzaImpianto])).toEqual([
        { tipo: "impianto", count: 1 },
      ]);
      expect(getAttivitaFrequenti([esperienzaImpianto])[0]).toMatchObject({
        nome: "Verifica finale",
        count: 2,
      });
      expect(getMaterialiFrequenti([esperienzaImpianto])).toEqual([
        { nome: "Canalina", count: 1 },
        { nome: "Cavo 2.5mm", count: 1 },
      ]);
      expect(getDurataMediaPerTipo([esperienzaImpianto])).toEqual([
        { tipo: "impianto", durataMedia: 6 },
      ]);
    });
  });

  describe("più esperienze", () => {
    const elenco = [
      esperienzaImpianto,
      esperienzaIntervento,
      esperienzaExpress,
    ];

    it("aggrega totali e durata media", () => {
      const stats = getStatisticheGenerali(elenco);

      expect(stats.totaleEsperienze).toBe(3);
      expect(stats.totaleCantieriCompletati).toBe(3);
      expect(stats.durataMedia).toBe(4);
      expect(stats.totaleMaterialiUtilizzati).toBe(4);
      expect(stats.totaleAttivitaRegistrate).toBe(6);
    });

    it("ordina tipi di lavoro per frequenza decrescente", () => {
      expect(getTipiLavoroFrequenti(elenco)).toEqual([
        { tipo: "impianto", count: 2 },
        { tipo: "intervento", count: 1 },
      ]);
    });

    it("ordina attività duplicate correttamente", () => {
      const attivita = getAttivitaFrequenti(elenco);
      expect(attivita[0]).toEqual({ nome: "Eseguire Punto luce", count: 3 });
      expect(attivita.find((a) => a.nome === "Verifica finale")).toEqual({
        nome: "Verifica finale",
        count: 2,
      });
    });

    it("aggrega materiali case-insensitive", () => {
      const materiali = getMaterialiFrequenti(elenco);
      expect(materiali[0]).toEqual({ nome: "Cavo 2.5mm", count: 3 });
    });

    it("calcola durata media per tipo", () => {
      expect(getDurataMediaPerTipo(elenco)).toEqual([
        { tipo: "impianto", durataMedia: 5 },
        { tipo: "intervento", durataMedia: 2 },
      ]);
    });

    it("getInsights restituisce tutte le sezioni", () => {
      const insights = getInsights(elenco);

      expect(insights.statistiche.totaleEsperienze).toBe(3);
      expect(insights.tipiLavoro).toHaveLength(2);
      expect(insights.attivita.length).toBeGreaterThan(0);
      expect(insights.materiali[0].nome).toBe("Cavo 2.5mm");
      expect(insights.durataMedia).toHaveLength(2);
    });
  });

  describe("dati incompleti e null", () => {
    it("ignora null, undefined e non-oggetti nell'elenco", () => {
      const stats = getStatisticheGenerali([
        null,
        undefined,
        "stringa",
        42,
        esperienzaIntervento,
      ]);

      expect(stats.totaleEsperienze).toBe(1);
      expect(stats.durataMedia).toBe(2);
    });

    it("gestisce esperienze senza checklist, materiali e durata", () => {
      const incompleta = {
        id: 9,
        tipoLavoro: "express",
      };

      expect(getStatisticheGenerali([incompleta])).toEqual({
        totaleEsperienze: 1,
        totaleCantieriCompletati: 1,
        durataMedia: 0,
        totaleMaterialiUtilizzati: 0,
        totaleAttivitaRegistrate: 0,
      });
      expect(getAttivitaFrequenti([incompleta])).toEqual([]);
      expect(getMaterialiFrequenti([incompleta])).toEqual([]);
      expect(getDurataMediaPerTipo([incompleta])).toEqual([]);
    });

    it("gestisce checklist e materiali null", () => {
      const esperienza = {
        tipoLavoro: "impianto",
        durataGiorni: 3,
        checklistCompletata: null,
        attivitaAggiunte: null,
        materiali: null,
      };

      expect(getStatisticheGenerali([esperienza]).totaleAttivitaRegistrate).toBe(
        0
      );
      expect(getAttivitaFrequenti([esperienza])).toEqual([]);
      expect(getMaterialiFrequenti([esperienza])).toEqual([]);
    });

    it("usa tipo non_specificato se tipoLavoro manca", () => {
      expect(getTipiLavoroFrequenti([{ durataGiorni: 1 }])).toEqual([
        { tipo: "non_specificato", count: 1 },
      ]);
    });

    it("ignora durate non valide", () => {
      const elenco = [
        { tipoLavoro: "impianto", durataGiorni: null },
        { tipoLavoro: "impianto", durataGiorni: 0 },
        { tipoLavoro: "impianto", durataGiorni: -2 },
        { tipoLavoro: "impianto", durataGiorni: "abc" },
        { tipoLavoro: "impianto", durataGiorni: 5 },
      ];

      expect(getStatisticheGenerali(elenco).durataMedia).toBe(5);
      expect(getDurataMediaPerTipo(elenco)).toEqual([
        { tipo: "impianto", durataMedia: 5 },
      ]);
    });

    it("ignora voci checklist/materiali senza nome", () => {
      const esperienza = {
        checklistCompletata: [
          { testo: "  " },
          { testo: null },
          {},
          null,
          { testo: "OK" },
        ],
        attivitaAggiunte: ["", null, "Extra"],
        materiali: [{ nome: "" }, { nome: null }, {}, null, { nome: "Vite" }],
      };

      expect(getAttivitaFrequenti([esperienza])).toEqual([
        { nome: "Extra", count: 1 },
        { nome: "OK", count: 1 },
      ]);
      expect(getMaterialiFrequenti([esperienza])).toEqual([
        { nome: "Vite", count: 1 },
      ]);
    });

    it("accetta attività aggiunte come oggetti con testo/nome", () => {
      const esperienza = {
        attivitaAggiunte: [
          { testo: "Controllo quadro" },
          { nome: "Sigillatura" },
        ],
      };

      expect(getAttivitaFrequenti([esperienza])).toEqual([
        { nome: "Controllo quadro", count: 1 },
        { nome: "Sigillatura", count: 1 },
      ]);
    });

    it("accetta input non-array senza lanciare", () => {
      expect(getStatisticheGenerali(null).totaleEsperienze).toBe(0);
      expect(getStatisticheGenerali(undefined).totaleEsperienze).toBe(0);
      expect(getTipiLavoroFrequenti("x")).toEqual([]);
      expect(getInsights(false).statistiche.totaleEsperienze).toBe(0);
    });
  });

  describe("integrazione con experienceService", () => {
    it("legge dall'archivio quando non riceve argomenti", () => {
      vi.spyOn(experienceService, "recuperaEsperienze").mockReturnValue([
        esperienzaIntervento,
      ]);

      expect(getStatisticheGenerali().totaleEsperienze).toBe(1);
      expect(getInsights().tipiLavoro[0].tipo).toBe("intervento");
    });

    it("restituisce vuoto se recuperaEsperienze fallisce", () => {
      vi.spyOn(experienceService, "recuperaEsperienze").mockImplementation(
        () => {
          throw new Error("storage non disponibile");
        }
      );

      expect(getStatisticheGenerali().totaleEsperienze).toBe(0);
      expect(getInsights().attivita).toEqual([]);
    });
  });
});
