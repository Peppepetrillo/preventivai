import { describe, expect, it } from "vitest";

import { buildPreventivoPdfDocument } from "../../domain/pdf/pdfTemplateService";
import { convertiProposalInPreventivo } from "../../domain/preventivi/preventivoProposalService";
import { creaCantiereDaPreventivo } from "../cantieri/cantieriDomain";
import {
  creaLavorazioneDaCatalogoMateriale,
  creaLavorazioneManuale,
} from "./lavorazionePreventivoUtils";
import { creaPreventivo } from "./preventiviDomain";
import {
  TIPOLOGIA_IMPIANTO,
  TIPOLOGIA_IMPIANTO_DEFAULT,
  categoriaCatalogoDaTipologia,
} from "./tipologiaImpiantoConfig";
import {
  etichettaTipologiaPreventivo,
  oggettoPdfTipologia,
  risolviTipologiaImpianto,
  tipologiaImpiantoDaFormIntelligente,
} from "./tipologiaImpiantoUtils";
import { calcolaTotali } from "../../utils/preventivi";
import { WIZARD_AZIONI } from "./wizard/useWizardPreventivoState";
import { titoloPreventivoHeader } from "./utils/preventivoHeroCta";

describe("UX-13 tipologiaImpianto", () => {
  it("config centralizzata con categorie catalogo", () => {
    expect(categoriaCatalogoDaTipologia(TIPOLOGIA_IMPIANTO.allarme)).toBe(
      "allarme"
    );
    expect(categoriaCatalogoDaTipologia(TIPOLOGIA_IMPIANTO.altro)).toBeUndefined();
  });

  it("persiste tipologiaImpianto in creaPreventivo", () => {
    const preventivo = creaPreventivo({
      archivio: [],
      cliente: "Mario Rossi",
      lavorazioni: [
        creaLavorazioneManuale({ nome: "Test", prezzo: 100, quantita: 1 }),
      ],
      sconto: 0,
      iva: 22,
      validita: 30,
      pagamento: "Bonifico",
      note: "",
      tipoLavoro: "impianto",
      tipologiaImpianto: TIPOLOGIA_IMPIANTO.videosorveglianza,
    });

    expect(preventivo.tipologiaImpianto).toBe("videosorveglianza");
    expect(preventivo.tipoLavoro).toBe("impianto");
  });

  it("legacy senza tipologiaImpianto → fallback elettrico", () => {
    expect(risolviTipologiaImpianto({ tipoLavoro: "impianto" })).toBe(
      TIPOLOGIA_IMPIANTO_DEFAULT
    );
    expect(etichettaTipologiaPreventivo({ tipoLavoro: "impianto" })).toBe(
      "Elettrico"
    );
  });

  it("PDF oggetto dinamico per tipologia", () => {
    expect(
      oggettoPdfTipologia({ tipologiaImpianto: "allarme" })
    ).toBe("Preventivo impianto antintrusione");
    expect(
      oggettoPdfTipologia({ tipologiaImpianto: "rete-dati" })
    ).toBe("Preventivo rete dati");
    expect(oggettoPdfTipologia({ tipoLavoro: "impianto" })).toBe(
      "Preventivo lavori elettrici"
    );
  });

  it("buildPreventivoPdfDocument usa oggetto da tipologia", () => {
    const doc = buildPreventivoPdfDocument({
      preventivo: { tipologiaImpianto: "domotica", numero: "PREV-1" },
      lavorazioni: [],
      totali: calcolaTotali([], 0, 22),
    });
    expect(doc.intestazione.oggetto).toBe("Preventivo domotica");
  });

  it("titolo header usa tipologia se esplicita, altrimenti prima lavorazione", () => {
    expect(
      titoloPreventivoHeader(
        { tipologiaImpianto: "allarme" },
        [{ nome: "Sensore" }]
      )
    ).toBe("Allarme");
    expect(
      titoloPreventivoHeader({ id: "1" }, [{ nome: "Impianto bagno" }])
    ).toBe("Impianto bagno");
  });

  it("Preventivo Intelligente inferisce tipologia da flags", () => {
    expect(
      tipologiaImpiantoDaFormIntelligente({ allarme: true, reteDati: true })
    ).toBe("allarme");
    expect(
      tipologiaImpiantoDaFormIntelligente({ impiantoTv: true })
    ).toBe("tv-sat");
  });
});

