import {
  ArrowLeftRight,
  Battery,
  Cable,
  ChevronRight,
  Home,
  Plug,
  Ruler,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";

import PageWrapper from "../components/PageWrapper";
import PageBackLink from "../components/PageBackLink";
import { ROUTES } from "../app/routes";
import { CALCOLATORI } from "../features/calcoliElettrici/catalog";

const ICONS = {
  Zap,
  Plug,
  Ruler,
  Cable,
  Battery,
  ArrowLeftRight,
  Home,
};

export default function CalcoliElettrici() {
  return (
    <PageWrapper>
      <div className="pro-page text-white">
        <PageBackLink testId="calcoli-elettrici-back" />

        <div className="pro-panel-strong p-5 mb-6">
          <p className="section-label">Field tool</p>
          <h1 className="ds-page-title mt-1">Calcoli elettrici</h1>
          <p className="ds-text-secondary mt-2">
            Strumenti rapidi per il lavoro
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {CALCOLATORI.map((voce) => {
            const Icon = ICONS[voce.icon] || Zap;
            const path = ROUTES[voce.pathKey];
            return (
              <Link
                key={voce.id}
                to={path}
                className="pro-panel p-5 flex items-center gap-4 min-h-[72px]"
                data-testid={`calcoli-link-${voce.id}`}
              >
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-[16px] bg-yellow-400/15 text-yellow-300 shrink-0">
                  <Icon size={24} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="ds-card-title">{voce.titolo}</p>
                  <p className="ds-text-secondary text-sm mt-1">
                    {voce.sottotitolo}
                  </p>
                </div>
                <ChevronRight
                  size={20}
                  className="text-slate-500 shrink-0"
                  aria-hidden="true"
                />
              </Link>
            );
          })}
        </div>

        <p className="mt-6 text-xs text-slate-500 leading-relaxed">
          Calcoli matematici offline. Non sostituiscono verifica progettuale o
          normativa. Nessun salvataggio automatico.
        </p>
      </div>
    </PageWrapper>
  );
}
