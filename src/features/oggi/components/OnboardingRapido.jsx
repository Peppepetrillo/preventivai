import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  FileText,
  HardHat,
  Mic,
  Wallet,
  X,
} from "lucide-react";

import { ROUTES } from "../../../app/routes";

/** Pref locale (non APP_DATA_KEYS / non sync). */
export const ONBOARDING_RAPIDO_KEY = "preventivai:onboarding-rapido-v1";

const STEP = [
  {
    id: "cliente",
    titolo: "1. Crea un cliente",
    testo: "Anagrafica essenziale: nome e, se serve, telefono.",
    to: `${ROUTES.clienti}?nuovo=1`,
    cta: "Nuovo cliente",
    Icon: Building2,
  },
  {
    id: "preventivo",
    titolo: "2. Crea un preventivo",
    testo: "Dal listino o a mano: quantità e prezzi tuoi.",
    to: ROUTES.preventiviNuovo,
    cta: "Nuovo preventivo",
    Icon: FileText,
  },
  {
    id: "voce",
    titolo: "3. Prova la voce",
    testo: "Detta le lavorazioni: i prezzi restano del tuo listino.",
    to: `${ROUTES.preventiviNuovo}?express=1`,
    cta: "Preventivo vocale",
    Icon: Mic,
  },
  {
    id: "cantiere",
    titolo: "4. Apri un cantiere",
    testo: "Da un preventivo accettato oppure diretto dal cliente.",
    to: ROUTES.cantieri,
    cta: "Cantieri",
    Icon: HardHat,
  },
  {
    id: "economia",
    titolo: "5. Controlla incassi e spese",
    testo: "Pagamenti e spese sul cantiere: saldo sempre chiaro.",
    to: ROUTES.economia,
    cta: "Economia",
    Icon: Wallet,
  },
];

export function leggiOnboardingCompletato() {
  try {
    const v = localStorage.getItem(ONBOARDING_RAPIDO_KEY);
    return v === "done" || v === "skipped";
  } catch {
    return true;
  }
}

export function marcaOnboarding(stato) {
  try {
    localStorage.setItem(ONBOARDING_RAPIDO_KEY, stato);
  } catch {
    /* ignore quota */
  }
}

/**
 * Card Home: 5 passi, ignorabile. Non blocca l'app.
 */
export default function OnboardingRapido({ forzato = false }) {
  const [nascosto, setNascosto] = useState(() =>
    forzato ? false : leggiOnboardingCompletato()
  );
  const [indice, setIndice] = useState(0);

  if (nascosto) return null;

  const step = STEP[indice] || STEP[0];
  const Icon = step.Icon;
  const ultimo = indice >= STEP.length - 1;

  function salta() {
    marcaOnboarding("skipped");
    setNascosto(true);
  }

  function completa() {
    marcaOnboarding("done");
    setNascosto(true);
  }

  function avanti() {
    if (ultimo) {
      completa();
      return;
    }
    setIndice((i) => i + 1);
  }

  return (
    <section
      className="pro-panel p-5 space-y-4"
      data-testid="onboarding-rapido"
      aria-labelledby="onboarding-rapido-title"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="section-label">Inizia in 5 minuti</p>
          <h2 id="onboarding-rapido-title" className="ds-card-title mt-1">
            {step.titolo}
          </h2>
          <p className="ds-text-secondary mt-2">{step.testo}</p>
        </div>
        <button
          type="button"
          onClick={salta}
          className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-[16px] text-slate-400"
          aria-label="Chiudi guida"
          data-testid="onboarding-chiudi"
        >
          <X size={20} aria-hidden="true" />
        </button>
      </div>

      <div className="flex items-center gap-3">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-[16px] bg-yellow-400/15 text-yellow-200 shrink-0">
          <Icon size={22} aria-hidden="true" />
        </span>
        <p className="ds-text-secondary text-sm">
          Passo {indice + 1} di {STEP.length}
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Link
          to={step.to}
          className="btn-primary min-h-[48px] flex-1 inline-flex items-center justify-center gap-2"
          data-testid={`onboarding-cta-${step.id}`}
          onClick={() => {
            if (ultimo) marcaOnboarding("done");
          }}
        >
          {step.cta}
        </Link>
        <button
          type="button"
          onClick={avanti}
          className="btn-secondary min-h-[48px] flex-1"
          data-testid="onboarding-avanti"
        >
          {ultimo ? "Ho capito" : "Avanti"}
        </button>
      </div>

      <button
        type="button"
        onClick={salta}
        className="w-full min-h-[44px] text-sm text-slate-400 underline-offset-2 hover:underline"
        data-testid="onboarding-salta"
      >
        Salta per ora
      </button>
    </section>
  );
}
