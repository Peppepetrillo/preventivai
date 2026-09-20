import { afterEach, describe, expect, it } from "vitest";

import { _resetMemoriaProgettoElettricoPerTest } from "./progettoElettricoBlobStore";
import {
  creaMetaProgettoElettrico,
  eliminaProgettoElettricoStorage,
  formatDimensioniProgetto,
  preparaProgettoElettrico,
  risolviNomeProgetto,
  risolviUrlProgettoElettrico,
  sanitizzaMetaProgettoElettrico,
  sostituisciProgettoElettrico,
  suggerisciNomeProgetto,
  TIPI_PROGETTO,
  validaFileProgetto,
} from "./progettoElettricoService";

function creaFile(nome, tipo, contenuto = "x") {
  return new File([contenuto], nome, { type: tipo });
}

describe("progettoElettricoService", () => {
  afterEach(() => {
    _resetMemoriaProgettoElettricoPerTest();
  });

  it("stato vuoto: sanitizza null", () => {
    expect(sanitizzaMetaProgettoElettrico(null)).toBeNull();
    expect(sanitizzaMetaProgettoElettrico({})).toBeNull();
  });

  it("valida PDF e immagine, rifiuta altri", () => {
    expect(validaFileProgetto(creaFile("a.pdf", "application/pdf")).ok).toBe(
      true
    );
    expect(validaFileProgetto(creaFile("a.jpg", "image/jpeg")).tipo).toBe(
      TIPI_PROGETTO.image
    );
    expect(validaFileProgetto(creaFile("a.txt", "text/plain")).ok).toBe(false);
    expect(validaFileProgetto(null).ok).toBe(false);
  });

  it("rifiuta file vuoto e troppo grande", () => {
    const vuoto = new File([], "a.pdf", { type: "application/pdf" });
    expect(validaFileProgetto(vuoto).ok).toBe(false);

    const grosso = new File([new Uint8Array(21 * 1024 * 1024)], "big.pdf", {
      type: "application/pdf",
    });
    expect(validaFileProgetto(grosso).errore).toMatch(/troppo grande/i);
  });

  it("risolve nome custom e fallback", () => {
    expect(
      risolviNomeProgetto(
        creaFile("x.pdf", "application/pdf"),
        "pdf",
        "Schema quadro generale"
      )
    ).toBe("Schema quadro generale");
    expect(
      risolviNomeProgetto(creaFile("Schema_unifilare.pdf", "application/pdf"), "pdf")
    ).toBe("Schema_unifilare");
    expect(
      risolviNomeProgetto(creaFile("image.jpg", "image/jpeg"), "image")
    ).toBe("Schema fotografato");
    expect(suggerisciNomeProgetto(creaFile("Planimetria.pdf", "application/pdf"), "pdf")).toBe(
      "Planimetria"
    );
  });

  it("formatta dimensioni in italiano", () => {
    expect(formatDimensioniProgetto(2400 * 1024)).toMatch(/MB/);
    expect(formatDimensioniProgetto(512)).toBe("512 B");
  });

  it("aggiunge PDF associato al cantiere corretto con nome", async () => {
    const file = creaFile("Schema_unifilare.pdf", "application/pdf", "%PDF-1.4");
    const esito = await preparaProgettoElettrico("c-100", file, {
      nome: "Schema quadro generale",
    });
    expect(esito.ok).toBe(true);
    expect(esito.progetto.cantiereId).toBe("c-100");
    expect(esito.progetto.tipo).toBe("pdf");
    expect(esito.progetto.nome).toBe("Schema quadro generale");
    expect(esito.progetto.blobId).toBeTruthy();
    expect(JSON.stringify(esito.progetto)).not.toMatch(/base64|data:/i);
  });

  it("aggiunge immagine associata al cantiere", async () => {
    const file = creaFile("schema_quadro.jpg", "image/jpeg", "fakeimg");
    const esito = await preparaProgettoElettrico(42, file);
    expect(esito.ok).toBe(true);
    expect(esito.progetto.tipo).toBe("image");
    expect(esito.progetto.cantiereId).toBe(42);
    expect(esito.progetto.nome).toBe("schema_quadro");
  });

  it("sostituisce senza lasciare il vecchio blob leggibile", async () => {
    const primo = await preparaProgettoElettrico(
      "c1",
      creaFile("a.pdf", "application/pdf", "v1")
    );
    const vecchioBlobId = primo.progetto.blobId;

    const secondo = await sostituisciProgettoElettrico(
      "c1",
      creaFile("b.pdf", "application/pdf", "v2"),
      primo.progetto,
      { nome: "Nuovo schema" }
    );
    expect(secondo.ok).toBe(true);
    expect(secondo.progetto.nome).toBe("Nuovo schema");
    expect(secondo.progetto.blobId).not.toBe(vecchioBlobId);

    const vecchio = await risolviUrlProgettoElettrico({
      ...primo.progetto,
      blobId: vecchioBlobId,
    });
    expect(vecchio.ok).toBe(false);

    const nuovo = await risolviUrlProgettoElettrico(secondo.progetto);
    expect(nuovo.ok).toBe(true);
    nuovo.revoke();
  });

  it("elimina progetto e rende il blob irrecuperabile", async () => {
    const creato = await preparaProgettoElettrico(
      "c2",
      creaFile("x.pdf", "application/pdf", "pdf")
    );
    await eliminaProgettoElettricoStorage(creato.progetto);
    const aperto = await risolviUrlProgettoElettrico(creato.progetto);
    expect(aperto.ok).toBe(false);
  });

  it("doppia preparazione crea due blob distinti (no merge silenzioso)", async () => {
    const a = await preparaProgettoElettrico(
      "c3",
      creaFile("1.pdf", "application/pdf", "a")
    );
    const b = await preparaProgettoElettrico(
      "c3",
      creaFile("2.pdf", "application/pdf", "b")
    );
    expect(a.progetto.blobId).not.toBe(b.progetto.blobId);
  });

  it("errore storage: cantiere id mancante", async () => {
    const esito = await preparaProgettoElettrico(
      "",
      creaFile("a.pdf", "application/pdf")
    );
    expect(esito.ok).toBe(false);
  });

  it("risolve URL e crea meta senza campi binari", () => {
    const meta = creaMetaProgettoElettrico({
      tipo: "pdf",
      nome: "p.pdf",
      mimeType: "application/pdf",
      size: 10,
      blobId: "b1",
      cantiereId: "c1",
    });
    const pulito = sanitizzaMetaProgettoElettrico({
      ...meta,
      src: "data:application/pdf;base64,AAA",
      contenuto: "NO",
    });
    expect(pulito.src).toBeUndefined();
    expect(pulito.contenuto).toBeUndefined();
    expect(pulito.blobId).toBe("b1");
  });

  it("risolviUrl fallisce se riferimento mancante", async () => {
    const esito = await risolviUrlProgettoElettrico({
      blobId: "inesistente",
      cantiereId: "c9",
    });
    expect(esito.ok).toBe(false);
    expect(esito.errore).toMatch(/non disponibile|non trovato|Impossibile/i);
  });
});
