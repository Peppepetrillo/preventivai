import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { STORAGE_KEYS } from "../app/storageKeys";
import { ROUTES } from "../app/routes";
import { CATALOGO_MATERIALI_SEED } from "../domain/catalogoMateriali/materialiCatalogoSeed";
import {
  creaDistintaMateriali,
  trovaDistintaPerId,
} from "../domain/distinteMateriali/distintaMaterialiService";
import DistintaMaterialiEditor from "./DistintaMaterialiEditor";
import DistinteMateriali from "./DistinteMateriali";

vi.mock("../features/distinteMateriali/distintaPdfService", () => ({
  generaPdfDistintaMateriali: vi.fn(async () => ({
    nomeFile: "test.pdf",
    blob: new Blob(),
    blobUrl: "",
    pagine: 1,
  })),
}));

function renderEditor(path = ROUTES.nuovaDistintaMateriali) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path={ROUTES.distinteMateriali} element={<DistinteMateriali />} />
        <Route
          path={ROUTES.nuovaDistintaMateriali}
          element={<DistintaMaterialiEditor />}
        />
        <Route
          path={ROUTES.distintaMateriali}
          element={<DistintaMaterialiEditor />}
        />
      </Routes>
    </MemoryRouter>
  );
}

/** Ultimo dialog aperto (AnimatePresence può lasciare quello in uscita). */
function ultimoDialog() {
  const dialogs = screen.getAllByRole("dialog");
  return dialogs[dialogs.length - 1];
}

