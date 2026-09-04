import { MapPinned } from "lucide-react";
import { Link } from "react-router-dom";
import PageWrapper from "../components/PageWrapper";
import PageBackLink from "../components/PageBackLink";
import { ROUTES } from "../app/routes";

/**
 * Modulo non ancora disponibile in RC 1.0.
 * Nessuna CTA operativa: solo informativa + ritorno.
 */
export default function Sopralluogo() {
  return (
    <PageWrapper>
      <div className="pro-page text-white">
        <PageBackLink testId="sopralluogo-back" />

        <section className="pro-panel-strong p-6" aria-labelledby="sopralluogo-title">
          <div className="w-14 h-14 rounded-[14px] bg-yellow-400/20 text-yellow-200 flex items-center justify-center mb-5">
            <MapPinned size={28} aria-hidden="true" />
          </div>
          <span className="inline-flex rounded-full bg-yellow-400/15 px-3 py-1 text-xs font-black uppercase text-yellow-100">
            Disponibile prossimamente
          </span>
          <h1 id="sopralluogo-title" className="text-3xl sm:text-4xl font-black mt-3">
            Sopralluogo
          </h1>
          <p className="text-slate-400 mt-3 max-w-xl">
            Qui potrai preparare appunti, foto e misure prima di trasformarli in
            preventivo. La funzione non è ancora attiva in questa versione.
          </p>
          <Link
            to={ROUTES.dashboard}
            className="btn-secondary inline-flex mt-6 px-5 py-3"
          >
            Torna alla Home
          </Link>
        </section>
      </div>
    </PageWrapper>
  );
}
