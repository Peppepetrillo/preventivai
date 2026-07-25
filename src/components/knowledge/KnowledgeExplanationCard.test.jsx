import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import KnowledgeExplanationCard from "./KnowledgeExplanationCard";
import KnowledgeBadge from "./KnowledgeBadge";
import KnowledgeVerificationList from "./KnowledgeVerificationList";
import {
  descriviIndicazioniUtente,
  risolviSpiegazioneLavorazione,
} from "./knowledgeExplanationUtils";
import { runKnowledgeEngine } from "../../domain/knowledge/knowledgeEngine";
import { costruisciPreventivoProposal } from "../../domain/preventivi/preventivoProposalService";
import { listinoBase } from "../../data/listinoBase";

describe("knowledgeExplanationUtils", () => {
  it("recupera spiegazione da scheda KE", () => {
    const proposta = runKnowledgeEngine({
      superficieMq: 70,
      tipoImmobile: "appartamento",
      climatizzazione: true,
    });
    const proposal = costruisciPreventivoProposal({
      conoscenzaProposta: proposta,
      listino: listinoBase,
      input: {
        superficieMq: 70,
        tipoImmobile: "appartamento",
        climatizzazione: true,
      },
    });

    const clima = proposal.lavorazioni.find((l) => l.catalogoId === "CLIMA");
    const spiegazione = risolviSpiegazioneLavorazione(clima, proposal);
    expect(spiegazione).toMatchObject({
      catalogoId: "CLIMA",
      schedaTecnicaId: "BT_CLIMA_PREDISPOSIZIONE",
    });
    expect(spiegazione.motivazione).toMatch(/clima/i);
    expect(spiegazione.origine?.tipo).toBe("BUONA_PRATICA");
    expect(spiegazione.verificheProfessionista.length).toBeGreaterThan(0);
    expect(spiegazione.indicazioni).toEqual(
      expect.arrayContaining(["Climatizzazione = sì"])
    );
  });

  it("assenza scheda → null senza errore", () => {
    expect(
      risolviSpiegazioneLavorazione(
        { catalogoId: "VOCE_SENZA_SCHEDA", quantita: 1 },
        { conoscenzaProposta: { suggerimenti: [] } }
      )
    ).toBeNull();
  });

  it("descrive indicazioni utente dalle condizioni", () => {
    expect(
      descriviIndicazioniUtente(
        { climatizzazione: true, mqMin: 0 },
        { mq: 80 }
      )
    ).toEqual(
      expect.arrayContaining(["Climatizzazione = sì", "Superficie = 80 mq"])
    );
  });
});

describe("KnowledgeExplanationCard", () => {
  const spiegazione = {
    catalogoId: "CLIMA",
    quantita: 1,
    schedaTecnicaId: "BT_CLIMA_PREDISPOSIZIONE",
    motivazione: "Motivazione clima di test.",
    origine: { tipo: "BUONA_PRATICA" },
    verificheProfessionista: ["potenza macchina", "posizione installazione"],
    livelloAffidabilita: "MEDIO",
    indicazioni: ["Climatizzazione = sì"],
  };

  it("default chiusa; apre e mostra motivazione / verifiche", async () => {
    const user = userEvent.setup();
    render(<KnowledgeExplanationCard spiegazione={spiegazione} />);

    const toggle = screen.getByRole("button", {
      name: /Perché PreventivAI lo suggerisce/i,
    });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText(/Motivazione clima/i)).not.toBeInTheDocument();

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(/Motivazione clima/i)).toBeInTheDocument();
    expect(screen.getByText(/potenza macchina/i)).toBeInTheDocument();
    expect(screen.getByText(/Buona pratica/i)).toBeInTheDocument();
    expect(screen.getByText(/Affidabilità: Media/i)).toBeInTheDocument();
  });

  it("senza schedaTecnicaId non renderizza nulla", () => {
    const { container } = render(
      <KnowledgeExplanationCard
        spiegazione={{ motivazione: "x", schedaTecnicaId: null }}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });
});

describe("KnowledgeBadge / VerificationList", () => {
  it("badge origine e lista verifiche", () => {
    render(
      <>
        <KnowledgeBadge tipo="origine" valore={{ tipo: "NORMATIVA" }} />
        <KnowledgeVerificationList verifiche={["check A"]} />
      </>
    );
    expect(screen.getByText("Normativa")).toBeInTheDocument();
    expect(screen.getByText("check A")).toBeInTheDocument();
  });
});

describe("KE → UI collegamento", () => {
  it("suggerimenti KE espongono metadati Base Tecnica", () => {
    const proposta = runKnowledgeEngine({
      superficieMq: 60,
      tipoImmobile: "appartamento",
    });
    const punti = proposta.suggerimenti.find(
      (s) => s.catalogoId === "PUNTO_IMPIANTO"
    );
    expect(punti).toMatchObject({
      catalogoId: "PUNTO_IMPIANTO",
      schedaTecnicaId: "BT_PUNTO_IMPIANTO",
      livelloAffidabilita: "MEDIO",
    });
    expect(punti.motivazione).toBeTruthy();
    expect(punti.origineTecnica?.tipo).toBe("ESPERIENZA_PREVENTIVAI");
    expect(punti.origine).toBeDefined(); // layer Knowledge BASE/BRAIN
    expect(punti.verificheProfessionista.length).toBeGreaterThan(0);
  });
});
