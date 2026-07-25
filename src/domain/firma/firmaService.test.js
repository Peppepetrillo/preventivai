import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  creaFirma,
  salvaFirma,
  rimuoviFirma,
  ottieniFirma,
  documentoFirmato,
  puoFirmarePreventivo,
  nomeFilePdfPreventivo,
  calcolaHashDocumento,
  mappaFirmaPerPdf,
  VERSIONE_DOCUMENTO,
  resetFirme,
} from "./index";
import { STATI_PREVENTIVO } from "../workflow/preventivoWorkflowTypes";

const IMMAGINE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

function preventivoBase(patch = {}) {
  return {
    id: "prev-1",
    numero: "PREV-2026-0001",
    cliente: "Mario Rossi",
    stato: STATI_PREVENTIVO.INVIATO,
    lavorazioni: [{ nome: "Punto luce", quantita: 2, prezzo: 40 }],
    sconto: 0,
    iva: 22,
    totale: 97.6,
    subtotale: 80,
    note: "",
    ...patch,
  };
}

describe("firma — permessi", () => {
  it("consente solo Inviato e Accettato", () => {
    expect(puoFirmarePreventivo(STATI_PREVENTIVO.INVIATO)).toBe(true);
    expect(puoFirmarePreventivo(STATI_PREVENTIVO.ACCETTATO)).toBe(true);
    expect(puoFirmarePreventivo(STATI_PREVENTIVO.BOZZA)).toBe(false);
    expect(puoFirmarePreventivo(STATI_PREVENTIVO.ANNULLATO)).toBe(false);
    expect(puoFirmarePreventivo(STATI_PREVENTIVO.CONVERTITO)).toBe(false);
  });
});

describe("firmaService", () => {
  beforeEach(() => {
    localStorage.clear();
    resetFirme();
  });

  it("crea e salva firma senza modificare il preventivo", () => {
    const preventivo = preventivoBase();
    const creato = creaFirma({
      preventivo,
      firmatario: "Mario Rossi",
      immagineFirma: IMMAGINE,
    });

    expect(creato.success).toBe(true);
    expect(creato.firma.hashDocumento).toBe(calcolaHashDocumento(preventivo));
    expect(creato.firma.documenti[0].tipo).toBe(VERSIONE_DOCUMENTO.ORIGINALE);
    expect(creato.firma.documenti[0].nomeFile).toBe("PREV-2026-0001.pdf");

    const salvato = salvaFirma(creato.firma, {
      preventivo,
      registraFirmato: true,
    });
    expect(salvato.success).toBe(true);

    const letta = ottieniFirma(preventivo.id);
    expect(letta.firmatario).toBe("Mario Rossi");
    expect(letta.immagineFirma).toBe(IMMAGINE);

    const doc = documentoFirmato(preventivo.id);
    expect(doc.firmato).toBe(true);
    expect(doc.documento.nomeFile).toBe("PREV-2026-0001_firmato.pdf");
    expect(doc.originale.nomeFile).toBe("PREV-2026-0001.pdf");
  });

  it("rifiuta firma su Bozza", () => {
    const esito = creaFirma({
      preventivo: preventivoBase({ stato: STATI_PREVENTIVO.BOZZA }),
      firmatario: "Mario",
      immagineFirma: IMMAGINE,
    });
    expect(esito.success).toBe(false);
    expect(esito.error).toBe("stato_non_firmabile");
  });

  it("rifiuta firma su Annullato", () => {
    const esito = creaFirma({
      preventivo: preventivoBase({ stato: STATI_PREVENTIVO.ANNULLATO }),
      firmatario: "Mario",
      immagineFirma: IMMAGINE,
    });
    expect(esito.success).toBe(false);
  });

  it("rimuove la firma", () => {
    const preventivo = preventivoBase({
      stato: STATI_PREVENTIVO.ACCETTATO,
    });
    const creato = creaFirma({
      preventivo,
      firmatario: "Lucia Bianchi",
      immagineFirma: IMMAGINE,
    });
    salvaFirma(creato.firma, { preventivo, registraFirmato: true });
    expect(ottieniFirma(preventivo.id)).toBeTruthy();

    const rimozione = rimuoviFirma(preventivo.id);
    expect(rimozione.success).toBe(true);
    expect(ottieniFirma(preventivo.id)).toBeNull();
    expect(documentoFirmato(preventivo.id).firmato).toBe(false);
  });

  it("versiona nomi file originale e firmato", () => {
    expect(nomeFilePdfPreventivo({ numero: "PREV-1" }, false)).toBe(
      "PREV-1.pdf"
    );
    expect(nomeFilePdfPreventivo({ numero: "PREV-1" }, true)).toBe(
      "PREV-1_firmato.pdf"
    );
  });

  it("mappa firma per PDF senza esporre il modulo firma", () => {
    const dto = mappaFirmaPerPdf({
      immagineFirma: IMMAGINE,
      firmatario: "Mario",
      dataFirma: Date.UTC(2026, 6, 21),
    });
    expect(dto.clienteImmagine).toBe(IMMAGINE);
    expect(dto.firmatario).toBe("Mario");
    expect(dto.dataFirma).toMatch(/21/);
    expect(dto.installatorePlaceholder).toBe(true);
    expect(dto.installatoreImmagine).toBeNull();
  });
});

describe("PDF + firma (rigenerazione)", () => {
  beforeEach(() => {
    localStorage.clear();
    resetFirme();
    vi.resetModules();
  });

  it("genera PDF firmato con nome _firmato e immagine nel DTO", async () => {
    const addImage = vi.fn();
    const save = vi.fn();

    vi.doMock("jspdf", () => ({
      default: class {
        constructor() {
          this.internal = {
            pageSize: { getHeight: () => 297, getWidth: () => 210 },
          };
        }
        setTextColor() {}
        setFillColor() {}
        setDrawColor() {}
        setFontSize() {}
        setFont() {}
        setLineWidth() {}
        text() {}
        rect() {}
        roundedRect() {}
        line() {}
        addImage(...args) {
          addImage(...args);
        }
        save(...args) {
          save(...args);
        }
        splitTextToSize(v) {
          return [String(v || "")];
        }
        output() {
          return new Blob(["%PDF"], { type: "application/pdf" });
        }
        setPage() {}
        addPage() {}
        getNumberOfPages() {
          return 1;
        }
      },
    }));

    globalThis.URL.createObjectURL = vi.fn(() => "blob:mock");
    globalThis.URL.revokeObjectURL = vi.fn();

    const { generaPdfPreventivo } = await import(
      "../../services/preventiviPdfService"
    );

    const preventivo = preventivoBase();
    const creato = creaFirma({
      preventivo,
      firmatario: "Mario Rossi",
      immagineFirma: IMMAGINE,
    });
    salvaFirma(creato.firma, { preventivo, registraFirmato: true });

    const risultato = await generaPdfPreventivo({
      preventivo,
      datiAzienda: { nome: "Test SRL" },
      cliente: "Mario Rossi",
      stato: STATI_PREVENTIVO.INVIATO,
      lavorazioni: preventivo.lavorazioni,
      totali: { subtotale: 80, importoSconto: 0, imponibile: 80, importoIva: 17.6, totale: 97.6 },
      salva: true,
    });

    expect(risultato.nomeFile).toBe("PREV-2026-0001_firmato.pdf");
    expect(save).toHaveBeenCalledWith("PREV-2026-0001_firmato.pdf");
    expect(risultato.document.firme.clienteImmagine).toBe(IMMAGINE);
    expect(risultato.document.firme.dataFirma).toBeTruthy();
    expect(addImage).toHaveBeenCalled();
  });
});
