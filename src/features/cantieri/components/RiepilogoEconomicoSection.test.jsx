import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import RiepilogoEconomicoSection from "./RiepilogoEconomicoSection";
import { CATEGORIE_SPESA } from "../services/speseCantiereService";

describe("RiepilogoEconomicoSection UX-Spese v1", () => {
  it("mostra totale, incassato, spese e margine lordo", () => {
    render(
      <RiepilogoEconomicoSection
        cantiere={{
          id: "c1",
          origine: "diretto",
          totaleLavoro: 5000,
          pagamenti: [
            {
              id: "p1",
              data: "01/09/2026",
              importo: 3000,
              tipo: "acconto",
              metodo: "contanti",
            },
          ],
          spese: [
            {
              id: "s1",
              data: "02/09/2026",
              importo: 800,
              descrizione: "Materiali",
              categoria: CATEGORIE_SPESA.materiali,
            },
          ],
        }}
      />
    );

    expect(screen.getByTestId("riepilogo-totale-cantiere")).toHaveTextContent(
      /5000/
    );
    expect(screen.getByTestId("riepilogo-incassato")).toHaveTextContent(/3000/);
    expect(screen.getByTestId("riepilogo-rimanenza")).toHaveTextContent(/2000/);
    expect(screen.getByTestId("riepilogo-spese")).toHaveTextContent(/800/);
    expect(screen.getByTestId("riepilogo-margine-lordo")).toHaveTextContent(
      /2200/
    );
  });

  it("mostra riepilogo costi materiali quando presenti", () => {
    render(
      <RiepilogoEconomicoSection
        cantiere={{
          id: "c1",
          origine: "diretto",
          totaleLavoro: 5000,
          materiali: [
            {
              id: "m1",
              nome: "Piastrelle",
              quantita: 10,
              unita: "mq",
              prezzoUnitario: 75,
            },
          ],
          spese: [
            {
              id: "s1",
              data: "02/09/2026",
              importo: 680,
              descrizione: "Piastrelle",
              categoria: CATEGORIE_SPESA.materiali,
              materialeId: "m1",
            },
          ],
        }}
      />
    );

    expect(screen.getByTestId("riepilogo-costi-materiali")).toHaveTextContent(
      /750/
    );
    expect(screen.getByTestId("riepilogo-costi-materiali")).toHaveTextContent(
      /680/
    );
    expect(screen.getByTestId("riepilogo-margine-lordo")).toHaveTextContent(
      /-680/
    );
  });
});

describe("RiepilogoEconomicoSection UX-Redditività v4", () => {
  it("mostra blocco redditività con stato e percentuale", () => {
    render(
      <RiepilogoEconomicoSection
        cantiere={{
          id: "c1",
          origine: "diretto",
          totaleLavoro: 10000,
          pagamenti: [
            {
              id: "p1",
              data: "01/09/2026",
              importo: 7000,
              tipo: "acconto",
              metodo: "contanti",
            },
          ],
          spese: [
            {
              id: "s1",
              data: "02/09/2026",
              importo: 2500,
              descrizione: "Materiali",
              categoria: CATEGORIE_SPESA.materiali,
            },
          ],
        }}
      />
    );

    expect(screen.getByTestId("cantiere-redditivita")).toBeInTheDocument();
    expect(screen.getByTestId("redditivita-stato")).toHaveTextContent(
      /Situazione positiva/
    );
    expect(screen.getByTestId("redditivita-percentuale")).toHaveTextContent(
      /64,3%/
    );
    expect(screen.getByTestId("redditivita-spese-categoria")).toHaveTextContent(
      /Materiali/
    );
  });

  it("mostra redditività negativa e percentuale non disponibile senza incassi", () => {
    render(
      <RiepilogoEconomicoSection
        cantiere={{
          id: "c1",
          origine: "diretto",
          totaleLavoro: 5000,
          spese: [
            {
              id: "s1",
              data: "02/09/2026",
              importo: 500,
              descrizione: "Materiali",
              categoria: CATEGORIE_SPESA.materiali,
            },
          ],
        }}
      />
    );

    expect(screen.getByTestId("redditivita-stato")).toHaveTextContent(
      /Dati insufficienti/
    );
    expect(screen.getByTestId("redditivita-percentuale")).toHaveTextContent(
      /Non disponibile/
    );
  });
});

describe("RiepilogoEconomicoSection UX-Controllo v5", () => {
  const cantierePositivo = {
    id: "c1",
    origine: "diretto",
    totaleLavoro: 10000,
    pagamenti: [
      {
        id: "p1",
        data: "01/09/2026",
        importo: 7000,
        tipo: "acconto",
        metodo: "contanti",
      },
    ],
    spese: [
      {
        id: "s1",
        data: "02/09/2026",
        importo: 2500,
        descrizione: "Materiali",
        categoria: CATEGORIE_SPESA.materiali,
      },
    ],
  };

  it("15. blocco controllo economico visibile", () => {
    render(<RiepilogoEconomicoSection cantiere={cantierePositivo} />);
    expect(screen.getByTestId("cantiere-controllo-economico")).toBeInTheDocument();
  });

  it("16. rimanenza distinta dal margine", () => {
    render(<RiepilogoEconomicoSection cantiere={cantierePositivo} />);
    expect(screen.getByTestId("riepilogo-rimanenza")).toHaveTextContent(/3000/);
    expect(screen.getByTestId("riepilogo-margine-lordo")).toHaveTextContent(
      /4500/
    );
  });

  it("17. incidenza spese visibile", () => {
    render(<RiepilogoEconomicoSection cantiere={cantierePositivo} />);
    expect(screen.getByTestId("controllo-incidenza-spese")).toHaveTextContent(
      /35,7%/
    );
  });

  it("18. stato positivo", () => {
    render(<RiepilogoEconomicoSection cantiere={cantierePositivo} />);
    expect(screen.getByTestId("controllo-economico-stato")).toHaveTextContent(
      /Situazione positiva/
    );
  });

  it("19. stato attenzione", () => {
    render(
      <RiepilogoEconomicoSection
        cantiere={{
          ...cantierePositivo,
          spese: [
            {
              id: "s1",
              data: "02/09/2026",
              importo: 6000,
              descrizione: "Materiali",
              categoria: CATEGORIE_SPESA.materiali,
            },
          ],
        }}
      />
    );
    expect(screen.getByTestId("controllo-economico-stato")).toHaveTextContent(
      /Richiede attenzione/
    );
  });

  it("20. stato critico", () => {
    render(
      <RiepilogoEconomicoSection
        cantiere={{
          ...cantierePositivo,
          pagamenti: [
            {
              id: "p1",
              data: "01/09/2026",
              importo: 1000,
              tipo: "acconto",
            },
          ],
          spese: [
            {
              id: "s1",
              data: "02/09/2026",
              importo: 2500,
              descrizione: "Materiali",
              categoria: CATEGORIE_SPESA.materiali,
            },
          ],
        }}
      />
    );
    expect(screen.getByTestId("controllo-economico-stato")).toHaveTextContent(
      /Situazione critica/
    );
    expect(screen.getByTestId("gestionale-segnale-margine_negativo")).toHaveTextContent(
      /superato l'incassato/
    );
  });

  it("21. scostamento materiali visibile", () => {
    render(
      <RiepilogoEconomicoSection
        cantiere={{
          ...cantierePositivo,
          materiali: [
            {
              id: "m1",
              nome: "Piastrelle",
              quantita: 10,
              unita: "mq",
              prezzoUnitario: 200,
            },
          ],
          spese: [
            {
              id: "s1",
              data: "02/09/2026",
              importo: 2300,
              descrizione: "Piastrelle",
              categoria: CATEGORIE_SPESA.materiali,
              materialeId: "m1",
            },
          ],
        }}
      />
    );
    expect(
      screen.getByTestId("controllo-scostamento-materiali")
    ).toHaveTextContent(/300/);
    expect(
      screen.getByTestId("controllo-messaggio-scostamento")
    ).toHaveTextContent(/superiori al previsto/);
  });
});

