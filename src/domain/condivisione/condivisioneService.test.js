import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  creaCondivisioneService,
  risolviDocumentoDaCondividere,
  calcolaStatisticheCondivisioni,
  TIPI_CONDIVISIONE,
  ESITI_CONDIVISIONE,
  resetCondivisioni,
  ottieniStorico,
} from "./index";
import {
  creaFirma,
  salvaFirma,
  resetFirme,
} from "../firma";
import { STATI_PREVENTIVO } from "../workflow/preventivoWorkflowTypes";

const IMMAGINE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

function preventivoBase(patch = {}) {
  return {
    id: "prev-share-1",
    numero: "PREV-2026-0042",
    cliente: "Mario Rossi",
    stato: STATI_PREVENTIVO.INVIATO,
    lavorazioni: [{ nome: "Punto luce", quantita: 1, prezzo: 40 }],
    ...patch,
  };
}

function blobPdf() {
  return new Blob(["%PDF-1.4 mock"], { type: "application/pdf" });
}

describe("condivisione — risoluzione documento", () => {
  beforeEach(() => {
    localStorage.clear();
    resetFirme();
    resetCondivisioni();
  });

  it("preferisce PDF firmato se presente", () => {
    const preventivo = preventivoBase();
    const creato = creaFirma({
      preventivo,
      firmatario: "Mario Rossi",
      immagineFirma: IMMAGINE,
    });
    salvaFirma(creato.firma, { preventivo, registraFirmato: true });

    const doc = risolviDocumentoDaCondividere(preventivo.id, preventivo);
    expect(doc.firmato).toBe(true);
    expect(doc.nomeFile).toBe("PREV-2026-0042_firmato.pdf");
  });

  it("usa PDF originale se non firmato", () => {
    const preventivo = preventivoBase();
    const doc = risolviDocumentoDaCondividere(preventivo.id, preventivo);
    expect(doc.firmato).toBe(false);
    expect(doc.nomeFile).toBe("PREV-2026-0042.pdf");
  });
});

