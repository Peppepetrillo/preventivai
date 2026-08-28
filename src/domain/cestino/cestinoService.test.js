import { beforeEach, describe, expect, it, vi } from "vitest";

import { STORAGE_KEYS } from "../../app/storageKeys";
import { creaBackupCompleto, ripristinaBackupCompleto } from "../../utils/backup";
import { salvaClienti, leggiClienti, leggiClientiTutti } from "../../repositories/clientiRepository";
import {
  leggiCantieri,
  leggiCantieriTutti,
  salvaCantieri,
} from "../../repositories/cantieriRepository";
import {
  leggiPreventivi,
  leggiPreventiviTutti,
  salvaPreventivi,
} from "../../repositories/preventiviRepository";
import { leggiListaSpesa, salvaListaSpesa } from "../listaSpesa";
import {
  inserisciVariante,
  leggiTutteVarianti,
  scriviTutteVarianti,
} from "../varianti/variantiRepository";
import { STATI_PREVENTIVO } from "../workflow";
import {
  FILTRI_CESTINO,
  TIPI_CESTINO,
  eliminaDefinitivamente,
  isRecordCestinato,
  ottieniElementiCestinati,
  ripristina,
  spostaNelCestino,
} from "./index";

vi.mock("../../features/cantieri/services/cantieriFotoService", () => ({
  eliminaStorageFotoCantieri: vi.fn(),
}));

vi.mock("../../services/cloudSyncService", () => ({
  salvaDatoCloud: vi.fn(),
  salvaDatoCloudImmediato: vi.fn(),
  eliminaFotoCantiereStorage: vi.fn(),
}));