describe("DistintaMaterialiEditor UI", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(
      STORAGE_KEYS.catalogoMateriali,
      JSON.stringify(CATALOGO_MATERIALI_SEED)
    );
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn(async () => undefined) },
    });
    vi.spyOn(window, "open").mockImplementation(() => null);
  });

  it("crea e salva una nuova distinta", () => {
    renderEditor();
    fireEvent.change(screen.getByTestId("distinta-titolo"), {
      target: { value: "BOM test" },
    });
    fireEvent.change(screen.getByTestId("distinta-cliente"), {
      target: { value: "Mario" },
    });
    fireEvent.click(screen.getByTestId("distinta-salva"));
    expect(screen.getByText(/Distinta creata|Salvata/i)).toBeInTheDocument();
    const stored = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.distinteMateriali) || "[]"
    );
    expect(stored).toHaveLength(1);
    expect(stored[0].titolo).toBe("BOM test");
    expect(stored[0].clienteNome).toBe("Mario");
  });

  it("aggiunge voce manuale senza catalogo", () => {
    renderEditor();
    fireEvent.change(screen.getByTestId("distinta-titolo"), {
      target: { value: "Manuale" },
    });
    fireEvent.click(screen.getByTestId("distinta-aggiungi-materiale"));
    fireEvent.click(screen.getByTestId("distinta-manuale"));

    const dialog = ultimoDialog();
    fireEvent.change(within(dialog).getByPlaceholderText(/Tubo corrugato/i), {
      target: { value: "Materiale libero XYZ" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: /^Salva$/i }));

    expect(screen.getByText("Materiale libero XYZ")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("distinta-salva"));

    const stored = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.distinteMateriali) || "[]"
    );
    expect(stored[0].voci).toHaveLength(1);
    expect(stored[0].voci[0].nome).toBe("Materiale libero XYZ");
    expect(stored[0].voci[0].famigliaId).toBeUndefined();
    expect(stored[0].voci[0].varianteId).toBeUndefined();
  });

  it("aggiunge materiale dal catalogo", () => {
    renderEditor();
    fireEvent.change(screen.getByTestId("distinta-titolo"), {
      target: { value: "Da catalogo" },
    });
    fireEvent.click(screen.getByTestId("distinta-aggiungi-materiale"));
    fireEvent.click(screen.getByTestId("distinta-da-catalogo"));

    const dialog = ultimoDialog();
    fireEvent.click(
      within(dialog).getByRole("button", { name: /Corrugati e tubazioni/i })
    );
    fireEvent.click(
      within(dialog).getByRole("button", { name: /Tubo corrugato/i })
    );
    fireEvent.click(within(dialog).getByRole("button", { name: /Ø25/i }));
    fireEvent.click(
      within(dialog).getByRole("button", { name: /Aggiungi alla distinta/i })
    );

    // UX-6.1c: tubo Ø25 ha accessori → sheet suggeriti (salta)
    expect(screen.getByText(/^Suggeriti$/i)).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("suggerimenti-salta"));

    const voci = screen.getByTestId("distinta-voci-list");
    expect(within(voci).getByText(/Tubo corrugato/i)).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("distinta-salva"));

    const stored = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.distinteMateriali) || "[]"
    );
    expect(stored[0].voci[0].famigliaId).toBeTruthy();
    expect(stored[0].voci[0].varianteId).toBeTruthy();
    expect(stored[0].voci[0].unita).toBe("m");
  });

  it("dopo add da catalogo aggiunge accessori suggeriti flat", () => {
    renderEditor();
    fireEvent.change(screen.getByTestId("distinta-titolo"), {
      target: { value: "Con accessori" },
    });
    fireEvent.click(screen.getByTestId("distinta-aggiungi-materiale"));
    fireEvent.click(screen.getByTestId("distinta-da-catalogo"));

    const dialog = ultimoDialog();
    fireEvent.click(
      within(dialog).getByRole("button", { name: /Serie civile/i })
    );
    fireEvent.click(
      within(dialog).getByRole("button", { name: /Presa civile/i })
    );
    fireEvent.click(within(dialog).getByRole("button", { name: /Bipasso/i }));
    fireEvent.click(
      within(dialog).getByRole("button", { name: /Aggiungi alla distinta/i })
    );

    expect(screen.getByText(/^Suggeriti$/i)).toBeInTheDocument();
    expect(screen.getByTestId("suggerimenti-accessori-list")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("suggerimenti-aggiungi"));

    const voci = screen.getByTestId("distinta-voci-list");
    expect(within(voci).getByText(/Presa civile/i)).toBeInTheDocument();
    expect(within(voci).getByText(/Cassetta/i)).toBeInTheDocument();
    expect(within(voci).getAllByText(/Accessorio suggerito/i).length).toBeGreaterThanOrEqual(1);

    fireEvent.click(screen.getByTestId("distinta-salva"));
    const stored = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.distinteMateriali) || "[]"
    );
    expect(stored[0].voci.length).toBeGreaterThanOrEqual(2);
    const accessorio = stored[0].voci.find((v) => v.parentVoceId);
    expect(accessorio).toBeTruthy();
    expect(accessorio.origineAccessorio).toBe("suggerito");
    expect(accessorio.parentVoceId).toBe(stored[0].voci[0].id);
  });

  it("ricerca materiale nel selettore", () => {
    renderEditor();
    fireEvent.click(screen.getByTestId("distinta-aggiungi-materiale"));
    fireEvent.click(screen.getByTestId("distinta-da-catalogo"));
    const dialog = ultimoDialog();
    fireEvent.change(within(dialog).getByLabelText(/Cerca materiale/i), {
      target: { value: "corrugato" },
    });
    expect(
      within(dialog).getByRole("button", { name: /Tubo corrugato/i })
    ).toBeInTheDocument();
  });

  it("modifica quantità e unità di una voce", () => {
    const d = creaDistintaMateriali({
      titolo: "Edit voci",
      voci: [
        {
          nome: "Cavo prova",
          quantita: 10,
          unita: "m",
          note: "originale",
        },
      ],
    });
    renderEditor(ROUTES.distintaMateriali.replace(":id", d.id));

    fireEvent.click(screen.getByLabelText(/Modifica Cavo prova/i));
    const dialog = ultimoDialog();
    const qtyLabel = within(dialog).getByText(/^Quantità$/i);
    const qtyInput = qtyLabel.parentElement.querySelector("input");
    const unitaSelect = within(dialog).getByDisplayValue("m");
    fireEvent.focus(qtyInput);
    fireEvent.change(qtyInput, { target: { value: "25" } });
    fireEvent.blur(qtyInput);
    fireEvent.change(unitaSelect, { target: { value: "pz" } });
    fireEvent.click(within(dialog).getByRole("button", { name: /^Salva$/i }));

    expect(screen.getByText(/25 pz/)).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("distinta-salva"));
    const updated = trovaDistintaPerId(d.id);
    expect(updated.voci[0].quantita).toBe(25);
    expect(updated.voci[0].unita).toBe("pz");
  });

  it("elimina voce dalla distinta", () => {
    const d = creaDistintaMateriali({
      titolo: "Delete voce",
      voci: [{ nome: "Da togliere", quantita: 1, unita: "pz" }],
    });
    renderEditor(ROUTES.distintaMateriali.replace(":id", d.id));
    fireEvent.click(screen.getByLabelText(/Elimina Da togliere/i));
    expect(screen.getByTestId("distinta-voci-empty")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("distinta-salva"));
    expect(trovaDistintaPerId(d.id).voci).toHaveLength(0);
  });

  it("apre condivisione e copia testo senza prezzi", async () => {
    const d = creaDistintaMateriali({
      titolo: "Share",
      clienteNome: "Mario",
      voci: [
        { nome: "Tubo corrugato Ø25", quantita: 50, unita: "m", prezzoUnitario: 1 },
      ],
    });
    renderEditor(ROUTES.distintaMateriali.replace(":id", d.id));
    fireEvent.click(screen.getByTestId("distinta-condividi"));

    const dialog = ultimoDialog();
    expect(within(dialog).getByText(/Ciao Mario/)).toBeInTheDocument();
    expect(within(dialog).getByText(/Tubo corrugato Ø25 — 50 m/)).toBeInTheDocument();
    expect(within(dialog).queryByText(/Totale/)).not.toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole("button", { name: /Copia testo/i }));
    expect(navigator.clipboard.writeText).toHaveBeenCalled();
    const testo = navigator.clipboard.writeText.mock.calls[0][0];
    expect(testo).not.toMatch(/€/);
  });

  it("condivisione con prezzi opzionale e WhatsApp", () => {
    const d = creaDistintaMateriali({
      titolo: "Share prezzi",
      clienteNome: "Mario",
      voci: [
        { nome: "Cavo", quantita: 10, unita: "m", prezzoUnitario: 2 },
      ],
    });
    renderEditor(ROUTES.distintaMateriali.replace(":id", d.id));
    fireEvent.click(screen.getByTestId("distinta-condividi"));
    const dialog = ultimoDialog();
    fireEvent.click(within(dialog).getByLabelText(/Mostra prezzi/i));
    expect(within(dialog).getByText(/Totale indicativo/)).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: /WhatsApp/i }));
    expect(window.open).toHaveBeenCalled();
  });

  it("genera PDF dalla condivisione", async () => {
    const { generaPdfDistintaMateriali } = await import(
      "../features/distinteMateriali/distintaPdfService"
    );
    const d = creaDistintaMateriali({
      titolo: "PDF test",
      voci: [{ nome: "Tubo", quantita: 1, unita: "m" }],
    });
    renderEditor(ROUTES.distintaMateriali.replace(":id", d.id));
    fireEvent.click(screen.getByTestId("distinta-condividi"));
    fireEvent.click(screen.getByRole("button", { name: /^PDF$/i }));
    expect(generaPdfDistintaMateriali).toHaveBeenCalled();
  });

  it("mostra stato vuoto materiali in editor", () => {
    renderEditor();
    expect(screen.getByTestId("distinta-voci-empty")).toBeInTheDocument();
  });
});
