import { afterEach, describe, expect, it } from "vitest";

import { _resetMemoriaProgettoElettricoPerTest } from "./progettoElettricoBlobStore";
import {
  aggiungiProgettoInLista,
  creaMetaProgettoElettrico,
  eliminaProgettoElettricoStorage,
  elencaProgettiElettrici,
  formatDimensioniProgetto,
  migraCantiereProgettiElettrici,
  preparaProgettoElettrico,
  rimuoviProgettoDaLista,
  rinominaProgettoInLista,
  risolviNomeProgetto,
  risolviUrlProgettoElettrico,
  sanitizzaMetaProgettoElettrico,
  sostituisciProgettoElettrico,
  sostituisciProgettoInLista,
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

  it("nessun progetto: elenca vuoto", () => {
    expect(elencaProgettiElettrici(null)).toEqual([]);
    expect(elencaProgettiElettrici({})).toEqual([]);
    expect(elencaProgettiElettrici({ progettiElettrici: [] })).toEqual([]);
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

  it("un progetto in lista", () => {
    const uno = creaMetaProgettoElettrico({
      id: "p1",
      tipo: "pdf",
      nome: "A",
      mimeType: "application/pdf",
      size: 1,
      blobId: "b1",
      cantiereId: "c1",
    });
    expect(elencaProgettiElettrici({ progettiElettrici: [uno] })).toHaveLength(1);
  });

  it("due e tre progetti in lista", () => {
    const base = {
      id: "p",
      tipo: "pdf",
      mimeType: "application/pdf",
      size: 1,
      blobId: "b",
      cantiereId: "c1",
    };
    const due = [
      creaMetaProgettoElettrico({ ...base, id: "p1", nome: "A", blobId: "b1" }),
      creaMetaProgettoElettrico({ ...base, id: "p2", nome: "B", blobId: "b2" }),
    ];
    expect(elencaProgettiElettrici({ progettiElettrici: due })).toHaveLength(2);
    const tre = [
      ...due,
      creaMetaProgettoElettrico({ ...base, id: "p3", nome: "C", blobId: "b3" }),
    ];
    expect(elencaProgettiElettrici({ progettiElettrici: tre })).toHaveLength(3);
  });

  it("aggiunta non sostituisce: append in lista", () => {
    const a = creaMetaProgettoElettrico({
      id: "p1",
      tipo: "pdf",
      nome: "A",
      mimeType: "application/pdf",
      size: 1,
      blobId: "b1",
      cantiereId: "c1",
    });
    const b = creaMetaProgettoElettrico({
      id: "p2",
      tipo: "image",
      nome: "B",
      mimeType: "image/jpeg",
      size: 2,
      blobId: "b2",
      cantiereId: "c1",
    });
    const lista = aggiungiProgettoInLista(aggiungiProgettoInLista([], a), b);
    expect(lista).toHaveLength(2);
    expect(lista.map((v) => v.id)).toEqual(["p1", "p2"]);
  });

  it("elimina un progetto mantenendo gli altri", () => {
    const lista = [
      { id: "p1", tipo: "pdf", nome: "A", blobId: "b1", mimeType: "application/pdf", size: 1, cantiereId: "c1" },
      { id: "p2", tipo: "pdf", nome: "B", blobId: "b2", mimeType: "application/pdf", size: 1, cantiereId: "c1" },
      { id: "p3", tipo: "image", nome: "C", blobId: "b3", mimeType: "image/jpeg", size: 1, cantiereId: "c1" },
    ];
    const next = rimuoviProgettoDaLista(lista, "p2");
    expect(next.map((v) => v.id)).toEqual(["p1", "p3"]);
  });

  it("sostituisce solo il progetto selezionato", () => {
    const lista = [
      { id: "p1", tipo: "pdf", nome: "A", blobId: "b1", mimeType: "application/pdf", size: 1, cantiereId: "c1", createdAt: "t0" },
      { id: "p2", tipo: "pdf", nome: "B", blobId: "b2", mimeType: "application/pdf", size: 1, cantiereId: "c1", createdAt: "t1" },
    ];
    const nuovo = {
      id: "nuovo",
      tipo: "pdf",
      nome: "B2",
      blobId: "b9",
      mimeType: "application/pdf",
      size: 9,
      cantiereId: "c1",
      createdAt: "t9",
      updatedAt: "t9",
    };
    const next = sostituisciProgettoInLista(lista, "p2", nuovo);
    expect(next).toHaveLength(2);
    expect(next[0].blobId).toBe("b1");
    expect(next[1].id).toBe("p2");
    expect(next[1].blobId).toBe("b9");
    expect(next[1].nome).toBe("B2");
    expect(next[1].createdAt).toBe("t1");
  });

  it("rinomina progetto in lista", () => {
    const lista = [
      { id: "p1", tipo: "pdf", nome: "Vecchio", blobId: "b1", mimeType: "application/pdf", size: 1, cantiereId: "c1" },
    ];
    const next = rinominaProgettoInLista(lista, "p1", "Schema unifilare");
    expect(next[0].nome).toBe("Schema unifilare");
  });

  it("migra progetto singolo legacy → lista", () => {
    const legacy = {
      id: "c1",
      progettoElettrico: {
        id: "pe1",
        tipo: "pdf",
        nome: "Schema",
        mimeType: "application/pdf",
        size: 10,
        blobId: "blob-legacy",
        cantiereId: "c1",
        createdAt: "a",
        updatedAt: "b",
      },
    };
    const migrato = migraCantiereProgettiElettrici(legacy);
    expect(migrato.progettiElettrici).toHaveLength(1);
    expect(migrato.progettiElettrici[0].blobId).toBe("blob-legacy");
    expect(migrato.progettoElettrico).toBeUndefined();
  });

  it("migrazione idempotente: non duplica", () => {
    const gia = {
      id: "c1",
      progettiElettrici: [
        {
          id: "pe1",
          tipo: "pdf",
          nome: "Schema",
          mimeType: "application/pdf",
          size: 10,
          blobId: "b1",
          cantiereId: "c1",
        },
      ],
    };
    const prima = migraCantiereProgettiElettrici(gia);
    const seconda = migraCantiereProgettiElettrici(prima);
    expect(seconda).toBe(prima);
    expect(seconda.progettiElettrici).toHaveLength(1);
  });

  it("elenca legge legacy senza mutare", () => {
    const cantiere = {
      progettoElettrico: {
        id: "pe1",
        tipo: "image",
        nome: "Foto",
        mimeType: "image/jpeg",
        size: 3,
        blobId: "b1",
        cantiereId: "c1",
      },
    };
    expect(elencaProgettiElettrici(cantiere)).toHaveLength(1);
    expect(cantiere.progettoElettrico).toBeTruthy();
    expect(cantiere.progettiElettrici).toBeUndefined();
  });

  it("cambio cantiere: liste separate", () => {
    const a = {
      id: "a",
      progettiElettrici: [
        { id: "p1", tipo: "pdf", nome: "A", blobId: "ba", mimeType: "application/pdf", size: 1, cantiereId: "a" },
      ],
    };
    const b = {
      id: "b",
      progettiElettrici: [
        { id: "p2", tipo: "pdf", nome: "B", blobId: "bb", mimeType: "application/pdf", size: 1, cantiereId: "b" },
      ],
    };
    expect(elencaProgettiElettrici(a)[0].nome).toBe("A");
    expect(elencaProgettiElettrici(b)[0].nome).toBe("B");
    expect(elencaProgettiElettrici(a)[0].cantiereId).toBe("a");
  });

  it("blob non duplicati su doppia preparazione", async () => {
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

  it("elimina progetto e rende il blob irrecuperabile (cleanup)", async () => {
    const creato = await preparaProgettoElettrico(
      "c2",
      creaFile("x.pdf", "application/pdf", "pdf")
    );
    await eliminaProgettoElettricoStorage(creato.progetto);
    const aperto = await risolviUrlProgettoElettrico(creato.progetto);
    expect(aperto.ok).toBe(false);
  });

  it("offline open: apre blob presente localmente", async () => {
    const creato = await preparaProgettoElettrico(
      "c-off",
      creaFile("off.pdf", "application/pdf", "%PDF")
    );
    const aperto = await risolviUrlProgettoElettrico(creato.progetto);
    expect(aperto.ok).toBe(true);
    expect(aperto.url).toMatch(/^blob:/);
    aperto.revoke();
  });

  it("metadata senza Base64", () => {
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
    expect(JSON.stringify(pulito)).not.toMatch(/base64|data:/i);
  });

  it("errore storage: cantiere id mancante", async () => {
    const esito = await preparaProgettoElettrico(
      "",
      creaFile("a.pdf", "application/pdf")
    );
    expect(esito.ok).toBe(false);
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