describe("cestinoService UX-7.1", () => {
  beforeEach(() => {
    localStorage.clear();
    salvaClienti([]);
    salvaCantieri([]);
    salvaPreventivi([]);
    salvaListaSpesa([]);
    scriviTutteVarianti([]);
  });

  it("legacy senza deletedAt = attivo", () => {
    salvaClienti([{ id: 1, nome: "Rossi" }]);
    expect(isRecordCestinato(leggiClientiTutti()[0])).toBe(false);
    expect(leggiClienti()).toHaveLength(1);
  });

  it("cliente: soft delete, lista, cestino, ripristino, dati invariati", () => {
    salvaClienti([{ id: "c1", nome: "Rossi", telefono: "111" }]);
    salvaPreventivi([{ id: "p1", cliente: "Rossi", totale: 100 }]);

    const soft = spostaNelCestino(TIPI_CESTINO.cliente, "c1");
    expect(soft.success).toBe(true);
    expect(soft.record.deletedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(leggiClienti()).toHaveLength(0);
    expect(ottieniElementiCestinati()).toHaveLength(1);
    expect(ottieniElementiCestinati()[0].nome).toBe("Rossi");
    expect(leggiPreventivi()).toHaveLength(1);

    const again = spostaNelCestino(TIPI_CESTINO.cliente, "c1");
    expect(again.success).toBe(true);
    expect(again.alreadyTrashed).toBe(true);

    const resto = ripristina(TIPI_CESTINO.cliente, "c1");
    expect(resto.success).toBe(true);
    expect(resto.record.deletedAt).toBeUndefined();
    expect(resto.record.telefono).toBe("111");
    expect(leggiClienti()).toHaveLength(1);
    expect(ripristina(TIPI_CESTINO.cliente, "c1").alreadyActive).toBe(true);
  });

  it("cantiere: soft delete non pulisce collegati; ripristino completo; hard usa UX-6.3", async () => {
    const { eliminaStorageFotoCantieri } = await import(
      "../../features/cantieri/services/cantieriFotoService"
    );

    const cantiere = {
      id: "c-a",
      nome: "Impianto Rossi",
      cliente: "Rossi",
      stato: "In corso",
      origine: "diretto",
      tipoIntervento: "Riparazione",
      descrizioneIntervento: "Quadro guasto",
      totaleLavoro: 250,
      checklist: [{ id: 1, testo: "Aprire quadro", completata: false }],
      materiali: [{ id: 1, nome: "Cavo", quantita: 2, unita: "m" }],
      foto: [{ id: "f1", storagePath: "u/c-a/f1.jpg", src: "data:image/png;base64,xx" }],
      diario: [{ id: "d1", tipo: "nota", testo: "Arrivo" }],
      preventivoId: "p-a",
      incassato: 50,
    };
    salvaCantieri([cantiere]);
    salvaPreventivi([
      {
        id: "p-a",
        stato: STATI_PREVENTIVO.CONVERTITO,
        cantiereId: "c-a",
        cliente: "Rossi",
      },
    ]);
    salvaListaSpesa([{ id: "ls1", cantiereId: "c-a", nome: "Cavo" }]);
    inserisciVariante({
      id: "v1",
      cantiereId: "c-a",
      titolo: "Extra",
    });

    const soft = spostaNelCestino(TIPI_CESTINO.cantiere, "c-a");
    expect(soft.success).toBe(true);
    expect(eliminaStorageFotoCantieri).not.toHaveBeenCalled();
    expect(leggiCantieri()).toHaveLength(0);
    expect(leggiListaSpesa()).toHaveLength(1);
    expect(leggiTutteVarianti()).toHaveLength(1);
    expect(leggiPreventiviTutti()[0].cantiereId).toBe("c-a");

    const nelCestino = leggiCantieriTutti()[0];
    expect(nelCestino.origine).toBe("diretto");
    expect(nelCestino.descrizioneIntervento).toBe("Quadro guasto");
    expect(nelCestino.totaleLavoro).toBe(250);
    expect(nelCestino.foto).toHaveLength(1);
    expect(nelCestino.diario).toHaveLength(1);

    ripristina(TIPI_CESTINO.cantiere, "c-a");
    const ripristinato = leggiCantieri()[0];
    expect(ripristinato.deletedAt).toBeUndefined();
    expect(ripristinato.foto[0].storagePath).toBe("u/c-a/f1.jpg");
    expect(ripristinato.totaleLavoro).toBe(250);

    spostaNelCestino(TIPI_CESTINO.cantiere, "c-a");
    const hard = eliminaDefinitivamente(TIPI_CESTINO.cantiere, "c-a");
    expect(hard.success).toBe(true);
    expect(eliminaStorageFotoCantieri).toHaveBeenCalled();
    expect(leggiCantieriTutti()).toHaveLength(0);
    expect(leggiListaSpesa()).toHaveLength(0);
    expect(leggiTutteVarianti()).toHaveLength(0);
    expect(leggiPreventiviTutti()[0].cantiereId).toBeNull();
    expect(eliminaDefinitivamente(TIPI_CESTINO.cantiere, "c-a").alreadyAbsent).toBe(
      true
    );
  });

  it("preventivo: soft delete, liste, cantiere intatto, hard delete", async () => {
    const { accettaPreventivo } = await import("../workflow");

    salvaCantieri([
      {
        id: "c1",
        nome: "Cantiere",
        cliente: "Rossi",
        preventivoId: "p1",
        stato: "Da iniziare",
      },
    ]);
    salvaPreventivi([
      {
        id: "p1",
        numero: "2026-001",
        cliente: "Rossi",
        stato: STATI_PREVENTIVO.INVIATO,
        cantiereId: "c1",
        totale: 500,
      },
    ]);

    spostaNelCestino(TIPI_CESTINO.preventivo, "p1");
    expect(leggiPreventivi()).toHaveLength(0);
    expect(ottieniElementiCestinati({ filtro: FILTRI_CESTINO.preventivi })).toHaveLength(
      1
    );
    expect(leggiCantieri()[0].preventivoId).toBe("p1");

    const blocco = accettaPreventivo("p1");
    expect(blocco.success).toBe(false);
    expect(blocco.error).toBe("preventivo_cestinato");

    ripristina(TIPI_CESTINO.preventivo, "p1");
    expect(leggiPreventivi()).toHaveLength(1);
    expect(leggiPreventivi()[0].cantiereId).toBe("c1");

    spostaNelCestino(TIPI_CESTINO.preventivo, "p1");
    eliminaDefinitivamente(TIPI_CESTINO.preventivo, "p1");
    expect(leggiPreventiviTutti()).toHaveLength(0);
    expect(leggiCantieri()[0].preventivoId).toBe("p1");
  });

  it("backup conserva deletedAt dopo restore", async () => {
    salvaClienti([{ id: "c1", nome: "Rossi" }]);
    spostaNelCestino(TIPI_CESTINO.cliente, "c1");

    const backup = creaBackupCompleto();
    expect(backup.dati[STORAGE_KEYS.clienti][0].deletedAt).toBeTruthy();

    salvaClienti([]);
    await ripristinaBackupCompleto(backup);

    expect(leggiClienti()).toHaveLength(0);
    expect(leggiClientiTutti()[0].deletedAt).toBeTruthy();
    expect(ottieniElementiCestinati()).toHaveLength(1);
  });
});