describe("condivisioneService", () => {
  let shareMock;
  let openUrl;
  let scaricaBlob;
  let service;

  beforeEach(() => {
    localStorage.clear();
    resetFirme();
    resetCondivisioni();
    shareMock = vi.fn(async () => undefined);
    openUrl = vi.fn();
    scaricaBlob = vi.fn();
    service = creaCondivisioneService({
      canShare: () => false,
      share: shareMock,
      openUrl,
      scaricaBlob,
    });
  });

  it("rifiuta condivisione senza documento pronto", async () => {
    const esito = await service.condividiEmail({
      preventivoId: "p1",
      file: null,
    });
    expect(esito.success).toBe(false);
    expect(esito.error).toBe("documento_assente");
    expect(ottieniStorico("p1")).toHaveLength(0);
  });

  it("email usa fallback mailto e persiste storico", async () => {
    const preventivo = preventivoBase();
    const esito = await service.condividiEmail({
      preventivoId: preventivo.id,
      preventivo,
      file: blobPdf(),
      destinatario: "studio@alfa.it",
    });

    expect(esito.success).toBe(true);
    expect(esito.fallback).toBe(true);
    expect(esito.canale).toBe("mailto");
    expect(openUrl).toHaveBeenCalled();
    expect(String(openUrl.mock.calls[0][0])).toMatch(/^mailto:/);

    const storico = service.ottieniStorico(preventivo.id);
    expect(storico).toHaveLength(1);
    expect(storico[0].tipo).toBe(TIPI_CONDIVISIONE.EMAIL);
    expect(storico[0].destinatario).toBe("studio@alfa.it");
    expect(storico[0].esito).toBe(ESITI_CONDIVISIONE.APERTO);
    expect(storico[0].file).toBe("PREV-2026-0042.pdf");
  });

  it("whatsapp usa fallback wa.me", async () => {
    const preventivo = preventivoBase();
    const esito = await service.condividiWhatsApp({
      preventivoId: preventivo.id,
      preventivo,
      file: blobPdf(),
      destinatario: "3331234567",
    });

    expect(esito.success).toBe(true);
    expect(esito.canale).toBe("wa.me");
    expect(openUrl.mock.calls[0][0]).toContain("wa.me/3331234567");
    expect(service.ottieniStorico(preventivo.id)[0].tipo).toBe(
      TIPI_CONDIVISIONE.WHATSAPP
    );
    expect(service.ottieniStorico(preventivo.id)[0].esito).toBe(
      ESITI_CONDIVISIONE.CONSEGNATO
    );
  });

  it("share API quando disponibile", async () => {
    service = creaCondivisioneService({
      canShare: () => true,
      share: shareMock,
      openUrl,
      scaricaBlob,
    });
    const preventivo = preventivoBase();
    const esito = await service.condividi({
      preventivoId: preventivo.id,
      preventivo,
      file: blobPdf(),
      destinatario: "Sistema",
    });

    expect(esito.success).toBe(true);
    expect(esito.canale).toBe("web_share");
    expect(shareMock).toHaveBeenCalled();
    expect(openUrl).not.toHaveBeenCalled();
    expect(service.ottieniStorico(preventivo.id)[0].esito).toBe(
      ESITI_CONDIVISIONE.CONDIVISO
    );
  });

  it("share senza API fa fallback download", async () => {
    const preventivo = preventivoBase();
    const esito = await service.condividi({
      preventivoId: preventivo.id,
      preventivo,
      file: blobPdf(),
    });
    expect(esito.success).toBe(true);
    expect(esito.fallback).toBe(true);
    expect(esito.canale).toBe("download");
    expect(scaricaBlob).toHaveBeenCalled();
  });

  it("downloadPdf registra Completato", async () => {
    const preventivo = preventivoBase();
    const esito = await service.downloadPdf({
      preventivoId: preventivo.id,
      preventivo,
      file: blobPdf(),
    });
    expect(esito.success).toBe(true);
    expect(scaricaBlob).toHaveBeenCalled();
    const voce = service.ottieniStorico(preventivo.id)[0];
    expect(voce.tipo).toBe(TIPI_CONDIVISIONE.DOWNLOAD);
    expect(voce.esito).toBe(ESITI_CONDIVISIONE.COMPLETATO);
    expect(voce.destinatario).toBe("Locale");
  });

  it("condivide il firmato quando presente", async () => {
    const preventivo = preventivoBase();
    const creato = creaFirma({
      preventivo,
      firmatario: "Mario Rossi",
      immagineFirma: IMMAGINE,
    });
    salvaFirma(creato.firma, { preventivo, registraFirmato: true });

    const esito = await service.downloadPdf({
      preventivoId: preventivo.id,
      preventivo,
      file: blobPdf(),
    });
    expect(esito.nomeFile).toBe("PREV-2026-0042_firmato.pdf");
    expect(service.ottieniStorico(preventivo.id)[0].firmato).toBe(true);
    expect(scaricaBlob.mock.calls[0][1]).toBe("PREV-2026-0042_firmato.pdf");
  });

  it("calcola statistiche e canale preferito", async () => {
    const preventivo = preventivoBase();
    await service.condividiWhatsApp({
      preventivoId: preventivo.id,
      preventivo,
      file: blobPdf(),
      destinatario: "Mario Rossi",
    });
    await service.condividiWhatsApp({
      preventivoId: preventivo.id,
      preventivo,
      file: blobPdf(),
      destinatario: "Mario Rossi",
    });
    await service.condividiEmail({
      preventivoId: preventivo.id,
      preventivo,
      file: blobPdf(),
      destinatario: "Studio Alfa",
    });

    const stats = service.ottieniStatistiche(preventivo.id);
    expect(stats.numero).toBe(3);
    expect(stats.canalePreferito).toBe(TIPI_CONDIVISIONE.WHATSAPP);
    expect(stats.ultima).toBeTruthy();

    const aggregato = calcolaStatisticheCondivisioni(
      service.ottieniStorico(preventivo.id)
    );
    expect(aggregato.canalePreferitoLabel).toBe("WhatsApp");
  });

  it("persistenza storico tra chiamate", async () => {
    const preventivo = preventivoBase();
    await service.downloadPdf({
      preventivoId: preventivo.id,
      preventivo,
      file: blobPdf(),
    });
    const altro = creaCondivisioneService({
      canShare: () => false,
      share: shareMock,
      openUrl,
      scaricaBlob,
    });
    expect(altro.ottieniStorico(preventivo.id)).toHaveLength(1);
  });
});
