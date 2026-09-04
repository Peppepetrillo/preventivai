import { useMemo, useState } from "react";
import { BookOpen, Plus, Star } from "lucide-react";

import PageWrapper from "../components/PageWrapper";
import PageBackLink from "../components/PageBackLink";
import SearchInput from "../components/SearchInput";
import RigaVoceCatalogo from "../features/listino/components/RigaVoceCatalogo";
import VoceCatalogoSheet from "../features/listino/components/VoceCatalogoSheet";
import { useListinoCatalogo } from "../features/listino/hooks/useListinoCatalogo";
import { LISTINI_CATALOGHI } from "../features/listino/listinoCatalogDomain";

/**
 * Listino professionale — catalogo lavorazioni (Sprint 12A).
 * Flusso: Ricerca → Preferiti → Categorie → Lavorazioni.
 * Indipendente dal dominio preventivi.
 */
export default function Listino() {
  const {
    catalogo,
    preferiti,
    categorie,
    lavorazioniVisibili,
    ricerca,
    categoriaAttiva,
    messaggio,
    setMessaggio,
    aggiornaRicerca,
    setCategoriaAttiva,
    salvaVoce,
    aggiungiVoce,
    eliminaVoce,
    toggleAttiva,
    togglePreferita,
  } = useListinoCatalogo();

  const [voceInModifica, setVoceInModifica] = useState(null);
  const [sheetNuova, setSheetNuova] = useState(false);

  const sheetAperto = sheetNuova || Boolean(voceInModifica);

  const preferitiVisibili = useMemo(() => {
    if (ricerca.trim()) return [];
    if (categoriaAttiva !== "tutte") {
      return preferiti.filter((v) => v.categoria === categoriaAttiva);
    }
    return preferiti;
  }, [preferiti, ricerca, categoriaAttiva]);

  const preferitiIds = useMemo(
    () => new Set(preferitiVisibili.map((v) => String(v.id))),
    [preferitiVisibili]
  );

  const lavorazioniSenzaPreferiti = useMemo(() => {
    if (preferitiIds.size === 0) return lavorazioniVisibili;
    return lavorazioniVisibili.filter(
      (voce) => !preferitiIds.has(String(voce.id))
    );
  }, [lavorazioniVisibili, preferitiIds]);

  const listaVuota = catalogo.length === 0;
  const ricercaSenzaRisultati =
    !listaVuota &&
    lavorazioniVisibili.length === 0 &&
    Boolean(ricerca.trim());
  const sezioneLavorazioniVuota =
    !listaVuota &&
    !ricercaSenzaRisultati &&
    lavorazioniSenzaPreferiti.length === 0 &&
    preferitiVisibili.length > 0;

  function chiudiSheet() {
    setSheetNuova(false);
    setVoceInModifica(null);
  }

  function gestisciCrea(payload) {
    const creata = aggiungiVoce(payload);
    return Boolean(creata);
  }

  return (
    <PageWrapper>
      <div className="pro-page text-white">
        <header className="pro-panel-strong px-4 py-4 mb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <PageBackLink
                className="inline-flex items-center gap-1.5 min-h-[44px] -ml-1 px-1 text-slate-300"
                testId="listino-link-impostazioni"
              />
              <p className="section-label mt-1">Catalogo cantiere</p>
              <h1 className="ds-page-title mt-1">Listino</h1>
              <p className="ds-text-secondary mt-2">
                {LISTINI_CATALOGHI.preventivaiBase.label} — cerca, preferiti,
                prezzi.
              </p>
            </div>
            <span
              className="ds-badge-count shrink-0"
              aria-label={`${catalogo.length} lavorazioni`}
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
          label="Cerca lavorazione"
          placeholder="Nome, categoria o unità"
          value={ricerca}
          onChange={(event) => aggiornaRicerca(event.target.value)}
        />

        <div className="mb-3">
          <button
            type="button"
            onClick={() => {
              setVoceInModifica(null);
              setSheetNuova(true);
            }}
            className="w-full btn-secondary min-h-[48px] px-4 py-3 flex items-center justify-center gap-2 text-sm font-bold"
          >
            <Plus size={18} aria-hidden="true" />
            Nuova lavorazione
          </button>
        </div>

        {preferitiVisibili.length > 0 ? (
          <section className="mb-4" aria-labelledby="listino-preferiti">
            <div className="flex items-center gap-2.5 mb-2.5">
              <Star
                size={18}
                className="text-yellow-300 shrink-0 fill-yellow-300"
                aria-hidden="true"
              />
              <h2 id="listino-preferiti" className="ds-section-title">
                Preferiti
              </h2>
            </div>
            <ul className="space-y-1.5" role="list">
              {preferitiVisibili.map((voce) => (
                <li key={`pref-${voce.id}`}>
                  <RigaVoceCatalogo
                    voce={voce}
                    onApri={setVoceInModifica}
                    onToggleAttiva={toggleAttiva}
                    onTogglePreferita={togglePreferita}
                  />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <div
          className="flex gap-2 mb-3 overflow-x-auto pb-0.5"
          role="tablist"
          aria-label="Categorie listino"
        >
          <button
            type="button"
            role="tab"
            aria-selected={categoriaAttiva === "tutte"}
            onClick={() => setCategoriaAttiva("tutte")}
            className={`ds-chip ${
              categoriaAttiva === "tutte" ? "ds-chip-active" : ""
            }`}
          >
            Tutte
          </button>
          {categorie.map((cat) => {
            const attiva = categoriaAttiva === cat;
            return (
              <button
                key={cat}
                type="button"
                role="tab"
                aria-selected={attiva}
                onClick={() => setCategoriaAttiva(cat)}
                className={`ds-chip ${attiva ? "ds-chip-active" : ""}`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        <section aria-labelledby="listino-lavorazioni">
          <div className="flex items-center gap-2.5 mb-2.5">
            <BookOpen
              size={20}
              className="text-yellow-300 shrink-0"
              aria-hidden="true"
            />
            <h2 id="listino-lavorazioni" className="ds-section-title">
              Lavorazioni
            </h2>
          </div>

          {listaVuota ? (
            <div className="pro-panel ds-empty">
              <div className="ds-empty-icon" aria-hidden="true">
                <BookOpen size={28} />
              </div>
              <p className="ds-card-title">Catalogo vuoto</p>
              <p className="ds-text-secondary mt-2 max-w-sm mx-auto">
                Aggiungi la prima lavorazione: la ritroverai nei preventivi.
              </p>
            </div>
          ) : null}

          {ricercaSenzaRisultati ? (
            <div className="pro-panel px-4 py-6 text-center">
              <p className="ds-card-title">Nessun risultato</p>
              <p className="ds-text-secondary mt-2">
                Prova un altro termine o cambia categoria.
              </p>
            </div>
          ) : null}

          {sezioneLavorazioniVuota ? (
            <p className="ds-text-secondary text-sm px-1 py-2">
              Tutte le voci di questa vista sono già nei preferiti.
            </p>
          ) : null}

          {!listaVuota &&
          !ricercaSenzaRisultati &&
          lavorazioniSenzaPreferiti.length > 0 ? (
            <ul className="space-y-1.5" role="list">
              {lavorazioniSenzaPreferiti.map((voce) => (
                <li key={voce.id}>
                  <RigaVoceCatalogo
                    voce={voce}
                    onApri={setVoceInModifica}
                    onToggleAttiva={toggleAttiva}
                    onTogglePreferita={togglePreferita}
                  />
                </li>
              ))}
            </ul>
          ) : null}
        </section>

        <VoceCatalogoSheet
          open={sheetAperto}
          onClose={chiudiSheet}
          voce={voceInModifica}
          categorie={categorie}
          onSalva={salvaVoce}
          onCrea={gestisciCrea}
          onElimina={eliminaVoce}
        />
      </div>
    </PageWrapper>
  );
}
