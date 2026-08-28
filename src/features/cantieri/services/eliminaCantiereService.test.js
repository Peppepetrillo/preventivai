import { beforeEach, describe, expect, it, vi } from "vitest";

import { STORAGE_KEYS } from "../../../app/storageKeys";
import { aggiungiAttivita, leggiAttivita } from "../../../domain/attivita";
import {
  cercaDistinteMateriali,
  collegaDistintaACantiere,
  creaDistintaMateriali,
  trovaDistintaPerId,
} from "../../../domain/distinteMateriali";
import {
  aggiungiVoceListaSpesa,
  leggiListaSpesa,
} from "../../../domain/listaSpesa";
import {
  inserisciVariante,
  leggiTimelineVarianti,
  leggiTutteVarianti,
  scriviTimelineVarianti,
} from "../../../domain/varianti/variantiRepository";
import { STATI_PREVENTIVO } from "../../../domain/workflow";
import { salvaCantieri } from "../../../repositories/cantieriRepository";
import { salvaPreventivi } from "../../../repositories/preventiviRepository";
import { recuperaEsperienze, salvaEsperienza } from "../../../services/experienceService";
import { testoConfermaEliminaCantiere } from "../cantieriDomain";
import { eliminaStorageFotoCantieri } from "./cantieriFotoService";
import { eliminaCantiereConPulizia } from "./eliminaCantiereService";

vi.mock("./cantieriFotoService", () => ({
  eliminaStorageFotoCantieri: vi.fn(),
}));

const CANTIERE_A = {
  id: "c-a",
  nome: "Impianto Rossi",
  stato: "In corso",
  foto: [{ id: "f1", storagePath: "foto/a.jpg" }],
  checklist: [{ id: "ch1", testo: "Posa", completata: false }],
};

const CANTIERE_B = {
  id: "c-b",
  nome: "Quadro Verdi",
  stato: "Da iniziare",
  foto: [{ id: "f2", storagePath: "foto/b.jpg" }],
};

describe("eliminaCantiereConPulizia", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    salvaCantieri([CANTIERE_A, CANTIERE_B]);
  });

  it("elimina solo il cantiere scelto in qualsiasi stato", () => {
    const daIniziare = { ...CANTIERE_A, stato: "Da iniziare" };
    salvaCantieri([daIniziare, CANTIERE_B]);
    expect(eliminaCantiereConPulizia(daIniziare).success).toBe(true);

    const inCorso = { ...CANTIERE_B, stato: "In corso" };
    salvaCantieri([inCorso]);
    expect(eliminaCantiereConPulizia(inCorso).success).toBe(true);

    const completato = { ...CANTIERE_A, id: "c-done", stato: "Completato" };
    salvaCantieri([completato]);
    const esito = eliminaCantiereConPulizia(completato);
    expect(esito.success).toBe(true);
    expect(esito.cantieri).toEqual([]);
  });

  it("non richiede Completato e pulisce solo i dati del cantiere eliminato", () => {
    aggiungiVoceListaSpesa({
      nome: "Tubo A",
      lavoroId: "c-a",
      cantiereId: "c-a",
    });
    aggiungiVoceListaSpesa({
      nome: "Cavo B",
      lavoroId: "c-b",
      cantiereId: "c-b",
    });

    const distintaA = creaDistintaMateriali({ titolo: "Distinta A" });
    const distintaB = creaDistintaMateriali({ titolo: "Distinta B" });
    collegaDistintaACantiere(distintaA.id, "c-a");
    collegaDistintaACantiere(distintaB.id, "c-b");

    inserisciVariante({ cantiereId: "c-a", titolo: "Variante A", importo: 100 });
    inserisciVariante({ cantiereId: "c-b", titolo: "Variante B", importo: 50 });
    scriviTimelineVarianti([
      { id: "t-a", cantiereId: "c-a", tipo: "creata" },
      { id: "t-b", cantiereId: "c-b", tipo: "creata" },
    ]);

    salvaPreventivi([
      {
        id: "p-a",
        stato: STATI_PREVENTIVO.CONVERTITO,
        cantiereId: "c-a",
        totale: 900,
      },
      {
        id: "p-b",
        stato: STATI_PREVENTIVO.CONVERTITO,
        cantiereId: "c-b",
        totale: 400,
      },
    ]);

    salvaEsperienza({
      id: "e-a",
      cantiereId: "c-a",
      cliente: "Rossi",
    });

    aggiungiAttivita({ titolo: "Richiamare Rossi", lavoroId: "c-a" });
    aggiungiAttivita({ titolo: "Ordine materiale Verdi", lavoroId: "c-b" });
    aggiungiAttivita({ titolo: "Scadenza INAIL" });

    const esito = eliminaCantiereConPulizia(CANTIERE_A);

    expect(esito.success).toBe(true);
    expect(esito.cantieri.map((c) => c.id)).toEqual(["c-b"]);
    expect(eliminaStorageFotoCantieri).toHaveBeenCalledWith(CANTIERE_A.foto);

    const lista = leggiListaSpesa();
    expect(lista).toHaveLength(1);
    expect(lista[0].nome).toBe("Cavo B");

    expect(cercaDistinteMateriali("", { cantiereId: "c-a" })).toHaveLength(0);
    expect(trovaDistintaPerId(distintaA.id)).toBeTruthy();
    expect(trovaDistintaPerId(distintaA.id).collegamenti.cantiereId).toBeUndefined();
    expect(trovaDistintaPerId(distintaB.id).collegamenti.cantiereId).toBe("c-b");

    const varianti = leggiTutteVarianti();
    expect(varianti).toHaveLength(1);
    expect(varianti[0].titolo).toBe("Variante B");
    expect(leggiTimelineVarianti().map((e) => e.id)).toEqual(["t-b"]);

    const preventivi = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.preventivi) || "[]"
    );
    expect(preventivi).toHaveLength(2);
    expect(preventivi.find((p) => p.id === "p-a").cantiereId).toBeNull();
    expect(preventivi.find((p) => p.id === "p-a").stato).toBe(
      STATI_PREVENTIVO.CONVERTITO
    );
    expect(preventivi.find((p) => p.id === "p-b").cantiereId).toBe("c-b");

    expect(recuperaEsperienze()).toHaveLength(1);
    expect(recuperaEsperienze()[0].cantiereId).toBe("c-a");

    const attivita = leggiAttivita();
    expect(attivita).toHaveLength(3);
    expect(
      attivita.find((a) => a.titolo === "Richiamare Rossi").lavoroId
    ).toBe("");
    expect(
      attivita.find((a) => a.titolo === "Ordine materiale Verdi").lavoroId
    ).toBe("c-b");
    expect(attivita.find((a) => a.titolo === "Scadenza INAIL").lavoroId).toBe("");
  });

  it("restituisce false se manca il cantiere", () => {
    expect(eliminaCantiereConPulizia(null)).toEqual({ success: false });
    expect(eliminaCantiereConPulizia({})).toEqual({ success: false });
  });
});

describe("testoConfermaEliminaCantiere", () => {
  it("informa sullo spostamento nel Cestino (UX-7.1)", () => {
    expect(testoConfermaEliminaCantiere("Da iniziare")).toMatch(/Cestino/i);
    expect(testoConfermaEliminaCantiere("Da avviare")).toMatch(/Cestino/i);
    expect(testoConfermaEliminaCantiere("In corso")).toMatch(/Cestino/i);
    expect(testoConfermaEliminaCantiere("Completato")).toMatch(/Cestino/i);
  });
});
