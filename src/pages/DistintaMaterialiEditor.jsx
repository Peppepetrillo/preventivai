import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Link2, Plus, Share2 } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";

import BottomSheet from "../components/BottomSheet";
import PageWrapper from "../components/PageWrapper";
import { ROUTES } from "../app/routes";
import CollegaCantiereSheet from "../features/distinteMateriali/components/CollegaCantiereSheet";
import DistintaCondividiSheet from "../features/distinteMateriali/components/DistintaCondividiSheet";
import DistintaVoceRow from "../features/distinteMateriali/components/DistintaVoceRow";
import SelettoreMaterialeSheet from "../features/distinteMateriali/components/SelettoreMaterialeSheet";
import SuggerimentiAccessoriSheet from "../features/distinteMateriali/components/SuggerimentiAccessoriSheet";
import VoceDistintaSheet from "../features/distinteMateriali/components/VoceDistintaSheet";
import { caricaCatalogoMateriali } from "../domain/catalogoMateriali/materialiCatalogService";
import {
  costruisciVociAccessoriSuggeriti,
  elencaSuggerimentiAccessoriPerVoce,
} from "../domain/distinteMateriali/distintaMaterialiDomain";
import {
  aggiornaDistintaMateriali,
  creaDistintaMateriali,
  trovaDistintaPerId,
} from "../domain/distinteMateriali/distintaMaterialiService";
import {
  collegaESincronizzaDistintaACantiere,
  elencaCantieriPerCollegamento,
  risincronizzaDistintaSeCollegata,
  scollegaDistintaDaCantiereSoft,
} from "../domain/distinteMateriali/distintaCantiereService";
import { normalizzaUnitaMateriale } from "../domain/catalogoMateriali/materialiTypes";

function emptyDraft() {
  return {
    titolo: "",
    clienteNome: "",
    note: "",
    voci: [],
  };
}

/**
 * Editor Distinta Materiali — nuova / modifica (Sprint 13 Step 5).
 */
