import { useEffect, useMemo, useRef, useState } from "react";
import {
  Camera,
  CheckCircle,
  Circle,
  GripVertical,
  Package,
  Pencil,
  Plus,
  StickyNote,
  Trash2,
} from "lucide-react";

import BottomSheet from "../../../components/BottomSheet";
import SwipeableRow from "../../../components/SwipeableRow";
import SelettoreMaterialeSheet from "../../distinteMateriali/components/SelettoreMaterialeSheet";
import VoceDistintaSheet from "../../distinteMateriali/components/VoceDistintaSheet";

/**
 * Sezioni operative Cantiere — UX Premium / zero attrito (Sprint 4).
 * Step 6: aggiunta materiale da catalogo o voce libera.
 */
export default function CantiereOperativo({
  cantiere,
  avanzamento,
  nuovaChecklist,
  nuovoMateriale,
  refs = {},
  onImpostaChecklist,
  onAggiungiChecklist,
  onAggiornaChecklist,
  onEliminaChecklist,
  onAggiornaCampoMateriale,
  onAggiungiMateriale,
  onAggiungiMaterialeDaPayload,
  onEliminaMateriale,
  onToggleMaterialeAcquistato,
  onAggiornaCampo,
  onAggiungiFoto,
  onEliminaFoto,
  onApriFoto,
}) {
  const {
    sezioneChecklist,
    sezioneMateriali,
    sezioneFoto,
    sezioneNote,
    inputFoto,
  } = refs;

  const checklist = cantiere.checklist || [];
  const materiali = cantiere.materiali || [];
  const foto = cantiere.foto || [];
  const anteprimeFoto = foto.slice(0, 6);

  const { daFare, completate } = useMemo(() => {
    const aperti = [];
    const fatti = [];
    for (const voce of checklist) {
      if (voce.completata) fatti.push(voce);
      else aperti.push(voce);
    }
    return { daFare: aperti, completate: fatti };
  }, [checklist]);

  const [notaLocale, setNotaLocale] = useState(cantiere.note || "");
  const [statoNota, setStatoNota] = useState("idle");
  const notaTimer = useRef(null);
  const notaVersione = useRef(0);

  const [flashIds, setFlashIds] = useState(() => new Set());
  const [undoMateriale, setUndoMateriale] = useState(null);
  const undoTimer = useRef(null);

  const [menuMateriale, setMenuMateriale] = useState(false);
  const [showCatalogo, setShowCatalogo] = useState(false);
  const [showManuale, setShowManuale] = useState(false);

  useEffect(() => {
    setNotaLocale(cantiere.note || "");
  }, [cantiere.id, cantiere.note]);

  useEffect(() => {
    return () => {
      if (notaTimer.current) window.clearTimeout(notaTimer.current);
      if (undoTimer.current) window.clearTimeout(undoTimer.current);
    };
  }, []);

  function flashVoce(id) {
    setFlashIds((prev) => {
      const next = new Set(prev);
      next.add(String(id));
      return next;
    });
    window.setTimeout(() => {
      setFlashIds((prev) => {
        const next = new Set(prev);
        next.delete(String(id));
        return next;
      });
    }, 180);
  }

  function toggleChecklist(voce) {
    flashVoce(voce.id);
    onAggiornaChecklist(voce.id, { completata: !voce.completata });
  }

  function confermaMateriale(payload, origine) {
    if (onAggiungiMaterialeDaPayload) {
      onAggiungiMaterialeDaPayload({ ...payload, origine });
      return;
    }
    if (onAggiornaCampoMateriale && onAggiungiMateriale) {
      onAggiornaCampoMateriale("nome", payload.nome);
      onAggiornaCampoMateriale("quantita", payload.quantita);
      onAggiornaCampoMateriale("unita", payload.unita || "cad");
      window.setTimeout(() => onAggiungiMateriale(), 0);
    }
  }

  function onCambiaNota(valore) {
    setNotaLocale(valore);
    setStatoNota("scrivendo");
    notaVersione.current += 1;
    const versione = notaVersione.current;
    if (notaTimer.current) window.clearTimeout(notaTimer.current);
    notaTimer.current = window.setTimeout(() => {
      onAggiornaCampo?.({ note: valore });
      if (versione === notaVersione.current) {
        setStatoNota("salvato");
        window.setTimeout(() => {
          if (versione === notaVersione.current) setStatoNota("idle");
        }, 1200);
      }
    }, 350);
  }

  function marcaComprato(materialeId) {
    const materiale = materiali.find(
      (m) => String(m.id) === String(materialeId)
    );
    if (!materiale || materiale.acquistato) return;
    onToggleMaterialeAcquistato?.(materialeId);
    if (undoTimer.current) window.clearTimeout(undoTimer.current);
    setUndoMateriale({
      id: materialeId,
      nome: materiale.nome,
    });
    undoTimer.current = window.setTimeout(() => {
      setUndoMateriale(null);
    }, 3200);
  }

  function annullaComprato() {
    if (!undoMateriale) return;
    onToggleMaterialeAcquistato?.(undoMateriale.id);
    setUndoMateriale(null);
    if (undoTimer.current) window.clearTimeout(undoTimer.current);
  }

  function apriFotocamera() {
    inputFoto?.current?.click();
  }

  function renderVoceChecklist(voce, { completata }) {
    const flash = flashIds.has(String(voce.id));
    return (
      <div
        key={voce.id}
        data-checklist-id={voce.id}
        data-dnd-ready="true"
        className={`ux-checklist-row flex items-center gap-2.5 rounded-[16px] border p-3.5 min-h-[64px] ${
          completata
            ? "border-white/5 bg-white/[0.02]"
            : "border-white/12 bg-black/[0.22]"
        } ${flash ? "ux-check-pop" : ""}`}
      >
        <span
          className="text-slate-600 shrink-0 cursor-grab opacity-40"
          aria-hidden="true"
          title="Riordino in arrivo"
        >
          <GripVertical size={16} />
        </span>
        <button
          type="button"
          onClick={() => toggleChecklist(voce)}
          className={`min-h-[48px] min-w-[48px] flex items-center justify-center shrink-0 transition-colors duration-150 ${
            completata ? "text-emerald-300" : "text-yellow-300"
          }`}
          aria-label={
            completata ? "Segna come da fare" : "Segna come fatta"
          }
        >
          {completata ? <CheckCircle size={28} /> : <Circle size={28} />}
        </button>
        <input
          value={voce.testo}
          onChange={(event) =>
            onAggiornaChecklist(voce.id, { testo: event.target.value })
          }
          className={`min-w-0 flex-1 bg-transparent outline-none text-base font-semibold ${
            completata ? "text-slate-500 line-through" : "text-white"
          }`}
          aria-label="Testo attività"
        />
        <button
          type="button"
          onClick={() => onEliminaChecklist(voce.id)}
          className="min-h-[44px] min-w-[44px] rounded-[12px] bg-red-500/10 text-red-100 flex items-center justify-center shrink-0"
          aria-label="Elimina attività"
        >
          <Trash2 size={17} />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ——— 1. OGGI DEVO FARE ——— */}
      <section
        id="sezione-checklist"
        ref={sezioneChecklist}
        className="pro-panel-strong p-5 sm:p-6 scroll-mt-24 ux-enter"
        aria-labelledby="oggi-devo-fare-title"
      >
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <p className="section-label">Priorità</p>
            <h2
              id="oggi-devo-fare-title"
              className="text-2xl sm:text-3xl font-black tracking-tight mt-1"
            >
              Oggi devo fare
            </h2>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-black text-yellow-200 tabular-nums">
              {avanzamento}%
            </p>
            <p className="text-[11px] text-slate-500 uppercase tracking-wide">
              fatto
            </p>
          </div>
        </div>

        <div className="h-2.5 rounded-full bg-white/10 overflow-hidden mb-5">
          <div
            className="h-full bg-yellow-400 transition-[width] duration-150 ease-[var(--ease-standard)]"
            style={{ width: `${avanzamento}%` }}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_auto] mb-4">
          <input
            value={nuovaChecklist}
            onChange={(event) => onImpostaChecklist(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                onAggiungiChecklist?.();
              }
            }}
            placeholder="Nuova attività…"
            className="input-pro min-h-[52px] text-base"
            aria-label="Nuova attività checklist"
          />
          <button
            type="button"
            onClick={onAggiungiChecklist}
            className="btn-primary px-5 min-h-[52px] flex items-center justify-center gap-2 text-base font-bold"
          >
            <Plus size={20} aria-hidden="true" />
            Aggiungi
          </button>
        </div>

        {checklist.length === 0 ? (
          <p className="text-slate-400 text-center py-8 text-sm">
            Nessuna attività. Aggiungi cosa fare oggi in cantiere.
          </p>
        ) : (
          <div className="space-y-4" role="list" aria-label="Checklist cantiere">
            <div className="space-y-3" data-checklist-zone="todo">
              {daFare.map((voce) => renderVoceChecklist(voce, { completata: false }))}
              {daFare.length === 0 ? (
                <p className="text-sm text-emerald-200/80 text-center py-3">
                  Tutto fatto per ora.
                </p>
              ) : null}
            </div>

            {completate.length > 0 ? (
              <div className="pt-2 border-t border-white/[0.06]">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-3">
                  Completate · {completate.length}
                </p>
                <div className="space-y-2.5" data-checklist-zone="done">
                  {completate.map((voce) =>
                    renderVoceChecklist(voce, { completata: true })
                  )}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </section>

      {/* ——— 2. DA COMPRARE ——— */}
      <section
        id="sezione-materiali"
        ref={sezioneMateriali}
        className="pro-panel p-5 scroll-mt-24 ux-enter"
        aria-labelledby="da-comprare-title"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-[14px] bg-amber-400/15 text-amber-200 flex items-center justify-center">
            <Package size={20} aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="section-label">Materiali</p>
            <h2 id="da-comprare-title" className="text-xl font-black mt-0.5">
              Da comprare
            </h2>
            <p className="text-[11px] text-slate-500 mt-1">
              Scorri a destra per segnare comprato
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setMenuMateriale(true)}
          className="w-full btn-secondary min-h-[48px] mb-4 flex items-center justify-center gap-2 font-bold"
          data-testid="cantiere-aggiungi-materiale"
        >
          <Plus size={18} aria-hidden="true" />
          Aggiungi materiale
        </button>

        <div className="space-y-2.5">
          {materiali.length === 0 ? (
            <p className="text-slate-400 text-center py-6 text-sm">
              Nessun materiale in lista.
            </p>
          ) : (
            materiali.map((materiale) => {
              const preso = Boolean(materiale.acquistato);
              const riga = (
                <div
                  className={`flex items-center gap-3 rounded-[14px] border p-3 min-h-[56px] ${
                    preso
                      ? "border-white/5 bg-white/[0.02]"
                      : "border-white/10 bg-black/[0.14]"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() =>
                      preso
                        ? onToggleMaterialeAcquistato?.(materiale.id)
                        : marcaComprato(materiale.id)
                    }
                    className="text-amber-200 min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0"
                    aria-label={
                      preso ? "Segna da comprare" : "Segna comprato"
                    }
                  >
                    {preso ? (
                      <CheckCircle size={24} />
                    ) : (
                      <Circle size={24} />
                    )}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`font-bold truncate ${
                        preso ? "text-slate-500 line-through" : "text-white"
                      }`}
                    >
                      {materiale.nome}
                    </p>
                    <p className="text-slate-400 text-sm">
                      {materiale.quantita} {materiale.unita}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onEliminaMateriale(materiale.id)}
                    className="min-h-[44px] min-w-[44px] rounded-[12px] bg-red-500/10 text-red-100 flex items-center justify-center shrink-0"
                    aria-label="Elimina materiale"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );

              if (preso) {
                return <div key={materiale.id}>{riga}</div>;
              }

              return (
                <SwipeableRow
                  key={materiale.id}
                  onSwipeRight={() => marcaComprato(materiale.id)}
                  azioneDestraLabel="Comprato"
                >
                  {riga}
                </SwipeableRow>
              );
            })
          )}
        </div>

        {undoMateriale ? (
          <div
            className="mt-3 ux-snackbar flex items-center justify-between gap-3 rounded-[14px] border border-emerald-400/25 bg-emerald-500/15 px-3.5 py-3"
            role="status"
          >
            <p className="text-sm text-emerald-50 font-semibold truncate">
              ✔ {undoMateriale.nome} comprato
            </p>
            <button
              type="button"
              onClick={annullaComprato}
              className="shrink-0 text-sm font-black text-yellow-200 min-h-[40px] px-2"
            >
              Annulla
            </button>
          </div>
        ) : null}
      </section>

      {/* ——— 3. DA RICORDARE ——— */}
      <section
        id="sezione-note"
        ref={sezioneNote}
        className="pro-panel p-5 scroll-mt-24 ux-enter"
        aria-labelledby="da-ricordare-title"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-[14px] bg-sky-400/15 text-sky-200 flex items-center justify-center">
            <StickyNote size={20} aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="section-label">Note rapide</p>
            <div className="flex items-baseline justify-between gap-2">
              <h2 id="da-ricordare-title" className="text-xl font-black mt-0.5">
                Da ricordare
              </h2>
              <span
                className={`text-[11px] font-semibold transition-opacity duration-150 ${
                  statoNota === "salvato"
                    ? "text-emerald-300/90 opacity-100"
                    : statoNota === "scrivendo"
                      ? "text-slate-500 opacity-100"
                      : "opacity-0"
                }`}
                aria-live="polite"
              >
                {statoNota === "salvato"
                  ? "Salvato"
                  : statoNota === "scrivendo"
                    ? "…"
                    : "Salvato"}
              </span>
            </div>
          </div>
        </div>
        <textarea
          value={notaLocale}
          onChange={(event) => onCambiaNota(event.target.value)}
          rows={4}
          placeholder={"Cliente vuole LED\nPortare scala\nChiamare muratore"}
          className="input-pro resize-none text-base leading-relaxed min-h-[120px]"
        />
      </section>

      {/* ——— 4. FOTO ——— */}
      <section
        id="sezione-foto"
        ref={sezioneFoto}
        className="pro-panel p-5 scroll-mt-24 ux-enter"
        aria-labelledby="foto-cantiere-title"
      >
        <h2 id="foto-cantiere-title" className="text-xl font-black mb-4">
          Foto
        </h2>

        <button
          type="button"
          onClick={apriFotocamera}
          className="w-full btn-primary min-h-[64px] px-5 py-4 flex items-center justify-center gap-3 text-base font-black"
        >
          <Camera size={24} aria-hidden="true" />
          Scatta foto
        </button>
        <input
          ref={inputFoto}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={onAggiungiFoto}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
        />

        {anteprimeFoto.length === 0 ? (
          <p className="text-slate-400 text-center py-6 text-sm mt-3">
            Nessuna foto ancora.
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-3 gap-2">
            {anteprimeFoto.map((fotoVoce) => (
              <button
                key={fotoVoce.id}
                type="button"
                onClick={() => onApriFoto(fotoVoce)}
                className="relative aspect-square overflow-hidden rounded-[14px] border border-white/10 bg-black/30 min-h-[44px] active:scale-[0.98] transition-transform duration-150"
              >
                <img
                  src={fotoVoce.miniatura || fotoVoce.src}
                  alt={fotoVoce.nome || "Foto cantiere"}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(event) => {
                    event.stopPropagation();
                    onEliminaFoto(fotoVoce.id);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.stopPropagation();
                      onEliminaFoto(fotoVoce.id);
                    }
                  }}
                  className="absolute top-1.5 right-1.5 min-h-[36px] min-w-[36px] rounded-full bg-black/70 text-red-100 flex items-center justify-center"
                  aria-label="Elimina foto"
                >
                  <Trash2 size={14} />
                </span>
              </button>
            ))}
          </div>
        )}
        {foto.length > 6 ? (
          <p className="mt-2 text-xs text-slate-500 text-center">
            +{foto.length - 6} altre foto
          </p>
        ) : null}
      </section>

      <BottomSheet
        open={menuMateriale}
        onClose={() => setMenuMateriale(false)}
        title="Aggiungi materiale"
      >
        <div className="space-y-2 pb-2">
          <button
            type="button"
            onClick={() => {
              setMenuMateriale(false);
              setShowCatalogo(true);
            }}
            className="flex min-h-[52px] w-full items-center gap-3 rounded-[16px] border border-white/10 bg-black/30 px-4 text-left"
            data-testid="cantiere-materiale-catalogo"
          >
            <Package size={18} aria-hidden="true" className="text-yellow-300" />
            <span className="ds-text-primary">Dal catalogo</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMenuMateriale(false);
              setShowManuale(true);
            }}
            className="flex min-h-[52px] w-full items-center gap-3 rounded-[16px] border border-white/10 bg-black/30 px-4 text-left"
            data-testid="cantiere-materiale-libero"
          >
            <Pencil size={18} aria-hidden="true" className="text-slate-300" />
            <span className="ds-text-primary">Materiale libero</span>
          </button>
        </div>
      </BottomSheet>

      <SelettoreMaterialeSheet
        open={showCatalogo}
        onClose={() => setShowCatalogo(false)}
        onApriManuale={() => {
          setShowCatalogo(false);
          setShowManuale(true);
        }}
        onConferma={(voce) => {
          confermaMateriale(voce, "catalogo");
          setShowCatalogo(false);
        }}
      />

      <VoceDistintaSheet
        open={showManuale}
        onClose={() => setShowManuale(false)}
        titolo="Materiale libero"
        onSalva={(payload) => {
          confermaMateriale(payload, "manuale");
        }}
      />
    </div>
  );
}
