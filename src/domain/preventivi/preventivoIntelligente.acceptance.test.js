/**
 * Acceptance Test — Preventivo Intelligente
 * Flusso: Knowledge Engine → Catalogo → Listino → Proposal → PDF
 * Certifica stabilità architetturale. Nessuna nuova funzionalità.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import { listinoBase } from "../../data/listinoBase";
import {
  arricchisciLavorazioneLegacy,
  arricchisciPreventivoLegacy,
  isCatalogoId,
  reportSenzaCorrispondenzaListino,
  risolviPrezzoDaCatalogo,
} from "../catalogo";
import { resetConoscenze } from "../brain/personalKnowledgeRepository";
import { calcolaTotali } from "../../utils/preventivi";
import { buildPreventivoPdfDocument } from "../pdf";
import {
  convertiProposalInPreventivo,
  generaPreventivoEconomico,
} from "./preventivoProposalService";

vi.mock("../../services/cloudSyncService", () => ({
  salvaDatoCloud: vi.fn(),
  salvaDatoCloudImmediato: vi.fn(),
}));

const IVA = 22;

function genera(form) {
  return generaPreventivoEconomico(form, {
    listino: listinoBase,
    conoscenzePersonali: [],
    brainPatterns: [],
    iva: IVA,
    sconto: 0,
  });
}

function assertNessunPrezzoInventato(proposal) {
  for (const lav of proposal.lavorazioni) {
    expect(lav.catalogoId, `${lav.descrizione} senza catalogoId`).toBeTruthy();
    expect(isCatalogoId(lav.catalogoId)).toBe(true);

    if (lav.prezzoConfigurato) {
      const esito = risolviPrezzoDaCatalogo(lav.catalogoId, listinoBase);
      expect(esito.prezzoConfigurato).toBe(true);
      expect(lav.prezzoUnitario).toBe(esito.prezzoUnitario);
      expect(lav.listinoId).toBe(esito.voceListino.id);
      expect(lav.listinoId).toBeTruthy();
    } else {
      expect(lav.prezzoUnitario).toBeNull();
      expect(lav.totale).toBeNull();
    }
  }

  const soloConfigurate = proposal.lavorazioni
    .filter((l) => l.prezzoConfigurato)
    .map((l) => ({
      prezzo: l.prezzoUnitario,
      quantita: l.quantita,
    }));
  const attesi = calcolaTotali(soloConfigurate, 0, IVA);
  expect(proposal.subtotale).toBe(attesi.subtotale);
  expect(proposal.totaleIVA).toBe(attesi.importoIva);
  expect(proposal.totale).toBe(attesi.totale);
}

function assertPricingSoloViaCatalogo(proposal) {
  for (const lav of proposal.lavorazioni) {
    const diretto = risolviPrezzoDaCatalogo(lav.catalogoId, listinoBase);
    if (diretto.prezzoConfigurato) {
      expect(lav.prezzoConfigurato).toBe(true);
      expect(lav.prezzoUnitario).toBe(diretto.prezzoUnitario);
    } else {
      expect(lav.prezzoConfigurato).toBe(false);
      expect(lav.prezzoUnitario).toBeNull();
    }
  }
}

async function assertPdfDaProposal(proposal, cliente) {
  const preventivo = convertiProposalInPreventivo(proposal, {
    cliente,
    archivio: [],
    iva: IVA,
    sconto: 0,
  });

  const totaliPdf = calcolaTotali(
    preventivo.lavorazioni.filter((l) => l.prezzoConfigurato !== false),
    preventivo.sconto,
    preventivo.iva
  );

  const doc = buildPreventivoPdfDocument({
    preventivo,
    datiAzienda: { nomeDitta: "Acceptance Test Srl" },
    cliente,
    stato: preventivo.stato,
    lavorazioni: preventivo.lavorazioni,
    validita: preventivo.validita,
    pagamento: preventivo.pagamento,
    note: preventivo.note,
    sconto: preventivo.sconto,
    iva: preventivo.iva,
    acconto: 0,
    totali: totaliPdf,
  });

  expect(doc.lavorazioni.length).toBe(proposal.lavorazioni.length);

  for (let i = 0; i < proposal.lavorazioni.length; i += 1) {
    const prop = proposal.lavorazioni[i];
    const pdfLav = doc.lavorazioni[i];
    expect(pdfLav.descrizione).toBe(prop.descrizione);
    expect(pdfLav.quantita).toBe(prop.quantita);

    if (prop.prezzoConfigurato) {
      expect(pdfLav.prezzo).toBe(prop.prezzoUnitario);
      expect(pdfLav.totale).toBe(prop.quantita * prop.prezzoUnitario);
      expect(pdfLav.prezzoNonConfigurato).toBe(false);
    } else {
      expect(pdfLav.prezzoNonConfigurato).toBe(true);
      expect(pdfLav.prezzoLabel || "").toMatch(/Prezzo non configurato/i);
    }
  }

  expect(Math.abs(doc.riepilogo.totale - proposal.totale)).toBeLessThan(0.02);
  return { preventivo, doc, totali: totaliPdf };
}

describe("Acceptance — Preventivo Intelligente (Catalogo)", () => {
  beforeEach(() => {
    localStorage.clear();
    resetConoscenze();
  });

  describe("Scenario 1 — Appartamento 60 m²", () => {
    const form = {
      superficieMq: 60,
      tipoImmobile: "appartamento",
      livelli: 1,
      livelloImpianto: "standard",
      extra: {},
    };

    it("KE → Catalogo → Listino → Proposal: punti e QUADRO_12_MODULI valorizzati", () => {
      const out = genera(form);
      expect(out.success).toBe(true);
      const { proposal } = out;

      expect(proposal.riepilogo.puntiStimati).toBe(60);
      const punti = proposal.lavorazioni.find(
        (l) => l.catalogoId === "PUNTO_IMPIANTO"
      );
      expect(punti).toBeTruthy();
      expect(punti.quantita).toBe(60);
      expect(punti.prezzoConfigurato).toBe(true);
      expect(punti.prezzoUnitario).toBe(40);
      expect(punti.listinoId).toBe("punto-luce");
      expect(punti.totale).toBe(2400);

      const quadro12 = proposal.lavorazioni.find(
        (l) => l.catalogoId === "QUADRO_12_MODULI"
      );
      expect(quadro12).toBeTruthy();
      expect(quadro12.quantita).toBe(1);
      expect(quadro12.prezzoConfigurato).toBe(true);
      expect(quadro12.prezzoUnitario).toBe(350);
      expect(quadro12.listinoId).toBe("quadro-elettrico");
      expect(quadro12.totale).toBe(350);

      // RULE_002 (24 moduli) non applica ≤100 mq
      expect(
        proposal.lavorazioni.find((l) => l.catalogoId === "QUADRO_ELETTRICO")
      ).toBeUndefined();

      assertNessunPrezzoInventato(proposal);
      assertPricingSoloViaCatalogo(proposal);

      // Subtotale = 60 * 40 + 350
      expect(proposal.subtotale).toBe(2750);
      expect(proposal.totale).toBe(2750 * 1.22);
    });

    it("PDF scenario 1 coerente", async () => {
      const { proposal } = genera(form);
      await assertPdfDaProposal(proposal, "Cliente App 60");
    });
  });

  describe("Scenario 2 — Appartamento 120 m²", () => {
    const form60 = {
      superficieMq: 60,
      tipoImmobile: "appartamento",
      livelli: 1,
      livelloImpianto: "standard",
      extra: {},
    };
    const form120 = {
      superficieMq: 120,
      tipoImmobile: "appartamento",
      livelli: 1,
      livelloImpianto: "standard",
      extra: {},
    };

    it("incremento punti, quadro 24 moduli, differenza economica coerente", () => {
      const a = genera(form60).proposal;
      const b = genera(form120).proposal;

      const puntiA = a.lavorazioni.find((l) => l.catalogoId === "PUNTO_IMPIANTO");
      const puntiB = b.lavorazioni.find((l) => l.catalogoId === "PUNTO_IMPIANTO");
      expect(puntiB.quantita).toBe(120);
      expect(puntiB.quantita - puntiA.quantita).toBe(60);

      const quadro = b.lavorazioni.find(
        (l) => l.catalogoId === "QUADRO_ELETTRICO"
      );
      expect(quadro).toBeTruthy();
      expect(quadro.quantita).toBe(1);
      expect(quadro.descrizione).toBe("Quadro 24 moduli");
      expect(quadro.prezzoConfigurato).toBe(true);
      expect(quadro.prezzoUnitario).toBe(350);
      expect(quadro.listinoId).toBe("quadro-elettrico");

      assertNessunPrezzoInventato(b);

      // Entrambi hanno un quadro a 350 €; differenza = solo +60 punti
      expect(b.subtotale - a.subtotale).toBe(60 * 40);
      expect(a.subtotale).toBe(60 * 40 + 350);
      expect(b.subtotale).toBe(120 * 40 + 350);
      expect(b.totale).toBe((120 * 40 + 350) * 1.22);
    });

    it("PDF scenario 2 coerente", async () => {
      const { proposal } = genera(form120);
      await assertPdfDaProposal(proposal, "Cliente App 120");
    });
  });

  describe("Scenario 3 — Villa due livelli", () => {
    const form = {
      superficieMq: 180,
      tipoImmobile: "villa",
      livelli: 2,
      livelloImpianto: "premium",
      extra: {},
    };

    it("distribuzione, quadro, illuminazione esterna, predisposizioni senza prezzi inventati", () => {
      const { proposal } = genera(form);
      const ids = proposal.lavorazioni.map((l) => l.catalogoId);

      expect(ids).toContain("PUNTO_IMPIANTO");
      expect(ids).toContain("QUADRO_ELETTRICO");
      expect(ids).toContain("DISTRIBUZIONE_LINEE_PIANO");
      expect(ids).toContain("ILLUMINAZIONE_ESTERNA");
      expect(ids).toContain("CANCELLO");
      expect(ids).toContain("CITOFONO");

      const quadro = proposal.lavorazioni.find(
        (l) => l.catalogoId === "QUADRO_ELETTRICO"
      );
      expect(quadro.descrizione).toBe("Quadro 36 moduli");
      expect(quadro.prezzoConfigurato).toBe(true);
      expect(quadro.prezzoUnitario).toBe(350);

      const senzaPrezzo = proposal.lavorazioni.filter((l) => !l.prezzoConfigurato);
      expect(senzaPrezzo.map((l) => l.catalogoId).sort()).toEqual(
        [
          "CANCELLO",
          "DISTRIBUZIONE_LINEE_PIANO",
          "ILLUMINAZIONE_ESTERNA",
        ].sort()
      );
      for (const lav of senzaPrezzo) {
        expect(lav.prezzoUnitario).toBeNull();
        expect(lav.totale).toBeNull();
      }

      // Totali: solo punti + quadro + citofono
      const atteso =
        180 * 40 + // punti
        350 + // quadro
        100; // citofono
      expect(proposal.subtotale).toBe(atteso);
      assertNessunPrezzoInventato(proposal);
    });

    it("PDF scenario 3: voci senza listino → Prezzo non configurato", async () => {
      const { proposal } = genera(form);
      const { doc } = await assertPdfDaProposal(proposal, "Cliente Villa");
      const labels = doc.lavorazioni
        .filter((l) => l.prezzoNonConfigurato)
        .map((l) => l.descrizione);
      expect(labels).toEqual(
        expect.arrayContaining([
          "Distribuzione linee per piano",
          "Illuminazione esterna",
          "Predisposizione cancello",
        ])
      );
    });
  });

  describe("Scenario 4 — Negozio", () => {
    const form = {
      superficieMq: 90,
      tipoImmobile: "negozio",
      livelli: 1,
      livelloImpianto: "standard",
      extra: {},
    };

    it("pipeline Catalogo stabile (punti valorizzati, nessun matching testuale)", () => {
      const { proposal } = genera(form);
      expect(proposal.success !== false).toBe(true);
      expect(proposal.lavorazioni.every((l) => isCatalogoId(l.catalogoId))).toBe(
        true
      );

      const punti = proposal.lavorazioni.find(
        (l) => l.catalogoId === "PUNTO_IMPIANTO"
      );
      expect(punti.quantita).toBe(90);
      expect(punti.prezzoConfigurato).toBe(true);
      expect(punti.listinoId).toBe("punto-luce");

      // Coverage tipologica negozio non presente in Knowledge Base attuale
      // (prese / linee dedicate): certificato solo il percorso caldo Catalogo.
      assertNessunPrezzoInventato(proposal);
      assertPricingSoloViaCatalogo(proposal);
    });

    it("PDF scenario 4 coerente", async () => {
      const { proposal } = genera(form);
      await assertPdfDaProposal(proposal, "Cliente Negozio");
    });
  });

  describe("Scenario 5 — Ufficio", () => {
    const form = {
      superficieMq: 110,
      tipoImmobile: "ufficio",
      livelli: 1,
      livelloImpianto: "standard",
      extra: {},
    };

    it("pipeline Catalogo: punti + quadro, prezzi via chiaveListino", () => {
      const { proposal } = genera(form);
      const punti = proposal.lavorazioni.find(
        (l) => l.catalogoId === "PUNTO_IMPIANTO"
      );
      const quadro = proposal.lavorazioni.find(
        (l) => l.catalogoId === "QUADRO_ELETTRICO"
      );

      expect(punti.quantita).toBe(110);
      expect(quadro).toBeTruthy();
      expect(quadro.descrizione).toBe("Quadro 24 moduli");
      expect(quadro.prezzoUnitario).toBe(350);

      // Coverage tipologica ufficio (LAN / PUNTO_DATI) non in Knowledge Base attuale
      expect(
        proposal.lavorazioni.find((l) => l.catalogoId === "PUNTO_DATI")
      ).toBeUndefined();

      assertNessunPrezzoInventato(proposal);
      assertPricingSoloViaCatalogo(proposal);
      expect(proposal.subtotale).toBe(110 * 40 + 350);
    });

    it("PDF scenario 5 coerente", async () => {
      const { proposal } = genera(form);
      await assertPdfDaProposal(proposal, "Cliente Ufficio");
    });
  });

  describe("Retrocompatibilità", () => {
    it("vecchio preventivo senza catalogoId si apre arricchito senza perdere totali", () => {
      const vecchio = {
        id: "legacy-1",
        numero: "PREV-2024-0001",
        cliente: "Rossi Legacy",
        stato: "Bozza",
        sconto: 0,
        iva: 22,
        lavorazioni: [
          {
            id: "x1",
            nome: "Punto luce",
            prezzo: 40,
            quantita: 10,
            unita: "cad",
          },
          {
            id: "x2",
            nome: "Predisposizione impianto allarme",
            prezzo: 700,
            quantita: 1,
            unita: "cad",
          },
          {
            id: "x3",
            nome: "Voce custom storica",
            prezzo: 123,
            quantita: 2,
            unita: "cad",
          },
        ],
      };

      const totalePrima = calcolaTotali(vecchio.lavorazioni, 0, 22).totale;
      const arricchito = arricchisciPreventivoLegacy(vecchio);
      const totaleDopo = calcolaTotali(arricchito.lavorazioni, 0, 22).totale;

      expect(totaleDopo).toBe(totalePrima);
      expect(arricchito.lavorazioni[0].catalogoId).toBe("PUNTO_LUCE");
      expect(arricchito.lavorazioni[1].catalogoId).toBe("ALLARME");
      // Voce sconosciuta: nessuna perdita dati, catalogoId assente
      expect(arricchito.lavorazioni[2].nome).toBe("Voce custom storica");
      expect(arricchito.lavorazioni[2].prezzo).toBe(123);
      expect(arricchito.lavorazioni[2].quantita).toBe(2);
    });

    it("arricchisciLavorazioneLegacy da listinoId slug", () => {
      const lav = arricchisciLavorazioneLegacy({
        id: "quadro-elettrico-1710000000",
        nome: "Quadro elettrico",
        prezzo: 350,
        quantita: 1,
      });
      expect(lav.catalogoId).toBe("QUADRO_ELETTRICO");
      expect(lav.listinoId).toBe("quadro-elettrico");
    });
  });

  describe("KE 2.0 — caratteristiche impianto", () => {
    it("flag indipendenti → catalogoId valorizzati dal Listino dove disponibile", () => {
      const out = genera({
        superficieMq: 70,
        tipoImmobile: "appartamento",
        cucina: "induzione",
        climatizzazione: true,
        reteDati: true,
        impiantoTv: true,
        citofono: true,
        videocitofono: true,
        allarme: true,
        cancelloAutomatico: true,
        predisposizioneFotovoltaico: true,
        predisposizioneColonnina: true,
      });

      expect(out.success).toBe(true);
      const ids = out.proposal.lavorazioni.map((l) => l.catalogoId);

      expect(ids).toEqual(
        expect.arrayContaining([
          "PUNTO_IMPIANTO",
          "QUADRO_12_MODULI",
          "CLIMA",
          "PUNTO_DATI",
          "PUNTO_TV",
          "CITOFONO",
          "ALLARME",
          "CANCELLO",
          "FOTOVOLTAICO",
          "RICARICA_AUTO",
          "LINEA_INDUZIONE",
          "VIDEOCITOFONO",
        ])
      );

      const induzione = out.proposal.lavorazioni.find(
        (l) => l.catalogoId === "LINEA_INDUZIONE"
      );
      expect(induzione.prezzoConfigurato).toBe(true);
      expect(induzione.prezzoUnitario).toBe(120);

      const video = out.proposal.lavorazioni.find(
        (l) => l.catalogoId === "VIDEOCITOFONO"
      );
      expect(video.prezzoConfigurato).toBe(true);
      expect(video.prezzoUnitario).toBe(180);

      const clima = out.proposal.lavorazioni.find((l) => l.catalogoId === "CLIMA");
      expect(clima.prezzoConfigurato).toBe(true);
      expect(clima.prezzoUnitario).toBe(50);

      const dati = out.proposal.lavorazioni.find(
        (l) => l.catalogoId === "PUNTO_DATI"
      );
      expect(dati.prezzoConfigurato).toBe(true);
      expect(dati.listinoId).toBe("punto-ethernet");

      assertNessunPrezzoInventato(out.proposal);
      assertPricingSoloViaCatalogo(out.proposal);
    });

    it("ufficio con rete dati include PUNTO_DATI", () => {
      const out = genera({
        superficieMq: 110,
        tipoImmobile: "ufficio",
        reteDati: true,
      });
      expect(
        out.proposal.lavorazioni.some((l) => l.catalogoId === "PUNTO_DATI")
      ).toBe(true);
    });
  });

  describe("Controlli tecnici percorso caldo", () => {
    it("pricing esclusivamente catalogoId → chiaveListino → Listino", () => {
      const out = genera({
        superficieMq: 160,
        tipoImmobile: "appartamento",
        climatizzazione: true,
        allarme: true,
      });
      assertPricingSoloViaCatalogo(out.proposal);

      for (const lav of out.proposal.lavorazioni) {
        if (!lav.prezzoConfigurato) continue;
        const cat = risolviPrezzoDaCatalogo(lav.catalogoId, listinoBase);
        expect(cat.catalogo.chiaveListino).toBe(lav.listinoId);
        expect(cat.voceListino.nome).not.toBe(lav.catalogoId);
      }
    });

    it("report gap Catalogo↔Listino disponibile e stabile", () => {
      const report = reportSenzaCorrispondenzaListino();
      expect(report.length).toBeGreaterThan(0);
      expect(report.every((r) => r.motivo && r.catalogoId)).toBe(true);
      expect(report.map((r) => r.catalogoId)).toEqual(
        expect.arrayContaining([
          "BUS",
          "CANCELLO",
          "ILLUMINAZIONE_ESTERNA",
          "VIDEOSORVEGLIANZA",
        ])
      );
    });
  });
});
