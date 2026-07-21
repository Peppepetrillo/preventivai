import { useMemo } from "react";
import { useParams } from "react-router-dom";

import PageWrapper from "../components/PageWrapper";
import CantiereOverview from "../features/cantieri/components/CantiereOverview";
import { leggiCantieri } from "../repositories/cantieriRepository";

export default function Cantiere() {
  const { id } = useParams();

  const cantiere = useMemo(
    () =>
      leggiCantieri().find((item) => String(item.id) === String(id)) ?? null,
    [id]
  );

  if (!cantiere) {
    return (
      <PageWrapper>
        <div className="pro-page text-white min-h-[60vh] flex items-center justify-center">
          <div className="pro-panel p-6 text-center">
            <p className="text-xl font-black">Cantiere non trovato</p>
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="pro-page text-white">
        <CantiereOverview cantiere={cantiere} />
      </div>
    </PageWrapper>
  );
}
