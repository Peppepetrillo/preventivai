import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, ClipboardList, Plus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import PageWrapper from "../components/PageWrapper";
import { ROUTES } from "../app/routes";
import DistintaCard from "../features/distinteMateriali/components/DistintaCard";
import {
  caricaDistinteMateriali,
  duplicaDistintaMateriali,
  eliminaDistintaMateriali,
} from "../domain/distinteMateriali/distintaMaterialiService";

/**
 * Elenco Distinte Materiali — indipendenti dal preventivo (Sprint 13 Step 5).
 */
export default function DistinteMateriali() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [messaggio, setMessaggio] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);

  const ricarica = useCallback(() => {
    setItems(caricaDistinteMateriali());
  }, []);

  useEffect(() => {
    ricarica();
  }, [ricarica]);

  function flash(msg) {
    setMessaggio(msg);
    window.setTimeout(() => setMessaggio(""), 2200);
  }

  function apri(id) {
    navigate(ROUTES.distintaMateriali.replace(":id", id));
  }

  function duplica(id) {
    const copia = duplicaDistintaMateriali(id);
    if (!copia) {
      flash("Impossibile duplicare.");
      return;
    }
    flash("Distinta duplicata.");
    ricarica();
    navigate(ROUTES.distintaMateriali.replace(":id", copia.id));
  }

  function elimina(id) {
    const ok = eliminaDistintaMateriali(id);
    setConfirmDelete(null);
    if (!ok) {
      flash("Impossibile eliminare.");
      return;
    }
    flash("Distinta eliminata.");
    ricarica();
  }

  const vuoto = items.length === 0;

  return (
    <PageWrapper>
      <div className="pro-page text-white">
        <header className="pro-panel-strong px-4 py-4 mb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <Link
                to={ROUTES.impostazioni}
                className="inline-flex items-center gap-1.5 min-h-[44px] -ml-1 px-1 text-slate-300"
                aria-label="Indietro"
              >
                <ArrowLeft size={18} aria-hidden="true" />
                <span className="text-sm font-semibold">Indietro</span>
              </Link>
              <h1 className="ds-page-title mt-1">Distinte materiali</h1>
              <p className="ds-text-secondary mt-2">
                Liste materiali indipendenti, collegabili dopo a cliente e cantiere.
              </p>
            </div>
            <span
              className="ds-badge-count shrink-0"
              aria-label={`${items.length} distinte`}
            >
              {items.length}
            </span>
          </div>
        </header>

        {messaggio ? (
          <div
            className="pro-panel px-3.5 py-3 mb-3 text-sm text-yellow-100 border-yellow-300/30"
            role="status"
          >
            {messaggio}
          </div>
        ) : null}

        <div className="mb-4">
          <button
            type="button"
            onClick={() => navigate(ROUTES.nuovaDistintaMateriali)}
            className="btn-primary w-full min-h-[52px] font-bold flex items-center justify-center gap-2"
            data-testid="distinte-nuova"
          >
            <Plus size={18} aria-hidden="true" />
            Nuova distinta
          </button>
        </div>

        {vuoto ? (
          <div
            className="ds-empty pro-panel px-4 py-10 text-center"
            data-testid="distinte-empty"
          >
            <ClipboardList
              className="mx-auto mb-3 text-slate-500"
              size={36}
              aria-hidden="true"
            />
            <p className="ds-card-title">Nessuna distinta</p>
            <p className="ds-text-secondary mt-2">
              Crea la prima distinta materiali per un lavoro.
            </p>
            <button
              type="button"
              onClick={() => navigate(ROUTES.nuovaDistintaMateriali)}
              className="btn-primary mt-5 inline-flex min-h-[48px] items-center gap-2 px-5 font-bold"
            >
              <Plus size={18} aria-hidden="true" />
              Nuova distinta
            </button>
          </div>
        ) : (
          <ul className="space-y-3" role="list" data-testid="distinte-list">
            {items.map((d) => (
              <li key={d.id}>
                <DistintaCard
                  distinta={d}
                  onApri={apri}
                  onDuplica={duplica}
                  onElimina={(id) => {
                    const found = items.find((x) => x.id === id);
                    setConfirmDelete(found || { id, titolo: "" });
                  }}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      {confirmDelete ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="distinte-delete-title"
        >
          <div className="pro-panel-strong w-full max-w-md p-5">
            <p id="distinte-delete-title" className="ds-card-title">
              Elimina distinta?
            </p>
            <p className="ds-text-secondary mt-2">
              «{confirmDelete.titolo || "Senza titolo"}» verrà eliminata. L&apos;azione
              non si può annullare.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="btn-secondary min-h-[48px] flex-1 font-bold"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={() => elimina(confirmDelete.id)}
                className="btn-danger min-h-[48px] flex-1 font-bold"
                data-testid="distinte-confirm-delete"
              >
                Elimina
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </PageWrapper>
  );
}
