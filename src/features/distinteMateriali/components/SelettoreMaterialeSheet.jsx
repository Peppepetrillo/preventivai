import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, CheckCircle, Plus } from "lucide-react";

import BottomSheet from "../../../components/BottomSheet";
import NumericInput from "../../../components/NumericInput";
import SearchInput from "../../../components/SearchInput";
import { cercaCatalogoMateriali, caricaCatalogoMateriali } from "../../../domain/catalogoMateriali/materialiCatalogService";
import { UNITA_MATERIALE_CANONICHE } from "../../../domain/catalogoMateriali/materialiTypes";
import CatalogoMaterialiCategorie from "../../catalogoMateriali/components/CatalogoMaterialiCategorie";
import CatalogoMaterialiFamigliaCard from "../../catalogoMateriali/components/CatalogoMaterialiFamigliaCard";
import CatalogoMaterialiVarianteRow from "../../catalogoMateriali/components/CatalogoMaterialiVarianteRow";
import {
  elencaMetaCategorieMateriale,
  metaCategoriaMateriale,
} from "../../catalogoMateriali/catalogoMaterialiUiMeta";

/**
 * Selettore materiale da catalogo (categorie → famiglia → variante → quantità).
 *
 * `mantieniApertoDopoConferma` (default false):
 *   - false → comportamento classico: chiude il BottomSheet dopo ogni conferma.
 *   - true  → non chiude; torna alla vista varianti della stessa famiglia per
 *             aggiunta rapida consecutiva. Usato dal flusso Cantiere → Materiali.
 */
export default function SelettoreMaterialeSheet({
  open,
  onClose,
  onConferma,
  onApriManuale,
  title = "Aggiungi materiale",
  descrizione = "Scegli dal catalogo o inserisci una voce libera.",
  labelConferma = "Aggiungi alla distinta",
  mantieniApertoDopoConferma = false,
  categoriaSuggerita = null,
  richiediPrezzo = false,
}) {
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={title}
      descrizione={descrizione}
      zIndex={80}
    >
      {open ? (
        <SelettoreForm
          onClose={onClose}
          onConferma={onConferma}
          onApriManuale={onApriManuale}
          labelConferma={labelConferma}
          mantieniApertoDopoConferma={mantieniApertoDopoConferma}
          categoriaSuggerita={categoriaSuggerita}
          richiediPrezzo={richiediPrezzo}
        />
      ) : null}
    </BottomSheet>
  );
}