describe("UX-13 catalogo materiali nel preventivo", () => {
  it("crea lavorazione con snapshot prezzo e riferimenti catalogo", () => {
    const lav = creaLavorazioneDaCatalogoMateriale({
      nome: "FG16 3×2,5",
      quantita: 50,
      unita: "m",
      prezzoUnitario: 1.8,
      famigliaId: "fg16",
      varianteId: "fg16-3x2-5",
      prezzoCatalogoOriginale: 1.8,
    });

    expect(lav.origineVoce).toBe("catalogo-materiale");
    expect(lav.prezzo).toBe(1.8);
    expect(lav.quantita).toBe(50);
    expect(lav.prezzoCatalogoOriginale).toBe(1.8);
    expect(lav.famigliaId).toBe("fg16");
  });

  it("materiale senza prezzo catalogo richiede prezzo utente nello snapshot", () => {
    const lav = creaLavorazioneDaCatalogoMateriale({
      nome: "Cavo senza prezzo",
      quantita: 10,
      unita: "m",
      prezzoUnitario: 2.5,
    });
    expect(lav.prezzo).toBe(2.5);
    expect(lav.prezzoCatalogoOriginale).toBe(2.5);
  });

  it("snapshot: catalogo cambiato non altera lavorazione salvata", () => {
    const lav = creaLavorazioneDaCatalogoMateriale({
      nome: "FG16",
      quantita: 50,
      prezzoUnitario: 1.8,
      prezzoCatalogoOriginale: 1.8,
      famigliaId: "fg16",
      varianteId: "v1",
    });

    const catalogoNuovoPrezzo = 2.0;
    expect(lav.prezzo).toBe(1.8);
    expect(catalogoNuovoPrezzo).toBe(2.0);
    expect(lav.prezzo).toBe(1.8);
  });
});

describe("UX-13 calcoli economici unificati", () => {
  const listino = creaLavorazioneManuale({
    nome: "Posa",
    prezzo: 50,
    quantita: 2,
  });
  listino.origineVoce = "listino";

  const materiale = creaLavorazioneDaCatalogoMateriale({
    nome: "Cavo",
    prezzoUnitario: 1.8,
    quantita: 50,
    unita: "m",
  });

  const manuale = creaLavorazioneManuale({
    nome: "Installazione allarme",
    prezzo: 1500,
    quantita: 1,
  });

  it("materiale singolo e materiale × quantità", () => {
    expect(calcolaTotali([materiale], 0, 0).subtotale).toBe(90);
  });

  it("lavorazione + materiale + voce manuale", () => {
    const totali = calcolaTotali([listino, materiale, manuale], 0, 0);
    expect(totali.subtotale).toBeCloseTo(50 * 2 + 90 + 1500, 2);
  });

  it("prezzo totale con quantità 1", () => {
    expect(calcolaTotali([manuale], 0, 0).subtotale).toBe(1500);
  });

  it("sconto globale e IVA", () => {
    const totali = calcolaTotali([materiale], 10, 22);
    expect(totali.importoSconto).toBeCloseTo(9, 2);
    expect(totali.totale).toBeCloseTo(98.78, 1);
  });
});

describe("UX-13 conversione cantiere", () => {
  it("conserva clienteId, lavorazioni snapshot e tipologiaImpianto", () => {
    const preventivo = {
      id: 1,
      numero: "PREV-2026-0001",
      cliente: "Mario Rossi",
      tipologiaImpianto: "videosorveglianza",
      lavorazioni: [
        creaLavorazioneDaCatalogoMateriale({
          nome: "Telecamera",
          prezzoUnitario: 120,
          quantita: 2,
        }),
      ],
      totale: 240,
    };

    const cantiere = creaCantiereDaPreventivo(preventivo, {
      clienteId: "cli-1",
    });

    expect(cantiere.clienteId).toBe("cli-1");
    expect(cantiere.tipologiaImpianto).toBe("videosorveglianza");
    expect(cantiere.lavorazioniOrigine[0].prezzo).toBe(120);
    expect(cantiere.lavorazioniOrigine[0].quantita).toBe(2);
  });
});

describe("UX-13 wizard tipologia state", () => {
  it("azione impostaTipologiaImpianto definita", () => {
    expect(WIZARD_AZIONI.impostaTipologiaImpianto).toBe(
      "impostaTipologiaImpianto"
    );
  });
});

describe("UX-13 proposal intelligente", () => {
  it("convertiProposalInPreventivo salva tipologiaImpianto da form", () => {
    const proposal = {
      lavorazioni: [
        {
          id: "l1",
          descrizione: "Centrale allarme",
          prezzoConfigurato: true,
          prezzoUnitario: 200,
          quantita: 1,
          unita: "cad",
        },
      ],
    };

    const preventivo = convertiProposalInPreventivo(proposal, {
      archivio: [],
      cliente: "Test",
      form: { allarme: true },
    });

    expect(preventivo.tipologiaImpianto).toBe("allarme");
  });
});
