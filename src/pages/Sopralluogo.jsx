import { MapPinned } from "lucide-react";
import { Link } from "react-router-dom";
import PageWrapper from "../components/PageWrapper";
import { ROUTES } from "../app/routes";

export default function Sopralluogo() {
  return (
    <PageWrapper>
      <div className="pro-page text-white pb-24">
        <Link to={ROUTES.dashboard} className="text-slate-400 mb-5 inline-block">
          Home
        </Link>

        <section className="pro-panel-strong p-6">
          <div className="w-14 h-14 rounded-[14px] bg-yellow-400 text-slate-950 flex items-center justify-center mb-5">
            <MapPinned size={28} />
          </div>
          <span className="inline-flex rounded-full bg-yellow-400/15 px-3 py-1 text-xs font-black uppercase text-yellow-100">
            Prossimamente
          </span>
          <h1 className="text-3xl sm:text-4xl font-black mt-1">Sopralluogo</h1>
          <p className="text-slate-400 mt-3 max-w-xl">
            Qui potrai preparare appunti, foto e misure prima di trasformarli in preventivo.
          </p>
        </section>
      </div>
    </PageWrapper>
  );
}