describe("RiepilogoEconomicoSection UX-Controllo gestionale v6", () => {
  const cantiereBase = {
    id: "c1",
    origine: "diretto",
    totaleLavoro: 10000,
    pagamenti: [
      {
        id: "p1",
        data: "01/09/2026",
        importo: 7000,
        tipo: "acconto",
      },
    ],
    spese: [
      {
        id: "s1",
        data: "02/09/2026",
        importo: 2500,
        descrizione: "Materiali",
        categoria: CATEGORIE_SPESA.materiali,
      },
    ],
  };

  it("1. situazione positiva", () => {
    render(<RiepilogoEconomicoSection cantiere={cantiereBase} />);
    expect(screen.getByTestId("gestionale-situazione-stato")).toHaveTextContent(
      /Situazione positiva/
    );
  });

  it("2. situazione attenzione", () => {
    render(
      <RiepilogoEconomicoSection
        cantiere={{
          ...cantiereBase,
          spese: [
            {
              id: "s1",
              data: "02/09/2026",
              importo: 6000,
              descrizione: "Materiali",
              categoria: CATEGORIE_SPESA.materiali,
            },
          ],
        }}
      />
    );
    expect(screen.getByTestId("gestionale-situazione-stato")).toHaveTextContent(
      /Richiede attenzione/
    );
  });

  it("3. situazione critica", () => {
    render(
      <RiepilogoEconomicoSection
        cantiere={{
          ...cantiereBase,
          pagamenti: [{ id: "p1", data: "01/09/2026", importo: 1000, tipo: "acconto" }],
          spese: cantiereBase.spese,
        }}
      />
    );
    expect(screen.getByTestId("gestionale-situazione-stato")).toHaveTextContent(
      /Situazione critica/
    );
  });

  it("4. dati insufficienti", () => {
    render(
      <RiepilogoEconomicoSection
        cantiere={{
          id: "c1",
          origine: "diretto",
          totaleLavoro: 5000,
          spese: cantiereBase.spese,
        }}
      />
    );
    expect(screen.getByTestId("gestionale-situazione-stato")).toHaveTextContent(
      /Dati insufficienti/
    );
  });

  it("5. percentuale incasso", () => {
    render(<RiepilogoEconomicoSection cantiere={cantiereBase} />);
    expect(screen.getByTestId("gestionale-percentuale-incasso")).toHaveTextContent(
      /70,0%/
    );
  });

  it("6. costi principali con percentuale", () => {
    render(<RiepilogoEconomicoSection cantiere={cantiereBase} />);
    expect(screen.getByTestId("gestionale-costi-principali")).toHaveTextContent(
      /Materiali/
    );
    expect(screen.getByTestId("gestionale-costi-principali")).toHaveTextContent(
      /sul totale spese/
    );
  });

  it("7. materiali e alert gestionale", () => {
    render(
      <RiepilogoEconomicoSection
        cantiere={{
          ...cantiereBase,
          materiali: [
            {
              id: "m1",
              nome: "Piastrelle",
              quantita: 10,
              unita: "mq",
              prezzoUnitario: 200,
            },
          ],
          spese: [
            {
              id: "s1",
              data: "02/09/2026",
              importo: 2300,
              descrizione: "Piastrelle",
              categoria: CATEGORIE_SPESA.materiali,
              materialeId: "m1",
            },
          ],
        }}
      />
    );
    expect(screen.getByTestId("riepilogo-costi-materiali")).toBeInTheDocument();
    expect(
      screen.getByTestId("controllo-messaggio-scostamento")
    ).toHaveTextContent(/superiori al previsto/);
  });

  it("8. alert margine negativo", () => {
    render(
      <RiepilogoEconomicoSection
        cantiere={{
          ...cantiereBase,
          pagamenti: [{ id: "p1", data: "01/09/2026", importo: 1000, tipo: "acconto" }],
        }}
      />
    );
    expect(
      screen.getByTestId("gestionale-segnale-margine_negativo")
    ).toBeInTheDocument();
  });

  it("9. stato espresso anche con testo visibile", () => {
    render(<RiepilogoEconomicoSection cantiere={cantiereBase} />);
    const card = screen.getByTestId("assistente-situazione-cantiere");
    expect(card).toHaveTextContent(/Situazione positiva/);
    expect(card).toHaveTextContent(/Margine/);
    expect(screen.getByTestId("assistente-situazione-messaggio")).toHaveTextContent(
      /buona redditività/
    );
  });

  it("10. contenuti essenziali mobile", () => {
    render(<RiepilogoEconomicoSection cantiere={cantiereBase} />);
    expect(screen.getByTestId("assistente-situazione-cantiere")).toBeInTheDocument();
    expect(screen.getByTestId("assistente-da-fare-ora")).toBeInTheDocument();
    expect(screen.getByTestId("assistente-cosa-e-cambiato")).toBeInTheDocument();
    expect(screen.getByTestId("assistente-problema-principale")).toBeInTheDocument();
    expect(screen.getByTestId("gestionale-avanzamento")).toBeInTheDocument();
    expect(screen.getByTestId("gestionale-destinazione-incassi")).toBeInTheDocument();
    expect(screen.getByTestId("gestionale-da-tenere-docchio")).toBeInTheDocument();
    expect(screen.getByTestId("gestionale-riepilogo-rapido")).toBeInTheDocument();
  });
});

describe("RiepilogoEconomicoSection UX-Azioni v7", () => {
  it("5. CTA margine negativo → vedi spese", () => {
    const onAzione = vi.fn();
    render(
      <RiepilogoEconomicoSection
        onAzioneGestionale={onAzione}
        cantiere={{
          id: "c1",
          origine: "diretto",
          totaleLavoro: 10000,
          pagamenti: [
            { id: "p1", data: "01/09/2026", importo: 1000, tipo: "acconto" },
          ],
          spese: [
            {
              id: "s1",
              data: "02/09/2026",
              importo: 2500,
              descrizione: "Materiali",
              categoria: CATEGORIE_SPESA.materiali,
            },
          ],
        }}
      />
    );
    fireEvent.click(screen.getByTestId("gestionale-azione-vedi_spese"));
    expect(onAzione).toHaveBeenCalledTimes(1);
    expect(onAzione).toHaveBeenCalledWith(
      expect.objectContaining({
        tipo: "vedi_spese",
        target: "sezione-spese",
        label: "Vedi spese",
      })
    );
  });

  it("6. CTA materiali sopra previsto → vedi materiali", () => {
    const onAzione = vi.fn();
    render(
      <RiepilogoEconomicoSection
        onAzioneGestionale={onAzione}
        cantiere={{
          id: "c1",
          origine: "diretto",
          totaleLavoro: 10000,
          pagamenti: [
            { id: "p1", data: "01/09/2026", importo: 7000, tipo: "acconto" },
          ],
          materiali: [
            {
              id: "m1",
              nome: "Piastrelle",
              quantita: 10,
              unita: "mq",
              prezzoUnitario: 200,
            },
          ],
          spese: [
            {
              id: "s1",
              data: "02/09/2026",
              importo: 2300,
              descrizione: "Piastrelle",
              categoria: CATEGORIE_SPESA.materiali,
              materialeId: "m1",
            },
          ],
        }}
      />
    );
    fireEvent.click(screen.getByTestId("gestionale-azione-vedi_materiali"));
    expect(onAzione).toHaveBeenCalledTimes(1);
    expect(onAzione).toHaveBeenCalledWith(
      expect.objectContaining({
        tipo: "vedi_materiali",
        target: "sezione-materiali",
        contesto: expect.objectContaining({ materialeId: "m1" }),
      })
    );
    expect(
      screen.getByTestId("gestionale-segnale-dettaglio-materiali_sopra")
    ).toHaveTextContent(/2300|2\.300/);
  });

  it("7. CTA margine contenuto → vedi spese", () => {
    const onAzione = vi.fn();
    render(
      <RiepilogoEconomicoSection
        onAzioneGestionale={onAzione}
        cantiere={{
          id: "c1",
          origine: "diretto",
          totaleLavoro: 10000,
          pagamenti: [
            { id: "p1", data: "01/09/2026", importo: 7000, tipo: "acconto" },
          ],
          spese: [
            {
              id: "s1",
              data: "02/09/2026",
              importo: 6000,
              descrizione: "Materiali",
              categoria: CATEGORIE_SPESA.materiali,
            },
          ],
        }}
      />
    );
    const btn = screen.getByTestId("gestionale-azione-vedi_spese");
    expect(btn).toHaveTextContent(/Vedi spese/);
    fireEvent.click(btn);
    expect(onAzione).toHaveBeenCalledTimes(1);
    expect(onAzione).toHaveBeenCalledWith(
      expect.objectContaining({ tipo: "vedi_spese", target: "sezione-spese" })
    );
  });

  it("8. CTA registra spesa", () => {
    const onAzione = vi.fn();
    render(
      <RiepilogoEconomicoSection
        onAzioneGestionale={onAzione}
        cantiere={{
          id: "c1",
          origine: "diretto",
          totaleLavoro: 10000,
          pagamenti: [
            { id: "p1", data: "01/09/2026", importo: 7000, tipo: "acconto" },
          ],
          spese: [],
        }}
      />
    );
    fireEvent.click(screen.getByTestId("gestionale-azione-registra_spesa"));
    expect(onAzione).toHaveBeenCalledTimes(1);
    expect(onAzione).toHaveBeenCalledWith(
      expect.objectContaining({
        tipo: "registra_spesa",
        target: "nuova-spesa",
      })
    );
  });

  it("9. nessuna CTA senza callback", () => {
    render(
      <RiepilogoEconomicoSection
        cantiere={{
          id: "c1",
          origine: "diretto",
          totaleLavoro: 10000,
          pagamenti: [
            { id: "p1", data: "01/09/2026", importo: 7000, tipo: "acconto" },
          ],
          spese: [],
        }}
      />
    );
    expect(
      screen.queryByTestId("gestionale-azione-registra_spesa")
    ).not.toBeInTheDocument();
  });

  it("10. testo CTA corretto per incasso", () => {
    render(
      <RiepilogoEconomicoSection
        onAzioneGestionale={vi.fn()}
        cantiere={{
          id: "c1",
          origine: "diretto",
          totaleLavoro: 5000,
          spese: [
            {
              id: "s1",
              data: "02/09/2026",
              importo: 500,
              descrizione: "Materiali",
              categoria: CATEGORIE_SPESA.materiali,
            },
          ],
        }}
      />
    );
    expect(screen.getByTestId("gestionale-azione-registra_incasso")).toHaveTextContent(
      /Registra incasso/
    );
  });

  it("11. pulsante CTA ha aria-label", () => {
    render(
      <RiepilogoEconomicoSection
        onAzioneGestionale={vi.fn()}
        cantiere={{
          id: "c1",
          origine: "diretto",
          totaleLavoro: 10000,
          pagamenti: [
            { id: "p1", data: "01/09/2026", importo: 7000, tipo: "acconto" },
          ],
          spese: [],
        }}
      />
    );
    expect(
      screen.getByRole("button", { name: "Registra spesa" })
    ).toBeInTheDocument();
  });

  it("14. nessuna criticità — nessuna CTA operativa", () => {
    render(
      <RiepilogoEconomicoSection
        onAzioneGestionale={vi.fn()}
        cantiere={{
          id: "c1",
          origine: "diretto",
          totaleLavoro: 10000,
          pagamenti: [
            { id: "p1", data: "01/09/2026", importo: 7000, tipo: "acconto" },
          ],
          spese: [
            {
              id: "s1",
              data: "02/09/2026",
              importo: 2500,
              descrizione: "Materiali",
              categoria: CATEGORIE_SPESA.materiali,
            },
          ],
        }}
      />
    );
    expect(screen.queryByTestId(/^gestionale-azione-/)).not.toBeInTheDocument();
    expect(screen.getByTestId("assistente-da-fare-priorita")).toHaveTextContent(
      /Nessuna azione urgente/
    );
  });
});

