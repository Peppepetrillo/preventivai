import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Package,
  Pencil,
  Plus,
} from "lucide-react";

import PageWrapper from "../components/PageWrapper";
import SearchInput from "../components/SearchInput";
import CatalogoMaterialiCategorie from "../features/catalogoMateriali/components/CatalogoMaterialiCategorie";
import CatalogoMaterialiFamigliaCard from "../features/catalogoMateriali/components/CatalogoMaterialiFamigliaCard";
import CatalogoMaterialiVarianteRow from "../features/catalogoMateriali/components/CatalogoMaterialiVarianteRow";
import AccessoriSuggeritiSection from "../features/catalogoMateriali/components/AccessoriSuggeritiSection";
import FamigliaMaterialeSheet from "../features/catalogoMateriali/components/FamigliaMaterialeSheet";
import VarianteMaterialeSheet from "../features/catalogoMateriali/components/VarianteMaterialeSheet";
import { useCatalogoMaterialiUi } from "../features/catalogoMateriali/hooks/useCatalogoMaterialiUi";
import { metaCategoriaMateriale } from "../features/catalogoMateriali/catalogoMaterialiUiMeta";

/**
 * Catalogo Materiali — UI mobile-first (Sprint 13 Step 4).
 * Separato dal Listino prezzi lavorazioni.
 */