function SelettoreForm({
  onClose,
  onConferma,
  onApriManuale,
  labelConferma,
  mantieniApertoDopoConferma,
  categoriaSuggerita,
  richiediPrezzo,
}) {
  const catalogo = useMemo(() => caricaCatalogoMateriali(), []);
  const categorie = useMemo(() => {
    const base = elencaMetaCategorieMateriale({ catalogo });
    if (!categoriaSuggerita) return base;
    const suggerita = base.find((c) => c.id === categoriaSuggerita);
    if (!suggerita) return base;
    return [suggerita, ...base.filter((c) => c.id !== categoriaSuggerita)];
  }, [catalogo, categoriaSuggerita]);
  const [ricerca, setRicerca] = useState("");
  const [categoriaId, setCategoriaId] = useState(null);
  const [famiglia, setFamiglia] = useState(null);
  const [variante, setVariante] = useState(null);
  const [quantita, setQuantita] = useState(1);
  const [unita, setUnita] = useState("");
  const [prezzoUnitario, setPrezzoUnitario] = useState("");
  const [errorePrezzo, setErrorePrezzo] = useState("");

  // Feedback aggiunta (solo in modalità mantieniApertoDopoConferma)
  const [feedbackVisbile, setFeedbackVisibile] = useState(false);
  const [feedbackNome, setFeedbackNome] = useState("");
  const [contatoreAggiunte, setContatoreAggiunte] = useState(0);
  const feedbackTimer = useRef(null);

  // Cleanup timer al dismount
  useEffect(() => {
    return () => {
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    };
  }, []);

  const famiglie = useMemo(() => {
    const filtri = { soloAttive: true };
    if (categoriaId) filtri.categoria = categoriaId;
    return cercaCatalogoMateriali(ricerca, filtri);
  }, [ricerca, categoriaId]);

  const vista = variante
    ? "quantita"
    : famiglia
      ? "varianti"
      : categoriaId || ricerca.trim()
        ? "famiglie"
        : "categorie";

  const meta = categoriaId ? metaCategoriaMateriale(categoriaId) : null;

  function indietro() {
    if (variante) {
      setVariante(null);
      return;
    }
    if (famiglia) {
      setFamiglia(null);
      return;
    }
    if (categoriaId) {
      setCategoriaId(null);
      return;
    }
    if (ricerca.trim()) {
      setRicerca("");
    }
  }

  function mostraFeedback(nome) {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    setFeedbackNome(nome);
    setFeedbackVisibile(true);
    feedbackTimer.current = setTimeout(() => setFeedbackVisibile(false), 2200);
  }

  function conferma() {
    if (!variante || !famiglia) return;

    const q = Number(quantita);
    const prezzoNum = Number(prezzoUnitario);
    const haPrezzoCatalogo =
      variante.prezzoIndicativo != null &&
      Number.isFinite(Number(variante.prezzoIndicativo));
    const prezzoFinale = richiediPrezzo
      ? prezzoNum
      : haPrezzoCatalogo
        ? Number(variante.prezzoIndicativo)
        : prezzoNum;

    if (
      richiediPrezzo &&
      (!Number.isFinite(prezzoFinale) || prezzoFinale <= 0)
    ) {
      setErrorePrezzo("Inserisci un prezzo unitario valido.");
      return;
    }

    setErrorePrezzo("");
    const payload = {
      famigliaId: famiglia.id,
      varianteId: variante.id,
      nome: `${famiglia.nome} — ${variante.etichetta}`,
      unita: unita || variante.unita || famiglia.unitaDefault || "pz",
      quantita: Number.isFinite(q) && q > 0 ? q : 1,
      prezzoUnitario: Number.isFinite(prezzoFinale) ? prezzoFinale : undefined,
      prezzoCatalogoOriginale: haPrezzoCatalogo
        ? Number(variante.prezzoIndicativo)
        : undefined,
    };

    onConferma?.(payload);

    if (mantieniApertoDopoConferma) {
      // Resta aperto: torna alle varianti della stessa famiglia per aggiunta rapida.
      mostraFeedback(`${famiglia.nome} — ${variante.etichetta}`);
      setContatoreAggiunte((n) => n + 1);
      setVariante(null);
      setQuantita(1);
      setPrezzoUnitario("");
    } else {
      onClose?.();
    }
  }

  const mostraIndietro =
    vista !== "categorie" || Boolean(ricerca.trim());

  return (
    <div className="space-y-3 pb-2">
      {/* Barra superiore: indietro + badge contatore aggiunte */}
      <div className="flex items-center justify-between gap-2">
        {mostraIndietro ? (
          <button
            type="button"
            onClick={indietro}
            className="inline-flex items-center gap-1.5 min-h-[44px] text-slate-300 text-sm font-semibold"
          >
            <ArrowLeft size={18} aria-hidden="true" />
            Indietro
          </button>
        ) : (
          <div />
        )}
        {mantieniApertoDopoConferma && contatoreAggiunte > 0 ? (
          <span className="ds-badge ds-badge-completato shrink-0">
            {contatoreAggiunte} {contatoreAggiunte === 1 ? "aggiunto" : "aggiunti"}
          </span>
        ) : null}
      </div>

      {/* Toast feedback aggiunta */}
      {mantieniApertoDopoConferma && feedbackVisbile ? (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center gap-2 rounded-[14px] border border-emerald-400/25 bg-emerald-500/15 px-3.5 py-2.5"
        >
          <CheckCircle size={16} className="text-emerald-300 shrink-0" aria-hidden="true" />
          <p className="text-sm text-emerald-50 font-semibold truncate">
            {feedbackNome}
          </p>
        </div>
      ) : null}

      {/* Bottone "Cambia categoria" nella vista varianti (modalità rapida) */}
      {mantieniApertoDopoConferma && vista === "varianti" && famiglia ? (
        <button
          type="button"
          onClick={() => {
            setFamiglia(null);
            setCategoriaId(null);
          }}
          className="inline-flex items-center gap-1.5 min-h-[40px] text-slate-400 text-xs font-semibold"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          Cambia categoria
        </button>
      ) : null}

      {vista !== "quantita" ? (
        <SearchInput
          label="Cerca materiale"
          placeholder="Cerca materiale..."
          value={ricerca}
          onChange={(e) => {
            setRicerca(e.target.value);
            setFamiglia(null);
            setVariante(null);
          }}
        />
      ) : null}

      {typeof onApriManuale === "function" ? (
        <button
          type="button"
          onClick={() => {
            onApriManuale();
            onClose?.();
          }}
          className="w-full btn-secondary min-h-[48px] flex items-center justify-center gap-2 text-sm font-bold"
        >
          <Plus size={18} aria-hidden="true" />
          Voce libera
        </button>
      ) : null}

      {vista === "categorie" ? (
        <CatalogoMaterialiCategorie
          categorie={categorie}
          conteggi={Object.fromEntries(
            categorie.map((c) => [
              c.id,
              cercaCatalogoMateriali("", {
                categoria: c.id,
                soloAttive: true,
              }).length,
            ])
          )}
          onApri={(id) => {
            setCategoriaId(id);
            setFamiglia(null);
            setVariante(null);
          }}
        />
      ) : null}

      {vista === "famiglie" ? (
        <div className="space-y-2">
          <p className="ds-text-secondary text-xs font-bold uppercase tracking-wide">
            {ricerca.trim() ? "Risultati" : meta?.label || "Famiglie"}
          </p>
          {famiglie.length === 0 ? (
            <p className="ds-text-secondary text-sm px-1 py-4 text-center">
              Nessun materiale trovato.
            </p>
          ) : (
            <ul className="space-y-2" role="list">
              {famiglie.map((f) => (
                <li key={f.id}>
                  <CatalogoMaterialiFamigliaCard
                    famiglia={f}
                    onApri={() => {
                      setFamiglia(f);
                      setVariante(null);
                      setUnita(f.unitaDefault || "pz");
                    }}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {vista === "varianti" && famiglia ? (
        <div className="space-y-2">
          <p className="ds-card-title">{famiglia.nome}</p>
          <ul className="space-y-2" role="list">
            {famiglia.varianti
              .filter((v) => v.attiva !== false)
              .map((v) => (
                <li key={v.id}>
                  <CatalogoMaterialiVarianteRow
                    variante={v}
                    unitaDefault={famiglia.unitaDefault}
                    onApri={(sel) => {
                      setVariante(sel);
                      setUnita(sel.unita || famiglia.unitaDefault || "pz");
                      setQuantita(1);
                      const prezzoCat = sel.prezzoIndicativo;
                      if (
                        prezzoCat != null &&
                        Number.isFinite(Number(prezzoCat))
                      ) {
                        setPrezzoUnitario(Number(prezzoCat));
                      } else {
                        setPrezzoUnitario("");
                      }
                      setErrorePrezzo("");
                    }}
                  />
                </li>
              ))}
          </ul>
        </div>
      ) : null}

      {vista === "quantita" && variante && famiglia ? (
        <div className="space-y-4">
          <div className="pro-panel px-4 py-3">
            <p className="ds-card-title">
              {famiglia.nome} — {variante.etichetta}
            </p>
            <p className="ds-text-secondary text-sm mt-1">
              Conferma quantità{richiediPrezzo ? ", prezzo e unità" : " e unità"}
            </p>
          </div>

          <label className="block">
            <span className="ds-text-secondary text-xs font-bold uppercase tracking-wide">
              Quantità
            </span>
            <NumericInput
              className="mt-1.5 w-full min-h-[48px] rounded-[16px] border border-white/10 bg-black/30 px-4 text-white"
              value={quantita}
              onChange={(v) => setQuantita(v)}
              min={0}
            />
          </label>

          {richiediPrezzo ? (
            <label className="block">
              <span className="ds-text-secondary text-xs font-bold uppercase tracking-wide">
                Prezzo/{unita || "unità"}
              </span>
              <NumericInput
                className="mt-1.5 w-full min-h-[48px] rounded-[16px] border border-white/10 bg-black/30 px-4 text-white"
                value={prezzoUnitario}
                onChange={(v) => {
                  setPrezzoUnitario(v);
                  setErrorePrezzo("");
                }}
                min={0}
                inputMode="decimal"
              />
              {variante.prezzoIndicativo != null &&
              Number.isFinite(Number(variante.prezzoIndicativo)) ? (
                <p className="ds-text-secondary text-xs mt-1">
                  Prezzo catalogo: {Number(variante.prezzoIndicativo).toFixed(2)} €
                  (modificabile solo per questa voce)
                </p>
              ) : (
                <p className="ds-text-secondary text-xs mt-1">
                  Prezzo non configurato nel catalogo: inseriscilo manualmente.
                </p>
              )}
              {errorePrezzo ? (
                <p className="text-red-300 text-xs mt-1" role="alert">
                  {errorePrezzo}
                </p>
              ) : null}
            </label>
          ) : null}

          <label className="block">
            <span className="ds-text-secondary text-xs font-bold uppercase tracking-wide">
              Unità
            </span>
            <select
              className="mt-1.5 w-full min-h-[48px] rounded-[16px] border border-white/10 bg-black/30 px-3 text-base text-white"
              value={unita}
              onChange={(e) => setUnita(e.target.value)}
            >
              {UNITA_MATERIALE_CANONICHE.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={conferma}
            className="btn-primary w-full min-h-[52px] font-black"
          >
            {labelConferma}
          </button>
        </div>
      ) : null}
    </div>
  );
}