describe("RiepilogoEconomicoSection UX-Assistente economico v9", () => {
  it("13. hero situazione visibile", () => {
    render(
      <RiepilogoEconomicoSection
        cantiere={{
          id: "c1",
          origine: "diretto",
          totaleLavoro: 10000,
          pagamenti: [
            { id: "p1", data: "01/09/2026", importo: 7000, tipo: "acconto" },
          ],
          spese: [
            {
              id: "s1",
              data: "02/09/2026",
              importo: 2500,
              descrizione: "Materiali",
              categoria: CATEGORIE_SPESA.materiali,
            },
          ],
        }}
      />
    );
    expect(screen.getByTestId("assistente-situazione-cantiere")).toBeVisible();
    expect(screen.getByTestId("assistente-situazione-messaggio")).toBeVisible();
  });

  it("14. problema principale visibile con spiegazione", () => {
    render(
      <RiepilogoEconomicoSection
        cantiere={{
          id: "c1",
          origine: "diretto",
          totaleLavoro: 10000,
          pagamenti: [
            { id: "p1", data: "01/09/2026", importo: 1000, tipo: "acconto" },
          ],
          spese: [
            {
              id: "s1",
              data: "02/09/2026",
              importo: 2500,
              descrizione: "Materiali",
              categoria: CATEGORIE_SPESA.materiali,
            },
          ],
        }}
      />
    );
    expect(screen.getByTestId("assistente-problema-principale")).toBeInTheDocument();
    expect(screen.getByTestId("assistente-problema-spiegazione")).toHaveTextContent(
      /superano gli incassi/
    );
  });

  it("15. cosa fare adesso visibile", () => {
    render(
      <RiepilogoEconomicoSection
        cantiere={{
          id: "c1",
          origine: "diretto",
          totaleLavoro: 10000,
          pagamenti: [
            { id: "p1", data: "01/09/2026", importo: 1000, tipo: "acconto" },
          ],
          spese: [
            {
              id: "s1",
              data: "02/09/2026",
              importo: 2500,
              descrizione: "Materiali",
              categoria: CATEGORIE_SPESA.materiali,
            },
          ],
        }}
      />
    );
    expect(screen.getByTestId("assistente-da-fare-ora")).toBeInTheDocument();
    expect(screen.getByTestId("assistente-da-fare-priorita")).toHaveTextContent(
      /Controlla le spese/
    );
  });

  it("16. CTA corretta su Da fare ora", () => {
    const onAzione = vi.fn();
    render(
      <RiepilogoEconomicoSection
        onAzioneGestionale={onAzione}
        cantiere={{
          id: "c1",
          origine: "diretto",
          totaleLavoro: 10000,
          pagamenti: [
            { id: "p1", data: "01/09/2026", importo: 1000, tipo: "acconto" },
          ],
          spese: [
            {
              id: "s1",
              data: "02/09/2026",
              importo: 2500,
              descrizione: "Materiali",
              categoria: CATEGORIE_SPESA.materiali,
            },
          ],
        }}
      />
    );
    fireEvent.click(screen.getByTestId("gestionale-azione-vedi_spese"));
    expect(onAzione).toHaveBeenCalledWith(
      expect.objectContaining({ target: "sezione-spese" })
    );
  });

  it("17. nessuna CTA senza callback", () => {
    render(
      <RiepilogoEconomicoSection
        cantiere={{
          id: "c1",
          origine: "diretto",
          totaleLavoro: 10000,
          pagamenti: [
            { id: "p1", data: "01/09/2026", importo: 7000, tipo: "acconto" },
          ],
          spese: [],
        }}
      />
    );
    expect(
      screen.queryByTestId("gestionale-azione-registra_spesa")
    ).not.toBeInTheDocument();
  });

  it("18. materiale contestuale nel problema", () => {
    render(
      <RiepilogoEconomicoSection
        cantiere={{
          id: "c1",
          origine: "diretto",
          totaleLavoro: 10000,
          pagamenti: [
            { id: "p1", data: "01/09/2026", importo: 7000, tipo: "acconto" },
          ],
          materiali: [
            {
              id: "m1",
              nome: "Piastrelle",
              quantita: 10,
              unita: "mq",
              prezzoUnitario: 200,
            },
          ],
          spese: [
            {
              id: "s1",
              data: "02/09/2026",
              importo: 2300,
              descrizione: "Piastrelle",
              categoria: CATEGORIE_SPESA.materiali,
              materialeId: "m1",
            },
          ],
        }}
      />
    );
    expect(screen.getByTestId("assistente-problema-materiale")).toHaveTextContent(
      /Piastrelle/
    );
  });

  it("19. heading hierarchy accessibile", () => {
    render(
      <RiepilogoEconomicoSection
        cantiere={{
          id: "c1",
          origine: "diretto",
          totaleLavoro: 10000,
          pagamenti: [
            { id: "p1", data: "01/09/2026", importo: 7000, tipo: "acconto" },
          ],
          spese: [
            {
              id: "s1",
              data: "02/09/2026",
              importo: 2500,
              descrizione: "Materiali",
              categoria: CATEGORIE_SPESA.materiali,
            },
          ],
        }}
      />
    );
    expect(
      screen.getByRole("heading", { name: "Controllo gestionale" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Problema principale" })
    ).toBeInTheDocument();
  });

  it("20. CTA con aria-label e min-height", () => {
    render(
      <RiepilogoEconomicoSection
        onAzioneGestionale={vi.fn()}
        cantiere={{
          id: "c1",
          origine: "diretto",
          totaleLavoro: 10000,
          pagamenti: [
            { id: "p1", data: "01/09/2026", importo: 1000, tipo: "acconto" },
          ],
          spese: [
            {
              id: "s1",
              data: "02/09/2026",
              importo: 2500,
              descrizione: "Materiali",
              categoria: CATEGORIE_SPESA.materiali,
            },
          ],
        }}
      />
    );
    const btn = screen.getByRole("button", { name: "Vedi spese" });
    expect(btn).toHaveAttribute("aria-label", "Vedi spese");
    expect(btn.className).toMatch(/min-h-\[44px\]/);
  });
});

describe("RiepilogoEconomicoSection UX-Azioni intelligenti v8", () => {
  it("13. callback chiamato una sola volta per tap", () => {
    const onAzione = vi.fn();
    render(
      <RiepilogoEconomicoSection
        onAzioneGestionale={onAzione}
        cantiere={{
          id: "c1",
          origine: "diretto",
          totaleLavoro: 10000,
          pagamenti: [],
          spese: [
            {
              id: "s1",
              data: "02/09/2026",
              importo: 500,
              descrizione: "Materiali",
              categoria: CATEGORIE_SPESA.materiali,
            },
          ],
        }}
      />
    );
    fireEvent.click(screen.getByTestId("gestionale-azione-registra_incasso"));
    expect(onAzione).toHaveBeenCalledTimes(1);
  });

  it("16. aggiornamento segnali dopo nuovo dato cantiere", () => {
    const base = {
      id: "c1",
      origine: "diretto",
      totaleLavoro: 10000,
      pagamenti: [],
      spese: [],
    };
    const { rerender } = render(
      <RiepilogoEconomicoSection onAzioneGestionale={vi.fn()} cantiere={base} />
    );
    expect(screen.getByTestId("gestionale-azione-registra_incasso")).toBeInTheDocument();

    rerender(
      <RiepilogoEconomicoSection
        onAzioneGestionale={vi.fn()}
        cantiere={{
          ...base,
          pagamenti: [
            { id: "p1", data: "01/09/2026", importo: 7000, tipo: "acconto" },
          ],
        }}
      />
    );
    expect(
      screen.queryByTestId("gestionale-azione-registra_incasso")
    ).not.toBeInTheDocument();
  });
});

describe("RiepilogoEconomicoSection UX-Assistente operativo v11", () => {
  it("1. blocco Da fare ora visibile", () => {
    render(
      <RiepilogoEconomicoSection
        cantiere={{
          id: "c1",
          origine: "diretto",
          totaleLavoro: 10000,
          pagamenti: [
            { id: "p1", data: "01/09/2026", importo: 7000, tipo: "acconto" },
          ],
          spese: [
            {
              id: "s1",
              data: "02/09/2026",
              importo: 2500,
              descrizione: "Materiali",
              categoria: CATEGORIE_SPESA.materiali,
            },
          ],
        }}
      />
    );
    expect(screen.getByTestId("assistente-da-fare-ora")).toBeVisible();
  });

  it("2. CTA prioritaria su Da fare ora", () => {
    const onAzione = vi.fn();
    render(
      <RiepilogoEconomicoSection
        onAzioneGestionale={onAzione}
        cantiere={{
          id: "c1",
          origine: "diretto",
          totaleLavoro: 10000,
          pagamenti: [
            { id: "p1", data: "01/09/2026", importo: 1000, tipo: "acconto" },
          ],
          spese: [
            {
              id: "s1",
              data: "02/09/2026",
              importo: 2500,
              descrizione: "Materiali",
              categoria: CATEGORIE_SPESA.materiali,
            },
          ],
        }}
      />
    );
    fireEvent.click(screen.getByTestId("gestionale-azione-vedi_spese"));
    expect(onAzione).toHaveBeenCalledWith(
      expect.objectContaining({ target: "sezione-spese" })
    );
  });

  it("3. nessuna azione urgente — nessuna CTA", () => {
    render(
      <RiepilogoEconomicoSection
        onAzioneGestionale={vi.fn()}
        cantiere={{
          id: "c1",
          origine: "diretto",
          totaleLavoro: 10000,
          pagamenti: [
            { id: "p1", data: "01/09/2026", importo: 7000, tipo: "acconto" },
          ],
          spese: [
            {
              id: "s1",
              data: "02/09/2026",
              importo: 2500,
              descrizione: "Materiali",
              categoria: CATEGORIE_SPESA.materiali,
            },
          ],
        }}
      />
    );
    expect(screen.getByTestId("assistente-da-fare-priorita")).toHaveTextContent(
      /Nessuna azione urgente/
    );
    expect(screen.queryByTestId("gestionale-azione-vedi_spese")).not.toBeInTheDocument();
  });

  it("4. blocco Cosa è cambiato", () => {
    render(
      <RiepilogoEconomicoSection
        cantiere={{
          id: "c1",
          origine: "diretto",
          totaleLavoro: 10000,
          pagamenti: [
            { id: "p1", data: "01/09/2026", importo: 7000, tipo: "acconto" },
          ],
          spese: [
            {
              id: "s1",
              data: "02/09/2026",
              importo: 2500,
              descrizione: "Materiali",
              categoria: CATEGORIE_SPESA.materiali,
            },
          ],
        }}
      />
    );
    expect(screen.getByTestId("assistente-cosa-e-cambiato")).toBeVisible();
  });

  it("5. dati insufficienti per cambiamenti", () => {
    render(
      <RiepilogoEconomicoSection
        cantiere={{
          id: "c1",
          origine: "diretto",
          totaleLavoro: 10000,
          pagamenti: [],
          spese: [
            {
              id: "s1",
              data: "02/09/2026",
              importo: 500,
              descrizione: "Materiali",
              categoria: CATEGORIE_SPESA.materiali,
            },
          ],
        }}
      />
    );
    expect(
      screen.getByTestId("assistente-cambiamenti-non-disponibile")
    ).toHaveTextContent(/Confronto storico non disponibile/);
  });

  it("6. nuovi incassi elencati", () => {
    render(
      <RiepilogoEconomicoSection
        cantiere={{
          id: "c1",
          origine: "diretto",
          totaleLavoro: 10000,
          pagamenti: [
            { id: "p1", data: "01/09/2026", importo: 1000, tipo: "acconto" },
            { id: "p2", data: "20/09/2026", importo: 5000, tipo: "acconto" },
          ],
          spese: [
            {
              id: "s1",
              data: "02/09/2026",
              importo: 800,
              descrizione: "A",
              categoria: CATEGORIE_SPESA.materiali,
            },
          ],
        }}
      />
    );
    expect(screen.getByTestId("assistente-cosa-e-cambiato")).toHaveTextContent(
      /incasso/i
    );
  });

  it("7. nuove spese elencate", () => {
    render(
      <RiepilogoEconomicoSection
        cantiere={{
          id: "c1",
          origine: "diretto",
          totaleLavoro: 10000,
          pagamenti: [
            { id: "p1", data: "01/09/2026", importo: 7000, tipo: "acconto" },
          ],
          spese: [
            {
              id: "s1",
              data: "01/09/2026",
              importo: 500,
              descrizione: "A",
              categoria: CATEGORIE_SPESA.materiali,
            },
            {
              id: "s2",
              data: "20/09/2026",
              importo: 2000,
              descrizione: "B",
              categoria: CATEGORIE_SPESA.materiali,
            },
          ],
        }}
      />
    );
    expect(screen.getByTestId("assistente-cosa-e-cambiato")).toHaveTextContent(/spes/i);
  });

  it("8. peggioramento visibile in Da fare ora", () => {
    render(
      <RiepilogoEconomicoSection
        cantiere={{
          id: "c1",
          origine: "diretto",
          totaleLavoro: 10000,
          pagamenti: [
            { id: "p1", data: "01/09/2026", importo: 7000, tipo: "acconto" },
            { id: "p2", data: "12/09/2026", importo: 500, tipo: "acconto" },
          ],
          spese: [
            {
              id: "s1",
              data: "05/09/2026",
              importo: 500,
              descrizione: "A",
              categoria: CATEGORIE_SPESA.materiali,
            },
            {
              id: "s2",
              data: "20/09/2026",
              importo: 2000,
              descrizione: "B",
              categoria: CATEGORIE_SPESA.materiali,
            },
          ],
        }}
      />
    );
    expect(screen.getByTestId("assistente-da-fare-priorita")).toHaveTextContent(
      /Controlla le spese/
    );
  });

  it("9. materiale responsabile — CTA materiali", () => {
    const onAzione = vi.fn();
    render(
      <RiepilogoEconomicoSection
        onAzioneGestionale={onAzione}
        cantiere={{
          id: "c1",
          origine: "diretto",
          totaleLavoro: 10000,
          pagamenti: [
            { id: "p1", data: "01/09/2026", importo: 7000, tipo: "acconto" },
          ],
          materiali: [
            {
              id: "m1",
              nome: "Piastrelle",
              quantita: 10,
              unita: "mq",
              prezzoUnitario: 200,
            },
          ],
          spese: [
            {
              id: "s1",
              data: "02/09/2026",
              importo: 2300,
              descrizione: "Piastrelle",
              categoria: CATEGORIE_SPESA.materiali,
              materialeId: "m1",
            },
          ],
        }}
      />
    );
    fireEvent.click(screen.getByTestId("gestionale-azione-vedi_materiali"));
    expect(onAzione).toHaveBeenCalledWith(
      expect.objectContaining({
        contesto: expect.objectContaining({ materialeId: "m1" }),
      })
    );
  });

  it("10. assenza duplicazione CTA su problema principale", () => {
    render(
      <RiepilogoEconomicoSection
        onAzioneGestionale={vi.fn()}
        cantiere={{
          id: "c1",
          origine: "diretto",
          totaleLavoro: 10000,
          pagamenti: [
            { id: "p1", data: "01/09/2026", importo: 1000, tipo: "acconto" },
          ],
          spese: [
            {
              id: "s1",
              data: "02/09/2026",
              importo: 2500,
              descrizione: "Materiali",
              categoria: CATEGORIE_SPESA.materiali,
            },
          ],
        }}
      />
    );
    expect(screen.getAllByTestId("gestionale-azione-vedi_spese")).toHaveLength(1);
  });

  it("11. accessibilità heading e aria", () => {
    render(
      <RiepilogoEconomicoSection
        onAzioneGestionale={vi.fn()}
        cantiere={{
          id: "c1",
          origine: "diretto",
          totaleLavoro: 10000,
          pagamenti: [
            { id: "p1", data: "01/09/2026", importo: 1000, tipo: "acconto" },
          ],
          spese: [
            {
              id: "s1",
              data: "02/09/2026",
              importo: 2500,
              descrizione: "Materiali",
              categoria: CATEGORIE_SPESA.materiali,
            },
          ],
        }}
      />
    );
    expect(screen.getByRole("heading", { name: "Da decidere ora" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Cosa è cambiato" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Vedi spese" })).toHaveAttribute(
      "aria-label",
      "Vedi spese"
    );
  });

  it("12. test ID legacy gestionale-segnale", () => {
    render(
      <RiepilogoEconomicoSection
        cantiere={{
          id: "c1",
          origine: "diretto",
          totaleLavoro: 10000,
          pagamenti: [
            { id: "p1", data: "01/09/2026", importo: 1000, tipo: "acconto" },
          ],
          spese: [
            {
              id: "s1",
              data: "02/09/2026",
              importo: 2500,
              descrizione: "Materiali",
              categoria: CATEGORIE_SPESA.materiali,
            },
          ],
        }}
      />
    );
    expect(screen.getByTestId("gestionale-segnale-margine_negativo")).toBeInTheDocument();
    expect(screen.getByTestId("gestionale-situazione")).toBeInTheDocument();
  });
});

describe("RiepilogoEconomicoSection UX-Assistente contestuale v12", () => {
  it("1. Situazione visibile", () => {
    render(
      <RiepilogoEconomicoSection
        cantiere={{
          id: "c1",
          origine: "diretto",
          totaleLavoro: 10000,
          pagamenti: [
            { id: "p1", data: "01/09/2026", importo: 7000, tipo: "acconto" },
          ],
          spese: [
            {
              id: "s1",
              data: "02/09/2026",
              importo: 2500,
              descrizione: "Materiali",
              categoria: CATEGORIE_SPESA.materiali,
            },
          ],
        }}
      />
    );
    expect(screen.getByTestId("assistente-situazione-cantiere")).toBeVisible();
  });

  it("2. Da fare ora visibile", () => {
    render(
      <RiepilogoEconomicoSection
        cantiere={{
          id: "c1",
          origine: "diretto",
          totaleLavoro: 10000,
          pagamenti: [
            { id: "p1", data: "01/09/2026", importo: 7000, tipo: "acconto" },
          ],
          spese: [
            {
              id: "s1",
              data: "02/09/2026",
              importo: 2500,
              descrizione: "Materiali",
              categoria: CATEGORIE_SPESA.materiali,
            },
          ],
        }}
      />
    );
    expect(screen.getByTestId("assistente-da-fare-ora")).toBeVisible();
  });

  it("3. Perché visibile", () => {
    render(
      <RiepilogoEconomicoSection
        cantiere={{
          id: "c1",
          origine: "diretto",
          totaleLavoro: 10000,
          pagamenti: [
            { id: "p1", data: "01/09/2026", importo: 7000, tipo: "acconto" },
          ],
          spese: [
            {
              id: "s1",
              data: "02/09/2026",
              importo: 2500,
              descrizione: "Materiali",
              categoria: CATEGORIE_SPESA.materiali,
            },
          ],
        }}
      />
    );
    expect(screen.getByTestId("assistente-perche")).toBeVisible();
    expect(screen.getByTestId("assistente-spiegazione-priorita")).toHaveTextContent(
      /redditività positiva/i
    );
  });

  it("4. Evidenze visibili", () => {
    render(
      <RiepilogoEconomicoSection
        cantiere={{
          id: "c1",
          origine: "diretto",
          totaleLavoro: 10000,
          pagamenti: [
            { id: "p1", data: "01/09/2026", importo: 1000, tipo: "acconto" },
          ],
          spese: [
            {
              id: "s1",
              data: "02/09/2026",
              importo: 2500,
              descrizione: "Materiali",
              categoria: CATEGORIE_SPESA.materiali,
            },
          ],
        }}
      />
    );
    expect(screen.getByTestId("assistente-evidenze")).toBeVisible();
    expect(screen.getByTestId("assistente-evidenza-margine")).toBeInTheDocument();
  });

  it("5. Cosa controllare visibile", () => {
    render(
      <RiepilogoEconomicoSection
        cantiere={{
          id: "c1",
          origine: "diretto",
          totaleLavoro: 10000,
          pagamenti: [
            { id: "p1", data: "01/09/2026", importo: 1000, tipo: "acconto" },
          ],
          spese: [
            {
              id: "s1",
              data: "02/09/2026",
              importo: 2500,
              descrizione: "Materiali",
              categoria: CATEGORIE_SPESA.materiali,
            },
          ],
        }}
      />
    );
    expect(screen.getByTestId("assistente-cosa-controllare")).toBeVisible();
  });

  it("6. CTA corretta", () => {
    const onAzione = vi.fn();
    render(
      <RiepilogoEconomicoSection
        onAzioneGestionale={onAzione}
        cantiere={{
          id: "c1",
          origine: "diretto",
          totaleLavoro: 10000,
          pagamenti: [
            { id: "p1", data: "01/09/2026", importo: 1000, tipo: "acconto" },
          ],
          spese: [
            {
              id: "s1",
              data: "02/09/2026",
              importo: 2500,
              descrizione: "Materiali",
              categoria: CATEGORIE_SPESA.materiali,
            },
          ],
        }}
      />
    );
    fireEvent.click(screen.getByTestId("gestionale-azione-vedi_spese"));
    expect(onAzione).toHaveBeenCalledWith(
      expect.objectContaining({ target: "sezione-spese" })
    );
  });

  it("7. situazione positiva", () => {
    render(
      <RiepilogoEconomicoSection
        cantiere={{
          id: "c1",
          origine: "diretto",
          totaleLavoro: 10000,
          pagamenti: [
            { id: "p1", data: "01/09/2026", importo: 7000, tipo: "acconto" },
          ],
          spese: [
            {
              id: "s1",
              data: "02/09/2026",
              importo: 2500,
              descrizione: "Materiali",
              categoria: CATEGORIE_SPESA.materiali,
            },
          ],
        }}
      />
    );
    expect(screen.getByTestId("assistente-spiegazione-priorita")).toHaveTextContent(
      /redditività positiva/i
    );
  });

  it("8. margine negativo", () => {
    render(
      <RiepilogoEconomicoSection
        cantiere={{
          id: "c1",
          origine: "diretto",
          totaleLavoro: 10000,
          pagamenti: [
            { id: "p1", data: "01/09/2026", importo: 1000, tipo: "acconto" },
          ],
          spese: [
            {
              id: "s1",
              data: "02/09/2026",
              importo: 2500,
              descrizione: "Materiali",
              categoria: CATEGORIE_SPESA.materiali,
            },
          ],
        }}
      />
    );
    expect(screen.getByTestId("assistente-spiegazione-priorita")).toHaveTextContent(
      /superato gli incassi/i
    );
  });

  it("9. materiale sopra previsto", () => {
    render(
      <RiepilogoEconomicoSection
        cantiere={{
          id: "c1",
          origine: "diretto",
          totaleLavoro: 10000,
          pagamenti: [
            { id: "p1", data: "01/09/2026", importo: 7000, tipo: "acconto" },
          ],
          materiali: [
            {
              id: "m1",
              nome: "Piastrelle",
              quantita: 10,
              unita: "mq",
              prezzoUnitario: 200,
            },
          ],
          spese: [
            {
              id: "s1",
              data: "02/09/2026",
              importo: 2300,
              descrizione: "Piastrelle",
              categoria: CATEGORIE_SPESA.materiali,
              materialeId: "m1",
            },
          ],
        }}
      />
    );
    expect(screen.getByTestId("assistente-evidenze")).toHaveTextContent(/Piastrelle/);
  });

  it("10. nessuna azione urgente", () => {
    render(
      <RiepilogoEconomicoSection
        onAzioneGestionale={vi.fn()}
        cantiere={{
          id: "c1",
          origine: "diretto",
          totaleLavoro: 10000,
          pagamenti: [
            { id: "p1", data: "01/09/2026", importo: 7000, tipo: "acconto" },
          ],
          spese: [
            {
              id: "s1",
              data: "02/09/2026",
              importo: 2500,
              descrizione: "Materiali",
              categoria: CATEGORIE_SPESA.materiali,
            },
          ],
        }}
      />
    );
    expect(screen.getByTestId("assistente-da-fare-priorita")).toHaveTextContent(
      /Nessuna azione urgente/
    );
    expect(screen.queryByTestId("gestionale-azione-vedi_spese")).not.toBeInTheDocument();
  });

  it("11. accessibilità", () => {
    render(
      <RiepilogoEconomicoSection
        onAzioneGestionale={vi.fn()}
        cantiere={{
          id: "c1",
          origine: "diretto",
          totaleLavoro: 10000,
          pagamenti: [
            { id: "p1", data: "01/09/2026", importo: 1000, tipo: "acconto" },
          ],
          spese: [
            {
              id: "s1",
              data: "02/09/2026",
              importo: 2500,
              descrizione: "Materiali",
              categoria: CATEGORIE_SPESA.materiali,
            },
          ],
        }}
      />
    );
    const btn = screen.getByRole("button", { name: "Vedi spese" });
    expect(btn).toHaveAttribute("aria-label", "Vedi spese");
    expect(btn.className).toMatch(/min-h-\[44px\]/);
  });

  it("12. assenza duplicazioni evidenti", () => {
    render(
      <RiepilogoEconomicoSection
        onAzioneGestionale={vi.fn()}
        cantiere={{
          id: "c1",
          origine: "diretto",
          totaleLavoro: 10000,
          pagamenti: [
            { id: "p1", data: "01/09/2026", importo: 1000, tipo: "acconto" },
          ],
          spese: [
            {
              id: "s1",
              data: "02/09/2026",
              importo: 2500,
              descrizione: "Materiali",
              categoria: CATEGORIE_SPESA.materiali,
            },
          ],
        }}
      />
    );
    expect(screen.getAllByText(/^Perché\?$/)).toHaveLength(1);
    expect(screen.getAllByTestId("gestionale-azione-vedi_spese")).toHaveLength(1);
  });
});

describe("RiepilogoEconomicoSection UX-Assistente decisionale v13", () => {
  it("1. Da decidere ora visibile", () => {
    render(
      <RiepilogoEconomicoSection
        cantiere={{
          id: "c1",
          origine: "diretto",
          totaleLavoro: 10000,
          pagamenti: [
            { id: "p1", data: "01/09/2026", importo: 7000, tipo: "acconto" },
          ],
          spese: [
            {
              id: "s1",
              data: "02/09/2026",
              importo: 2500,
              descrizione: "Materiali",
              categoria: CATEGORIE_SPESA.materiali,
            },
          ],
        }}
      />
    );
    expect(screen.getByTestId("assistente-da-decidere-ora")).toBeVisible();
    expect(screen.getByRole("heading", { name: "Da decidere ora" })).toBeVisible();
  });

  it("2. decisione visibile", () => {
    render(
      <RiepilogoEconomicoSection
        cantiere={{
          id: "c1",
          origine: "diretto",
          totaleLavoro: 10000,
          pagamenti: [{ id: "p1", data: "01/09/2026", importo: 1000, tipo: "acconto" }],
          spese: [
            {
              id: "s1",
              data: "02/09/2026",
              importo: 2500,
              descrizione: "Materiali",
              categoria: CATEGORIE_SPESA.materiali,
            },
          ],
        }}
      />
    );
    expect(screen.getByTestId("assistente-decisione-principale")).toHaveTextContent(
      /problema di costi/i
    );
  });

  it("3. impatto economico visibile", () => {
    render(
      <RiepilogoEconomicoSection
        cantiere={{
          id: "c1",
          origine: "diretto",
          totaleLavoro: 10000,
          pagamenti: [{ id: "p1", data: "01/09/2026", importo: 1000, tipo: "acconto" }],
          spese: [
            {
              id: "s1",
              data: "02/09/2026",
              importo: 2500,
              descrizione: "Materiali",
              categoria: CATEGORIE_SPESA.materiali,
            },
          ],
        }}
      />
    );
    expect(screen.getByTestId("assistente-impatto-economico")).toHaveTextContent(
      /superano gli incassi/i
    );
  });

  it("4. evidenze e azione raccomandata", () => {
    render(
      <RiepilogoEconomicoSection
        cantiere={{
          id: "c1",
          origine: "diretto",
          totaleLavoro: 10000,
          pagamenti: [{ id: "p1", data: "01/09/2026", importo: 1000, tipo: "acconto" }],
          spese: [
            {
              id: "s1",
              data: "02/09/2026",
              importo: 2500,
              descrizione: "Materiali",
              categoria: CATEGORIE_SPESA.materiali,
            },
          ],
        }}
      />
    );
    expect(screen.getByTestId("assistente-evidenze")).toBeVisible();
    expect(screen.getByTestId("assistente-azione-raccomandata")).toHaveTextContent(
      /Controlla le spese/
    );
  });

  it("5. singola CTA e navigazione", () => {
    const onAzione = vi.fn();
    render(
      <RiepilogoEconomicoSection
        onAzioneGestionale={onAzione}
        cantiere={{
          id: "c1",
          origine: "diretto",
          totaleLavoro: 10000,
          pagamenti: [{ id: "p1", data: "01/09/2026", importo: 1000, tipo: "acconto" }],
          spese: [
            {
              id: "s1",
              data: "02/09/2026",
              importo: 2500,
              descrizione: "Materiali",
              categoria: CATEGORIE_SPESA.materiali,
            },
          ],
        }}
      />
    );
    expect(screen.getAllByTestId("gestionale-azione-vedi_spese")).toHaveLength(1);
    fireEvent.click(screen.getByTestId("gestionale-azione-vedi_spese"));
    expect(onAzione).toHaveBeenCalledWith(
      expect.objectContaining({ target: "sezione-spese" })
    );
  });

  it("6. positivo senza CTA", () => {
    render(
      <RiepilogoEconomicoSection
        onAzioneGestionale={vi.fn()}
        cantiere={{
          id: "c1",
          origine: "diretto",
          totaleLavoro: 10000,
          pagamenti: [
            { id: "p1", data: "01/09/2026", importo: 7000, tipo: "acconto" },
          ],
          spese: [
            {
              id: "s1",
              data: "02/09/2026",
              importo: 2500,
              descrizione: "Materiali",
              categoria: CATEGORIE_SPESA.materiali,
            },
          ],
        }}
      />
    );
    expect(screen.getByTestId("assistente-decisione-principale")).toHaveTextContent(
      /Non ci sono decisioni economiche urgenti/
    );
    expect(screen.queryByTestId("gestionale-azione-vedi_spese")).not.toBeInTheDocument();
  });

  it("7. materiale sopra previsto", () => {
    render(
      <RiepilogoEconomicoSection
        cantiere={{
          id: "c1",
          origine: "diretto",
          totaleLavoro: 10000,
          pagamenti: [
            { id: "p1", data: "01/09/2026", importo: 7000, tipo: "acconto" },
          ],
          materiali: [
            {
              id: "m1",
              nome: "Piastrelle",
              quantita: 10,
              unita: "mq",
              prezzoUnitario: 200,
            },
          ],
          spese: [
            {
              id: "s1",
              data: "02/09/2026",
              importo: 2300,
              descrizione: "Piastrelle",
              categoria: CATEGORIE_SPESA.materiali,
              materialeId: "m1",
            },
          ],
        }}
      />
    );
    expect(screen.getByTestId("assistente-decisione-principale")).toHaveTextContent(
      /Piastrelle/
    );
  });

  it("8. accessibilità CTA", () => {
    render(
      <RiepilogoEconomicoSection
        onAzioneGestionale={vi.fn()}
        cantiere={{
          id: "c1",
          origine: "diretto",
          totaleLavoro: 10000,
          pagamenti: [{ id: "p1", data: "01/09/2026", importo: 1000, tipo: "acconto" }],
          spese: [
            {
              id: "s1",
              data: "02/09/2026",
              importo: 2500,
              descrizione: "Materiali",
              categoria: CATEGORIE_SPESA.materiali,
            },
          ],
        }}
      />
    );
    const btn = screen.getByRole("button", { name: "Vedi spese" });
    expect(btn).toHaveAttribute("aria-label", "Vedi spese");
    expect(btn.className).toMatch(/min-h-\[44px\]/);
  });

  it("9. assenza duplicazioni", () => {
    render(
      <RiepilogoEconomicoSection
        onAzioneGestionale={vi.fn()}
        cantiere={{
          id: "c1",
          origine: "diretto",
          totaleLavoro: 10000,
          pagamenti: [{ id: "p1", data: "01/09/2026", importo: 1000, tipo: "acconto" }],
          spese: [
            {
              id: "s1",
              data: "02/09/2026",
              importo: 2500,
              descrizione: "Materiali",
              categoria: CATEGORIE_SPESA.materiali,
            },
          ],
        }}
      />
    );
    expect(screen.getAllByTestId("gestionale-azione-vedi_spese")).toHaveLength(1);
    expect(screen.getByTestId("assistente-cosa-e-cambiato")).toBeVisible();
  });

  it("10. retrocompatibilità test id v11/v12", () => {
    render(
      <RiepilogoEconomicoSection
        cantiere={{
          id: "c1",
          origine: "diretto",
          totaleLavoro: 10000,
          pagamenti: [
            { id: "p1", data: "01/09/2026", importo: 7000, tipo: "acconto" },
          ],
          spese: [
            {
              id: "s1",
              data: "02/09/2026",
              importo: 2500,
              descrizione: "Materiali",
              categoria: CATEGORIE_SPESA.materiali,
            },
          ],
        }}
      />
    );
    expect(screen.getByTestId("assistente-da-fare-ora")).toBeVisible();
    expect(screen.getByTestId("assistente-perche")).toBeVisible();
    expect(screen.getByTestId("assistente-evidenze")).toBeVisible();
  });
});

describe("RiepilogoEconomicoSection UX-Assistente scenari v14", () => {
  const cantiereSim = {
    id: "c1",
    origine: "diretto",
    totaleLavoro: 10000,
    pagamenti: [
      { id: "p1", data: "01/09/2026", importo: 7000, tipo: "acconto" },
    ],
    spese: [
      {
        id: "s1",
        data: "02/09/2026",
        importo: 2500,
        descrizione: "Materiali",
        categoria: CATEGORIE_SPESA.materiali,
      },
    ],
  };

  it("1. blocco simulazione presente", () => {
    render(<RiepilogoEconomicoSection cantiere={cantiereSim} />);
    expect(screen.getByTestId("assistente-simula-blocco")).toBeVisible();
  });

  it("2. selezione spesa", () => {
    render(<RiepilogoEconomicoSection cantiere={cantiereSim} />);
    fireEvent.click(screen.getByTestId("assistente-simula-spesa"));
    expect(screen.getByTestId("assistente-simula-attivo")).toBeVisible();
  });

  it("3. selezione incasso", () => {
    render(<RiepilogoEconomicoSection cantiere={cantiereSim} />);
    fireEvent.click(screen.getByTestId("assistente-simula-incasso"));
    expect(screen.getByText(/Simulazione incasso/i)).toBeVisible();
  });

  it("4. risultato spesa simulato", () => {
    render(<RiepilogoEconomicoSection cantiere={cantiereSim} />);
    fireEvent.click(screen.getByTestId("assistente-simula-spesa"));
    fireEvent.change(screen.getByTestId("assistente-simula-importo"), {
      target: { value: "500" },
    });
    expect(screen.getByTestId("assistente-simula-risultato")).toBeVisible();
    expect(screen.getByTestId("assistente-simula-reale")).toHaveTextContent(/4\.500|4500/);
    expect(screen.getByTestId("assistente-simula-scenario")).toHaveTextContent(/4\.000|4000/);
  });

  it("5. risultato incasso simulato", () => {
    render(<RiepilogoEconomicoSection cantiere={cantiereSim} />);
    fireEvent.click(screen.getByTestId("assistente-simula-incasso"));
    fireEvent.change(screen.getByTestId("assistente-simula-importo"), {
      target: { value: "1000" },
    });
    expect(screen.getByTestId("assistente-simula-scenario")).toHaveTextContent(/8\.000|8000/);
    expect(screen.getByTestId("assistente-simula-variazione")).toHaveTextContent(/rimanenza/i);
  });

  it("6. Registra davvero riusa CTA esistente", () => {
    const onAzione = vi.fn();
    render(
      <RiepilogoEconomicoSection cantiere={cantiereSim} onAzioneGestionale={onAzione} />
    );
    fireEvent.click(screen.getByTestId("assistente-simula-spesa"));
    fireEvent.change(screen.getByTestId("assistente-simula-importo"), {
      target: { value: "500" },
    });
    fireEvent.click(screen.getByTestId("assistente-simula-registra-davvero"));
    expect(onAzione).toHaveBeenCalledWith(
      expect.objectContaining({
        tipo: "registra_spesa",
        contesto: expect.objectContaining({
          importo: 500,
          origine: "assistente-economico",
        }),
      })
    );
  });

  it("7. chiusura simulazione", () => {
    render(<RiepilogoEconomicoSection cantiere={cantiereSim} />);
    fireEvent.click(screen.getByTestId("assistente-simula-spesa"));
    fireEvent.click(screen.getByTestId("assistente-simula-chiudi"));
    expect(screen.queryByTestId("assistente-simula-attivo")).not.toBeInTheDocument();
  });

  it("8. input invalido", () => {
    render(<RiepilogoEconomicoSection cantiere={cantiereSim} />);
    fireEvent.click(screen.getByTestId("assistente-simula-spesa"));
    fireEvent.change(screen.getByTestId("assistente-simula-importo"), {
      target: { value: "0" },
    });
    expect(screen.getByTestId("assistente-simula-invalido")).toBeVisible();
  });

  it("9. cambio stato visibile", () => {
    render(
      <RiepilogoEconomicoSection
        cantiere={{
          id: "c1",
          origine: "diretto",
          totaleLavoro: 10000,
          pagamenti: [{ id: "p1", data: "01/09/2026", importo: 3000, tipo: "acconto" }],
          spese: [
            {
              id: "s1",
              data: "02/09/2026",
              importo: 2800,
              descrizione: "A",
              categoria: CATEGORIE_SPESA.altro,
            },
          ],
        }}
      />
    );
    fireEvent.click(screen.getByTestId("assistente-simula-spesa"));
    fireEvent.change(screen.getByTestId("assistente-simula-importo"), {
      target: { value: "500" },
    });
    expect(screen.getByTestId("assistente-simula-cambio-stato")).toBeVisible();
  });

  it("10. accessibilità input", () => {
    render(<RiepilogoEconomicoSection cantiere={cantiereSim} />);
    fireEvent.click(screen.getByTestId("assistente-simula-spesa"));
    expect(screen.getByLabelText("Importo simulazione")).toBeInTheDocument();
  });
});

describe("RiepilogoEconomicoSection UX-Assistente decisione-azione-verifica v15", () => {
  const cantiereSim = {
    id: "c1",
    origine: "diretto",
    totaleLavoro: 10000,
    pagamenti: [
      { id: "p1", data: "01/09/2026", importo: 7000, tipo: "acconto" },
    ],
    spese: [
      {
        id: "s1",
        data: "02/09/2026",
        importo: 2500,
        descrizione: "Materiali",
        categoria: CATEGORIE_SPESA.materiali,
      },
    ],
  };

  it("I. reset simulazione e verifica dopo registrazione spesa", () => {
    const { rerender } = render(
      <RiepilogoEconomicoSection
        cantiere={cantiereSim}
        onAzioneGestionale={vi.fn()}
        operazioneRegistrataTick={0}
      />
    );

    fireEvent.click(screen.getByTestId("assistente-simula-spesa"));
    fireEvent.change(screen.getByTestId("assistente-simula-importo"), {
      target: { value: "500" },
    });
    fireEvent.click(screen.getByTestId("assistente-simula-registra-davvero"));
    expect(screen.getByTestId("assistente-simula-registrazione")).toBeVisible();

    const cantiereDopo = {
      ...cantiereSim,
      spese: [
        ...cantiereSim.spese,
        {
          id: "s2",
          data: "03/09/2026",
          importo: 500,
          descrizione: "Extra",
          categoria: CATEGORIE_SPESA.altro,
        },
      ],
    };

    rerender(
      <RiepilogoEconomicoSection
        cantiere={cantiereDopo}
        onAzioneGestionale={vi.fn()}
        operazioneRegistrata={{ tipo: "spesa", importo: 500 }}
        operazioneRegistrataTick={1}
      />
    );

    expect(screen.getByTestId("assistente-verifica")).toBeVisible();
    expect(screen.getByTestId("assistente-verifica-messaggio")).toBeVisible();
    expect(screen.queryByTestId("assistente-simula-attivo")).not.toBeInTheDocument();
  });

  it("H. verifica dopo registrazione incasso", () => {
    const { rerender } = render(
      <RiepilogoEconomicoSection
        cantiere={cantiereSim}
        onAzioneGestionale={vi.fn()}
        operazioneRegistrataTick={0}
      />
    );

    fireEvent.click(screen.getByTestId("assistente-simula-incasso"));
    fireEvent.change(screen.getByTestId("assistente-simula-importo"), {
      target: { value: "1000" },
    });
    fireEvent.click(screen.getByTestId("assistente-simula-registra-davvero"));

    const cantiereDopo = {
      ...cantiereSim,
      pagamenti: [
        ...cantiereSim.pagamenti,
        { id: "p2", data: "03/09/2026", importo: 1000, tipo: "acconto" },
      ],
    };

    rerender(
      <RiepilogoEconomicoSection
        cantiere={cantiereDopo}
        onAzioneGestionale={vi.fn()}
        operazioneRegistrata={{ tipo: "incasso", importo: 1000 }}
        operazioneRegistrataTick={1}
      />
    );

    expect(screen.getByTestId("assistente-verifica")).toBeVisible();
    expect(screen.getByTestId("assistente-verifica-messaggio").textContent).toMatch(
      /migliorata|residuo|incasso|aggiornata/i
    );
  });

  it("M. nessuna verifica se registrazione non avviene", () => {
    render(
      <RiepilogoEconomicoSection
        cantiere={cantiereSim}
        onAzioneGestionale={vi.fn()}
        operazioneRegistrataTick={0}
      />
    );
    fireEvent.click(screen.getByTestId("assistente-simula-spesa"));
    fireEvent.change(screen.getByTestId("assistente-simula-importo"), {
      target: { value: "500" },
    });
    fireEvent.click(screen.getByTestId("assistente-simula-registra-davvero"));
    expect(screen.queryByTestId("assistente-verifica")).not.toBeInTheDocument();
    expect(screen.getByTestId("assistente-simula-registrazione")).toBeVisible();
  });

  it("O. nessuna doppia registrazione", () => {
    const onAzione = vi.fn();
    render(
      <RiepilogoEconomicoSection cantiere={cantiereSim} onAzioneGestionale={onAzione} />
    );
    fireEvent.click(screen.getByTestId("assistente-simula-spesa"));
    fireEvent.change(screen.getByTestId("assistente-simula-importo"), {
      target: { value: "500" },
    });
    fireEvent.click(screen.getByTestId("assistente-simula-registra-davvero"));
    fireEvent.click(screen.getByTestId("assistente-simula-registra-davvero"));
    expect(onAzione).toHaveBeenCalledTimes(1);
  });

  it("classificazione visibile in simulazione", () => {
    render(<RiepilogoEconomicoSection cantiere={cantiereSim} />);
    fireEvent.click(screen.getByTestId("assistente-simula-spesa"));
    fireEvent.change(screen.getByTestId("assistente-simula-importo"), {
      target: { value: "500" },
    });
    expect(screen.getByTestId("assistente-simula-classificazione")).toHaveTextContent(
      /peggiora/i
    );
  });

  it("K–L. dopo verifica priorità e situazione aggiornate", () => {
    const { rerender } = render(
      <RiepilogoEconomicoSection
        cantiere={cantiereSim}
        onAzioneGestionale={vi.fn()}
        operazioneRegistrataTick={0}
      />
    );
    fireEvent.click(screen.getByTestId("assistente-simula-spesa"));
    fireEvent.change(screen.getByTestId("assistente-simula-importo"), {
      target: { value: "500" },
    });
    fireEvent.click(screen.getByTestId("assistente-simula-registra-davvero"));

    rerender(
      <RiepilogoEconomicoSection
        cantiere={{
          ...cantiereSim,
          spese: [
            ...cantiereSim.spese,
            {
              id: "s2",
              data: "03/09/2026",
              importo: 500,
              descrizione: "Extra",
              categoria: CATEGORIE_SPESA.altro,
            },
          ],
        }}
        onAzioneGestionale={vi.fn()}
        operazioneRegistrata={{ tipo: "spesa", importo: 500 }}
        operazioneRegistrataTick={1}
      />
    );

    expect(screen.getByTestId("assistente-verifica-situazione")).toBeVisible();
    expect(screen.getByTestId("assistente-verifica-priorita")).toBeVisible();
  });
});

describe("RiepilogoEconomicoSection UX V16-A/B/C", () => {
  const cantiereSim = {
    id: "c1",
    origine: "diretto",
    totaleLavoro: 10000,
    pagamenti: [
      { id: "p1", data: "01/09/2026", importo: 7000, tipo: "acconto" },
    ],
    spese: [
      {
        id: "s1",
        data: "02/09/2026",
        importo: 2500,
        descrizione: "Materiali",
        categoria: CATEGORIE_SPESA.materiali,
      },
    ],
  };

  it("V16-C: CTA spesa con importo formattato e primaria", () => {
    render(
      <RiepilogoEconomicoSection cantiere={cantiereSim} onAzioneGestionale={vi.fn()} />
    );
    fireEvent.click(screen.getByTestId("assistente-simula-spesa"));
    fireEvent.change(screen.getByTestId("assistente-simula-importo"), {
      target: { value: "500" },
    });
    const cta = screen.getByTestId("assistente-simula-registra-davvero");
    expect(cta).toHaveTextContent(/Registra spesa di/i);
    expect(cta).toHaveTextContent(/500/);
    expect(cta.className).toMatch(/btn-primary/);
  });

  it("V16-C: CTA incasso con importo", () => {
    render(
      <RiepilogoEconomicoSection cantiere={cantiereSim} onAzioneGestionale={vi.fn()} />
    );
    fireEvent.click(screen.getByTestId("assistente-simula-incasso"));
    fireEvent.change(screen.getByTestId("assistente-simula-importo"), {
      target: { value: "500" },
    });
    expect(screen.getByTestId("assistente-simula-registra-davvero")).toHaveTextContent(
      /Registra incasso di/i
    );
  });

  it("V16-A: CTA passa contesto importo e origine assistente", () => {
    const onAzione = vi.fn();
    render(
      <RiepilogoEconomicoSection cantiere={cantiereSim} onAzioneGestionale={onAzione} />
    );
    fireEvent.click(screen.getByTestId("assistente-simula-incasso"));
    fireEvent.change(screen.getByTestId("assistente-simula-importo"), {
      target: { value: "500" },
    });
    fireEvent.click(screen.getByTestId("assistente-simula-registra-davvero"));
    expect(onAzione).toHaveBeenCalledWith(
      expect.objectContaining({
        tipo: "registra_incasso",
        contesto: expect.objectContaining({
          importo: 500,
          origine: "assistente-economico",
        }),
      })
    );
  });

  it("V16-C: CTA disabilitata e lock doppio tap in registrazione", () => {
    const onAzione = vi.fn();
    render(
      <RiepilogoEconomicoSection cantiere={cantiereSim} onAzioneGestionale={onAzione} />
    );
    fireEvent.click(screen.getByTestId("assistente-simula-spesa"));
    fireEvent.change(screen.getByTestId("assistente-simula-importo"), {
      target: { value: "500" },
    });
    const cta = screen.getByTestId("assistente-simula-registra-davvero");
    fireEvent.click(cta);
    fireEvent.click(cta);
    expect(onAzione).toHaveBeenCalledTimes(1);
    expect(cta).toBeDisabled();
  });

  it("V16-B: dopo salvataggio Verifica ha id stabile e riceve scroll", async () => {
    const scrollSpy = vi.fn();
    Element.prototype.scrollIntoView = scrollSpy;

    const { rerender } = render(
      <RiepilogoEconomicoSection
        cantiere={cantiereSim}
        onAzioneGestionale={vi.fn()}
        operazioneRegistrataTick={0}
      />
    );
    fireEvent.click(screen.getByTestId("assistente-simula-spesa"));
    fireEvent.change(screen.getByTestId("assistente-simula-importo"), {
      target: { value: "500" },
    });
    fireEvent.click(screen.getByTestId("assistente-simula-registra-davvero"));

    rerender(
      <RiepilogoEconomicoSection
        cantiere={{
          ...cantiereSim,
          spese: [
            ...cantiereSim.spese,
            {
              id: "s2",
              data: "03/09/2026",
              importo: 500,
              descrizione: "Extra",
              categoria: CATEGORIE_SPESA.altro,
            },
          ],
        }}
        onAzioneGestionale={vi.fn()}
        operazioneRegistrata={{ tipo: "spesa", importo: 500 }}
        operazioneRegistrataTick={1}
      />
    );

    const verifica = screen.getByTestId("assistente-verifica");
    expect(verifica).toHaveAttribute("id", "assistente-verifica");
    await waitFor(() => expect(scrollSpy).toHaveBeenCalled());
  });
});