export default function CatalogoMateriali() {
  const {
    catalogo,
    categorie,
    famiglieVisibili,
    famigliaAttiva,
    vista,
    ricerca,
    categoriaId,
    messaggio,
    conteggiPerCategoria,
    setMessaggio,
    aggiornaRicerca,
    apriCategoria,
    apriFamiglia,
    indietro,
    creaFamiglia,
    salvaFamiglia,
    toggleAttivaFamiglia,
    eliminaFamiglia,
    creaVariante,
    salvaVariante,
    toggleAttivaVariante,
    eliminaVariante,
  } = useCatalogoMaterialiUi();

  const [sheetFamiglia, setSheetFamiglia] = useState(null); // null | 'nuova' | famiglia
  const [sheetVariante, setSheetVariante] = useState(null); // null | 'nuova' | variante

  const metaCategoria = categoriaId
    ? metaCategoriaMateriale(categoriaId)
    : null;

  const titoloVista = useMemo(() => {
    if (vista === "varianti" && famigliaAttiva) return famigliaAttiva.nome;
    if (vista === "famiglie" && metaCategoria) return metaCategoria.label;
    if (ricerca.trim()) return "Risultati";
    return "Catalogo Materiali";
  }, [vista, famigliaAttiva, metaCategoria, ricerca]);

  const listaVuota = catalogo.length === 0;
  const ricercaSenzaRisultati =
    Boolean(ricerca.trim()) && famiglieVisibili.length === 0;
  const famiglieCategoriaVuote =
    vista === "famiglie" &&
    !ricerca.trim() &&
    famiglieVisibili.length === 0;

  function apriNuovaFamiglia() {
    setSheetFamiglia("nuova");
  }

  function apriModificaFamiglia() {
    if (famigliaAttiva) setSheetFamiglia(famigliaAttiva);
  }

  function apriNuovaVariante() {
    if (famigliaAttiva) setSheetVariante("nuova");
  }

  return (
    <PageWrapper>
      <div className="pro-page text-white">
        <header className="pro-panel-strong px-4 py-4 mb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              {vista !== "categorie" || ricerca.trim() ? (
                <button
                  type="button"
                  onClick={() => {
                    if (ricerca.trim() && vista === "famiglie" && !categoriaId) {
                      aggiornaRicerca("");
                      return;
                    }
                    indietro();
                  }}
                  className="inline-flex items-center gap-1.5 min-h-[44px] -ml-1 px-1 text-slate-300"
                  aria-label="Indietro"
                >
                  <ArrowLeft size={18} aria-hidden="true" />
                  <span className="text-sm font-semibold">Indietro</span>
                </button>
              ) : (
                <p className="section-label">Materiali di cantiere</p>
              )}
              <h1 className="ds-page-title mt-1">{titoloVista}</h1>
              <p className="ds-text-secondary mt-2">
                {vista === "categorie" && !ricerca.trim()
                  ? "Famiglie e varianti riutilizzabili ovunque."
                  : vista === "varianti"
                    ? `${famigliaAttiva?.varianti?.length || 0} varianti · unità ${famigliaAttiva?.unitaDefault || "pz"}`
                    : `${famiglieVisibili.length} materiali`}
              </p>
            </div>
            <span
              className="ds-badge-count shrink-0"
              aria-label={`${catalogo.length} famiglie`}
            >
              {catalogo.length}
            </span>
          </div>
        </header>

        {messaggio ? (
          <div
            className="pro-panel px-3.5 py-3 mb-3 text-sm text-yellow-100 border-yellow-300/30"
            role="status"
          >
            <div className="flex items-start justify-between gap-2">
              <p>{messaggio}</p>
              <button
                type="button"
                onClick={() => setMessaggio("")}
                className="text-xs font-bold text-slate-400 min-h-[44px] px-2 shrink-0"
              >
                Chiudi
              </button>
            </div>
          </div>
        ) : null}

        <SearchInput
          className="mb-3"
          label="Cerca materiale"
          placeholder="Cerca materiale..."
          value={ricerca}
          onChange={(event) => aggiornaRicerca(event.target.value)}
        />

        <div className="mb-3 flex gap-2">
          <button
            type="button"
            onClick={apriNuovaFamiglia}
            className="flex-1 btn-secondary min-h-[48px] px-3 py-3 flex items-center justify-center gap-2 text-sm font-bold"
          >
            <Plus size={18} aria-hidden="true" />
            Nuovo materiale
          </button>
          {vista === "varianti" ? (
            <button
              type="button"
              onClick={apriNuovaVariante}
              className="flex-1 btn-primary min-h-[48px] px-3 py-3 flex items-center justify-center gap-2 text-sm font-bold"
            >
              <Plus size={18} aria-hidden="true" />
              Nuova variante
            </button>
          ) : null}
        </div>

        {vista === "varianti" && famigliaAttiva ? (
          <div className="mb-3">
            <button
              type="button"
              onClick={apriModificaFamiglia}
              className="w-full btn-secondary min-h-[44px] px-4 py-2.5 flex items-center justify-center gap-2 text-sm font-bold"
            >
              <Pencil size={16} aria-hidden="true" />
              Modifica famiglia
            </button>
          </div>
        ) : null}

        {vista === "categorie" && !ricerca.trim() ? (
          <section aria-labelledby="catalogo-categorie-title">
            <h2 id="catalogo-categorie-title" className="sr-only">
              Categorie
            </h2>
            {listaVuota ? (
              <EmptyCatalogo onCrea={apriNuovaFamiglia} />
            ) : (
              <CatalogoMaterialiCategorie
                categorie={categorie}
                conteggi={conteggiPerCategoria}
                onApri={apriCategoria}
              />
            )}
          </section>
        ) : null}

        {vista === "famiglie" || (ricerca.trim() && vista !== "varianti") ? (
          <section aria-labelledby="catalogo-famiglie-title">
            <h2 id="catalogo-famiglie-title" className="sr-only">
              Famiglie
            </h2>

            {ricercaSenzaRisultati || famiglieCategoriaVuote ? (
              <div className="pro-panel px-4 py-6 text-center">
                <p className="ds-card-title">
                  {ricercaSenzaRisultati
                    ? "Nessun risultato"
                    : "Nessun materiale"}
                </p>
                <p className="ds-text-secondary mt-2">
                  {ricercaSenzaRisultati
                    ? "Prova un altro termine o cambia categoria."
                    : "Aggiungi il primo materiale in questa categoria."}
                </p>
              </div>
            ) : (
              <ul className="space-y-2" role="list">
                {famiglieVisibili.map((famiglia) => (
                  <li key={famiglia.id}>
                    <CatalogoMaterialiFamigliaCard
                      famiglia={famiglia}
                      onApri={apriFamiglia}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : null}

        {vista === "varianti" && famigliaAttiva ? (
          <section aria-labelledby="catalogo-varianti-title">
            <h2 id="catalogo-varianti-title" className="sr-only">
              Varianti
            </h2>
            {famigliaAttiva.varianti.length === 0 ? (
              <div className="pro-panel ds-empty">
                <div className="ds-empty-icon" aria-hidden="true">
                  <Package size={28} />
                </div>
                <p className="ds-card-title">Nessuna variante</p>
                <p className="ds-text-secondary mt-2 max-w-sm mx-auto">
                  Aggiungi la prima variante per usare questo materiale.
                </p>
                <button
                  type="button"
                  onClick={apriNuovaVariante}
                  className="btn-primary mt-4 min-h-[48px] px-5 font-bold"
                >
                  Nuova variante
                </button>
              </div>
            ) : (
              <ul className="space-y-2" role="list">
                {famigliaAttiva.varianti.map((variante) => (
                  <li key={variante.id}>
                    <CatalogoMaterialiVarianteRow
                      variante={variante}
                      unitaDefault={famigliaAttiva.unitaDefault}
                      onApri={setSheetVariante}
                    />
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-4">
              <AccessoriSuggeritiSection
                accessori={famigliaAttiva.accessoriSuggeriti}
                catalogo={catalogo}
                readOnly
                nascondiSeVuoto
              />
            </div>
          </section>
        ) : null}

        <FamigliaMaterialeSheet
          open={Boolean(sheetFamiglia)}
          onClose={() => setSheetFamiglia(null)}
          famiglia={
            sheetFamiglia === "nuova"
              ? null
              : catalogo.find((f) => f.id === sheetFamiglia?.id) || sheetFamiglia
          }
          categoriaDefault={categoriaId || "generale"}
          catalogo={catalogo}
          onCrea={creaFamiglia}
          onSalva={salvaFamiglia}
          onElimina={eliminaFamiglia}
          onToggleAttiva={toggleAttivaFamiglia}
        />

        <VarianteMaterialeSheet
          open={Boolean(sheetVariante) && Boolean(famigliaAttiva)}
          onClose={() => setSheetVariante(null)}
          famiglia={famigliaAttiva}
          variante={
            sheetVariante === "nuova"
              ? null
              : famigliaAttiva?.varianti?.find((v) => v.id === sheetVariante?.id) ||
                sheetVariante
          }
          catalogo={catalogo}
          onCrea={creaVariante}
          onSalva={salvaVariante}
          onElimina={eliminaVariante}
          onToggleAttiva={toggleAttivaVariante}
        />
      </div>
    </PageWrapper>
  );
}

function EmptyCatalogo({ onCrea }) {
  return (
    <div className="pro-panel ds-empty">
      <div className="ds-empty-icon" aria-hidden="true">
        <Package size={28} />
      </div>
      <p className="ds-card-title">Catalogo vuoto</p>
      <p className="ds-text-secondary mt-2 max-w-sm mx-auto">
        Aggiungi il primo materiale: famiglie e varianti restano riusabili.
      </p>
      <button
        type="button"
        onClick={onCrea}
        className="btn-primary mt-4 min-h-[48px] px-5 font-bold"
      >
        Nuovo materiale
      </button>
    </div>
  );
}