export default function DistintaMaterialiEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNuova = !id || id === "nuova";

  const [draft, setDraft] = useState(emptyDraft);
  const [distintaId, setDistintaId] = useState(isNuova ? null : id);
  const [errore, setErrore] = useState("");
  const [messaggio, setMessaggio] = useState("");
  const [nonTrovata, setNonTrovata] = useState(false);

  const [showSelettore, setShowSelettore] = useState(false);
  const [showManuale, setShowManuale] = useState(false);
  const [showAggiungiMenu, setShowAggiungiMenu] = useState(false);
  const [editingVoce, setEditingVoce] = useState(null);
  const [showCondividi, setShowCondividi] = useState(false);
  const [savedDistinta, setSavedDistinta] = useState(null);
  const [showCollegaCantiere, setShowCollegaCantiere] = useState(false);
  const [cantieriDisponibili, setCantieriDisponibili] = useState([]);
  const [suggerimentiSession, setSuggerimentiSession] = useState(null);

  const catalogo = useMemo(() => caricaCatalogoMateriali(), []);

  useEffect(() => {
    if (isNuova) {
      setDraft(emptyDraft());
      setDistintaId(null);
      setNonTrovata(false);
      setSavedDistinta(null);
      return;
    }
    const d = trovaDistintaPerId(id);
    if (!d) {
      setNonTrovata(true);
      setDraft(emptyDraft());
      return;
    }
    setNonTrovata(false);
    setDistintaId(d.id);
    setSavedDistinta(d);
    setDraft({
      titolo: d.titolo || "",
      clienteNome: d.clienteNome || "",
      note: d.note || "",
      voci: Array.isArray(d.voci) ? d.voci : [],
    });
  }, [id, isNuova]);

  useEffect(() => {
    setCantieriDisponibili(elencaCantieriPerCollegamento());
  }, [showCollegaCantiere, savedDistinta?.collegamenti?.cantiereId]);

  const flash = useCallback((msg) => {
    setMessaggio(msg);
    window.setTimeout(() => setMessaggio(""), 2200);
  }, []);

  const buildPayload = useCallback(() => {
    const titolo = String(draft.titolo || "").trim() || "Distinta senza titolo";
    return {
      titolo,
      clienteNome: String(draft.clienteNome || "").trim() || undefined,
      note: String(draft.note || "").trim() || undefined,
      voci: (draft.voci || []).map((v) => ({
        id: v.id,
        famigliaId: v.famigliaId,
        varianteId: v.varianteId,
        nome: v.nome,
        quantita: Number(v.quantita) || 0,
        unita: normalizzaUnitaMateriale(v.unita) || "pz",
        prezzoUnitario: v.prezzoUnitario,
        note: v.note,
        parentVoceId: v.parentVoceId,
        origineAccessorio: v.origineAccessorio,
      })),
    };
  }, [draft]);

  const distintaPerCondivisione = useMemo(() => {
    if (savedDistinta) {
      return {
        ...savedDistinta,
        ...buildPayload(),
        id: savedDistinta.id,
      };
    }
    return {
      ...buildPayload(),
      id: distintaId || "draft",
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
  }, [savedDistinta, buildPayload, distintaId]);

  function handleSave() {
    setErrore("");
    const payload = buildPayload();
    try {
      if (isNuova || !distintaId) {
        const created = creaDistintaMateriali(payload);
        if (!created) {
          setErrore("Impossibile creare la distinta.");
          return;
        }
        setSavedDistinta(created);
        setDistintaId(created.id);
        flash("Distinta creata.");
        navigate(ROUTES.distintaMateriali.replace(":id", created.id), {
          replace: true,
        });
        return;
      }
      const updated = aggiornaDistintaMateriali(distintaId, payload);
      if (!updated) {
        setErrore("Impossibile salvare la distinta.");
        return;
      }
      const sync = risincronizzaDistintaSeCollegata(updated.id);
      const finale = sync.ok && sync.distinta ? sync.distinta : updated;
      setSavedDistinta(finale);
      setDraft({
        titolo: finale.titolo || "",
        clienteNome: finale.clienteNome || "",
        note: finale.note || "",
        voci: Array.isArray(finale.voci) ? finale.voci : [],
      });
      flash(sync.ok ? "Salvata e sincronizzata sul cantiere." : "Salvata.");
    } catch (e) {
      setErrore(e?.message || "Errore salvataggio");
    }
  }

  function assicuratiSalvata() {
    const payload = buildPayload();
    if (isNuova || !distintaId) {
      const created = creaDistintaMateriali(payload);
      if (!created) return null;
      setSavedDistinta(created);
      setDistintaId(created.id);
      navigate(ROUTES.distintaMateriali.replace(":id", created.id), {
        replace: true,
      });
      return created;
    }
    const updated = aggiornaDistintaMateriali(distintaId, payload);
    if (!updated) return null;
    setSavedDistinta(updated);
    return updated;
  }

  function gestisciCollegaCantiere(cantiereId) {
    setErrore("");
    try {
      const salvata = assicuratiSalvata();
      if (!salvata) {
        setErrore("Salva la distinta prima di collegarla.");
        return;
      }
      const risultato = collegaESincronizzaDistintaACantiere(
        salvata.id,
        cantiereId
      );
      if (!risultato.ok) {
        setErrore("Impossibile collegare al cantiere.");
        return;
      }
      setSavedDistinta(risultato.distinta);
      setShowCollegaCantiere(false);
      flash("Collegata al cantiere e materiali proiettati.");
    } catch (e) {
      setErrore(e?.message || "Errore collegamento");
    }
  }

  function gestisciScollegaCantiere() {
    if (!distintaId) return;
    const risultato = scollegaDistintaDaCantiereSoft(distintaId);
    if (risultato.ok) {
      setSavedDistinta(risultato.distinta);
      flash("Distinta scollegata (materiali cantiere mantenuti).");
    }
    setShowCollegaCantiere(false);
  }

  function addVoce(voce) {
    const idVoce =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `voce-${Date.now()}`;
    const nuova = { ...voce, id: voce.id || idVoce };
    setDraft((prev) => ({
      ...prev,
      voci: [...(prev.voci || []), nuova],
    }));
    return nuova;
  }

  function addVoceDaCatalogo(voce) {
    const nuova = addVoce(voce);
    const suggerimenti = elencaSuggerimentiAccessoriPerVoce(nuova, catalogo, {
      vociEsistenti: [...(draft.voci || []), nuova],
    });
    if (suggerimenti.length > 0) {
      setSuggerimentiSession({ parent: nuova, items: suggerimenti });
    }
    flash("Materiale aggiunto.");
  }

  function confermaSuggerimenti(selezionati) {
    const parent = suggerimentiSession?.parent;
    if (!parent?.id || !Array.isArray(selezionati) || selezionati.length === 0) {
      setSuggerimentiSession(null);
      return;
    }
    const vociAccessori = costruisciVociAccessoriSuggeriti(
      parent,
      selezionati,
      catalogo
    );
    if (vociAccessori.length === 0) {
      setSuggerimentiSession(null);
      return;
    }
    setDraft((prev) => ({
      ...prev,
      voci: [...(prev.voci || []), ...vociAccessori],
    }));
    setSuggerimentiSession(null);
    flash(
      vociAccessori.length === 1
        ? "Accessorio aggiunto."
        : `${vociAccessori.length} accessori aggiunti.`
    );
  }

  function updateVoce(voceId, patch) {
    setDraft((prev) => ({
      ...prev,
      voci: (prev.voci || []).map((v) =>
        v.id === voceId ? { ...v, ...patch, id: voceId } : v
      ),
    }));
  }

  function removeVoce(voceId) {
    setDraft((prev) => ({
      ...prev,
      voci: (prev.voci || []).filter((v) => v.id !== voceId),
    }));
  }

  function openCondividi() {
    setErrore("");
    const payload = buildPayload();
    try {
      if (isNuova || !distintaId) {
        const created = creaDistintaMateriali(payload);
        if (!created) {
          setErrore("Salva prima di condividere.");
          return;
        }
        setSavedDistinta(created);
        setDistintaId(created.id);
        navigate(ROUTES.distintaMateriali.replace(":id", created.id), {
          replace: true,
        });
      } else {
        const updated = aggiornaDistintaMateriali(distintaId, payload);
        if (!updated) {
          setErrore("Salva prima di condividere.");
          return;
        }
        setSavedDistinta(updated);
      }
      setShowCondividi(true);
    } catch (e) {
      setErrore(e?.message || "Salva prima di condividere");
    }
  }

  if (nonTrovata) {
    return (
      <PageWrapper>
        <div className="pro-page text-white">
          <header className="pro-panel-strong px-4 py-4 mb-4">
            <Link
              to={ROUTES.distinteMateriali}
              className="inline-flex items-center gap-1.5 min-h-[44px] -ml-1 px-1 text-slate-300"
            >
              <ArrowLeft size={18} aria-hidden="true" />
              <span className="text-sm font-semibold">Indietro</span>
            </Link>
            <h1 className="ds-page-title mt-1">Distinta non trovata</h1>
          </header>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="pro-page text-white pb-24">
        <header className="pro-panel-strong px-4 py-4 mb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <Link
                to={ROUTES.distinteMateriali}
                className="inline-flex items-center gap-1.5 min-h-[44px] -ml-1 px-1 text-slate-300"
                aria-label="Indietro"
              >
                <ArrowLeft size={18} aria-hidden="true" />
                <span className="text-sm font-semibold">Indietro</span>
              </Link>
              <h1 className="ds-page-title mt-1">
                {isNuova ? "Nuova distinta" : "Modifica distinta"}
              </h1>
            </div>
            <button
              type="button"
              onClick={openCondividi}
              className="inline-flex h-11 w-11 items-center justify-center rounded-[16px] bg-white/10 text-slate-200"
              aria-label="Condividi"
              data-testid="distinta-condividi"
            >
              <Share2 size={20} aria-hidden="true" />
            </button>
          </div>
        </header>

        {errore ? (
          <div
            className="pro-panel px-3.5 py-3 mb-3 text-sm text-red-200 border-red-400/30"
            role="alert"
          >
            {errore}
          </div>
        ) : null}
        {messaggio ? (
          <div
            className="pro-panel px-3.5 py-3 mb-3 text-sm text-yellow-100 border-yellow-300/30"
            role="status"
          >
            {messaggio}
          </div>
        ) : null}

        <section className="pro-panel p-4 mb-4 space-y-3">
          <label className="block">
            <span className="ds-text-secondary text-xs font-bold uppercase tracking-wide">
              Titolo
            </span>
            <input
              value={draft.titolo}
              onChange={(e) =>
                setDraft((p) => ({ ...p, titolo: e.target.value }))
              }
              placeholder="Es. Materiali quadro civile"
              className="mt-1.5 w-full min-h-[48px] rounded-[16px] border border-white/10 bg-black/30 px-4 text-white"
              data-testid="distinta-titolo"
            />
          </label>
          <label className="block">
            <span className="ds-text-secondary text-xs font-bold uppercase tracking-wide">
              Cliente (opzionale)
            </span>
            <input
              value={draft.clienteNome}
              onChange={(e) =>
                setDraft((p) => ({ ...p, clienteNome: e.target.value }))
              }
              placeholder="Nome cliente"
              className="mt-1.5 w-full min-h-[48px] rounded-[16px] border border-white/10 bg-black/30 px-4 text-white"
              data-testid="distinta-cliente"
            />
          </label>
          <label className="block">
            <span className="ds-text-secondary text-xs font-bold uppercase tracking-wide">
              Note (opzionali)
            </span>
            <textarea
              value={draft.note}
              onChange={(e) =>
                setDraft((p) => ({ ...p, note: e.target.value }))
              }
              rows={2}
              placeholder="Note sulla distinta"
              className="mt-1.5 w-full min-h-[72px] rounded-[16px] border border-white/10 bg-black/30 px-4 py-3 text-white"
              data-testid="distinta-note"
            />
          </label>
          <button
            type="button"
            onClick={() => {
              setCantieriDisponibili(elencaCantieriPerCollegamento());
              setShowCollegaCantiere(true);
            }}
            className="btn-secondary w-full min-h-[48px] font-bold inline-flex items-center justify-center gap-2"
            data-testid="distinta-collega-cantiere"
          >
            <Link2 size={16} aria-hidden="true" />
            {savedDistinta?.collegamenti?.cantiereId
              ? "Cantiere collegato"
              : "Collega a cantiere"}
          </button>
          {savedDistinta?.collegamenti?.cantiereId ? (
            <p className="ds-text-secondary text-xs">
              I materiali vengono proiettati sul cantiere e in lista spesa a ogni
              salvataggio.
            </p>
          ) : null}
        </section>

        <section className="mb-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="ds-card-title">Materiali</h2>
            <button
              type="button"
              onClick={() => setShowAggiungiMenu(true)}
              className="btn-primary inline-flex min-h-[44px] items-center gap-1.5 px-3 text-sm font-bold"
              data-testid="distinta-aggiungi-materiale"
            >
              <Plus size={16} aria-hidden="true" />
              Aggiungi materiale
            </button>
          </div>

          {(draft.voci || []).length === 0 ? (
            <div
              className="ds-empty pro-panel px-4 py-10 text-center"
              data-testid="distinta-voci-empty"
            >
              <p className="ds-card-title">Nessun materiale</p>
              <p className="ds-text-secondary mt-2">
                Aggiungi dal catalogo o crea una voce libera.
              </p>
              <button
                type="button"
                onClick={() => setShowAggiungiMenu(true)}
                className="btn-primary mt-4 inline-flex min-h-[48px] items-center gap-1.5 px-4 font-bold"
              >
                <Plus size={16} aria-hidden="true" />
                Aggiungi materiale
              </button>
            </div>
          ) : (
            <ul
              className="space-y-2"
              role="list"
              data-testid="distinta-voci-list"
            >
              {draft.voci.map((voce) => (
                <li key={voce.id}>
                  <DistintaVoceRow
                    voce={voce}
                    onModifica={(v) => setEditingVoce(v)}
                    onElimina={(voceId) => removeVoce(voceId)}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#070b14]/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
        <button
          type="button"
          onClick={handleSave}
          className="btn-primary w-full min-h-[52px] text-base font-bold"
          data-testid="distinta-salva"
        >
          Salva distinta
        </button>
      </div>

      <BottomSheet
        open={showAggiungiMenu}
        onClose={() => setShowAggiungiMenu(false)}
        title="Aggiungi materiale"
      >
        <div className="space-y-2 pb-2">
          <button
            type="button"
            onClick={() => {
              setShowAggiungiMenu(false);
              setShowSelettore(true);
            }}
            className="flex min-h-[52px] w-full items-center rounded-[16px] border border-white/10 bg-black/30 px-4 text-left ds-text-primary"
            data-testid="distinta-da-catalogo"
          >
            Dal catalogo
          </button>
          <button
            type="button"
            onClick={() => {
              setShowAggiungiMenu(false);
              setShowManuale(true);
            }}
            className="flex min-h-[52px] w-full items-center rounded-[16px] border border-white/10 bg-black/30 px-4 text-left ds-text-primary"
            data-testid="distinta-manuale"
          >
            Voce libera
          </button>
        </div>
      </BottomSheet>

      <SelettoreMaterialeSheet
        open={showSelettore}
        onClose={() => setShowSelettore(false)}
        onApriManuale={() => {
          setShowSelettore(false);
          setShowManuale(true);
        }}
        onConferma={addVoceDaCatalogo}
      />

      <SuggerimentiAccessoriSheet
        open={Boolean(suggerimentiSession)}
        onClose={() => setSuggerimentiSession(null)}
        parentVoce={suggerimentiSession?.parent}
        suggerimenti={suggerimentiSession?.items || []}
        onConferma={confermaSuggerimenti}
      />

      <VoceDistintaSheet
        open={showManuale}
        onClose={() => setShowManuale(false)}
        onSalva={(payload) => {
          addVoce(payload);
          flash("Voce aggiunta.");
        }}
      />

      <VoceDistintaSheet
        open={Boolean(editingVoce)}
        onClose={() => setEditingVoce(null)}
        voce={editingVoce}
        onSalva={(payload) => {
          if (editingVoce?.id) updateVoce(editingVoce.id, payload);
          flash("Voce aggiornata.");
        }}
      />

      <DistintaCondividiSheet
        open={showCondividi}
        onClose={() => setShowCondividi(false)}
        distinta={distintaPerCondivisione}
        onMessaggio={(msg) => flash(msg)}
      />

      <CollegaCantiereSheet
        open={showCollegaCantiere}
        onClose={() => setShowCollegaCantiere(false)}
        cantieri={cantieriDisponibili}
        cantiereCollegatoId={savedDistinta?.collegamenti?.cantiereId}
        onCollega={gestisciCollegaCantiere}
        onScollega={gestisciScollegaCantiere}
      />
    </PageWrapper>
  );
}
