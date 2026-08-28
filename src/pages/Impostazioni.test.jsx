import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ROUTES } from "../app/routes";
import { STORAGE_KEYS } from "../app/storageKeys";
import { salvaStorage } from "../utils/storage";
import Impostazioni from "./Impostazioni";

vi.mock("../contexts/cloudAuthContext", () => ({
  useCloudAuth: () => ({
    configurato: false,
    utente: null,
    sincronizzazione: "offline",
    errore: "",
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

const esportaBlob = vi.fn();
const nomeFileBackup = vi.fn(() => "preventivai-backup-2026-08-20.json");
const creaBackupCompleto = vi.fn(() => ({
  app: "PreventivAI",
  versione: 1,
  creatoIl: "2026-08-20T00:00:00.000Z",
  dati: { cantieri: [] },
}));
const ripristinaBackupCompleto = vi.fn().mockResolvedValue(undefined);

vi.mock("../utils/nativeExport", () => ({
  esportaBlob: (...args) => esportaBlob(...args),
}));

vi.mock("../utils/backup", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    creaBackupCompleto: (...args) => creaBackupCompleto(...args),
    nomeFileBackup: (...args) => nomeFileBackup(...args),
    ripristinaBackupCompleto: (...args) => ripristinaBackupCompleto(...args),
  };
});

describe("Impostazioni UX-1", () => {
  beforeEach(() => {
    localStorage.clear();
    esportaBlob.mockReset();
    creaBackupCompleto.mockClear();
    nomeFileBackup.mockClear();
  });

  it("link Cestino", () => {
    render(
      <MemoryRouter>
        <Impostazioni />
      </MemoryRouter>
    );
    const link = screen.getByTestId("impostazioni-link-cestino");
    expect(link).toHaveAttribute("href", ROUTES.cestino);
    expect(screen.getByText(/Cestino/i)).toBeInTheDocument();
  });

  it("non mostra più i link hub spostati in Altro", () => {
    render(
      <MemoryRouter>
        <Impostazioni />
      </MemoryRouter>
    );
    expect(screen.queryByTestId("impostazioni-link-archivio")).not.toBeInTheDocument();
    expect(screen.queryByTestId("impostazioni-link-listino")).not.toBeInTheDocument();
    expect(screen.queryByTestId("impostazioni-link-acquisti")).not.toBeInTheDocument();
  });
});

describe("Impostazioni UX-6.6 export backup", () => {
  beforeEach(() => {
    localStorage.clear();
    esportaBlob.mockReset();
    creaBackupCompleto.mockClear();
    nomeFileBackup.mockClear();
  });

  it("usa esportaBlob con Blob JSON e nomeFileBackup", async () => {
    esportaBlob.mockResolvedValue({ success: true, metodo: "download" });

    render(
      <MemoryRouter>
        <Impostazioni />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByTestId("esporta-backup"));

    await waitFor(() => {
      expect(esportaBlob).toHaveBeenCalledTimes(1);
    });

    const [blob, nome, opzioni] = esportaBlob.mock.calls[0];
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe("application/json");
    expect(nome).toBe("preventivai-backup-2026-08-20.json");
    expect(opzioni).toEqual({ titolo: "Backup PreventivAI" });
    expect(nomeFileBackup).toHaveBeenCalled();
    expect(creaBackupCompleto).toHaveBeenCalled();
    expect(screen.getByText("Backup esportato.")).toBeInTheDocument();
  });

  it("dopo share riuscito mostra messaggio di condivisione", async () => {
    esportaBlob.mockResolvedValue({ success: true, metodo: "share" });

    render(
      <MemoryRouter>
        <Impostazioni />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByTestId("esporta-backup"));

    await waitFor(() => {
      expect(
        screen.getByText("Backup pronto per la condivisione.")
      ).toBeInTheDocument();
    });
  });

  it("se share annullato non mostra errore tecnico", async () => {
    esportaBlob.mockResolvedValue({ success: false, error: "annullato" });

    render(
      <MemoryRouter>
        <Impostazioni />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByTestId("esporta-backup"));

    await waitFor(() => {
      expect(screen.getByText("Esportazione annullata.")).toBeInTheDocument();
    });
    expect(screen.queryByText(/Impossibile esportare/i)).not.toBeInTheDocument();
  });

  it("su errore reale mostra feedback di errore", async () => {
    esportaBlob.mockResolvedValue({ success: false, error: "share_fallito" });

    render(
      <MemoryRouter>
        <Impostazioni />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByTestId("esporta-backup"));

    await waitFor(() => {
    expect(
      screen.getByText("Impossibile esportare il backup.")
    ).toBeInTheDocument();
  });
});

describe("Impostazioni UX-7.2 backup automatico", () => {
  beforeEach(() => {
    localStorage.clear();
    esportaBlob.mockReset();
    creaBackupCompleto.mockClear();
  });

  it("mostra sezione backup automatico con frequenze", () => {
    render(
      <MemoryRouter>
        <Impostazioni />
      </MemoryRouter>
    );

    expect(screen.getByTestId("backup-automatico-sezione")).toBeInTheDocument();
    expect(screen.getByTestId("backup-auto-freq-disattivato")).toBeInTheDocument();
    expect(screen.getByTestId("backup-auto-freq-giornaliero")).toBeInTheDocument();
    expect(screen.getByTestId("backup-auto-freq-settimanale")).toBeInTheDocument();
    expect(screen.getByTestId("backup-auto-freq-mensile")).toBeInTheDocument();
    expect(
      screen.getByText(/Il backup automatico salva una copia locale/i)
    ).toBeInTheDocument();
  });

  it("esporta ultimo backup automatico senza creare nuovo backup", async () => {
    await salvaStorage(STORAGE_KEYS.backupAutomaticoUltimo, {
      app: "PreventivAI",
      versione: 1,
      creatoIl: "2026-08-20T10:00:00.000Z",
      dati: { clienti: [] },
    });
    esportaBlob.mockResolvedValue({ success: true, metodo: "share" });

    render(
      <MemoryRouter>
        <Impostazioni />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByTestId("esporta-backup-automatico"));

    await waitFor(() => {
      expect(esportaBlob).toHaveBeenCalledTimes(1);
    });
    expect(creaBackupCompleto).not.toHaveBeenCalled();
    expect(
      screen.getByText("Ultimo backup automatico pronto per la condivisione.")
    ).toBeInTheDocument();
  });

  it("messaggio chiaro se nessun backup automatico disponibile", async () => {
    render(
      <MemoryRouter>
        <Impostazioni />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByTestId("esporta-backup-automatico"));

    await waitFor(() => {
      expect(
        screen.getByText(/Nessun backup automatico disponibile/i)
      ).toBeInTheDocument();
    });
    expect(esportaBlob).not.toHaveBeenCalled();
  });

  it("cambia frequenza backup automatico", async () => {
    render(
      <MemoryRouter>
        <Impostazioni />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByTestId("backup-auto-freq-giornaliero"));

    await waitFor(() => {
      expect(screen.getByText("Backup automatico aggiornato.")).toBeInTheDocument();
    });
  });

  it("ripristino ultimo backup automatico con conferma", async () => {
    await salvaStorage(STORAGE_KEYS.backupAutomaticoUltimo, {
      app: "PreventivAI",
      versione: 1,
      creatoIl: "2026-08-20T10:00:00.000Z",
      dati: { clienti: [] },
    });

    render(
      <MemoryRouter>
        <Impostazioni />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByTestId("ripristina-backup-automatico"));
    expect(screen.getByTestId("conferma-ripristino-backup-auto")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("conferma-ripristino-backup-auto-confirm"));

    await waitFor(() => {
      expect(ripristinaBackupCompleto).toHaveBeenCalledTimes(1);
    });
  });
});
});
