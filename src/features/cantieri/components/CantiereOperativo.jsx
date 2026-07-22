import {
  Camera,
  CheckCircle,
  Circle,
  ClipboardList,
  Package,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { Link } from "react-router-dom";

import NumericInput from "../../../components/NumericInput";
import { routePreventivo } from "../../../app/routes";
import { STATI_CANTIERE } from "../cantieriDomain";

/**
 * Sezioni operative del dettaglio cantiere (checklist, materiali, foto, note).
 * Estratte dalla vecchia pagina monolitica Cantieri.jsx (RC-1B).
 */
export default function CantiereOperativo({
  cantiere,
  avanzamento,
  nuovaChecklist,
  nuovoMateriale,
  refs = {},
  onAggiornaCampo,
  onImpostaChecklist,
  onAggiungiChecklist,
  onAggiornaChecklist,
  onEliminaChecklist,
  onAggiornaCampoMateriale,
  onAggiungiMateriale,
  onEliminaMateriale,
  onAggiungiFoto,
  onEliminaFoto,
  onApriFoto,
  onEliminaCantiere,
}) {
  const { sezioneModifica, sezioneChecklist, sezioneMateriali, sezioneFoto, sezioneNote, inputFoto } =
    refs;

  return (
    <div className="space-y-5">
      <section
        id="sezione-modifica"
        ref={sezioneModifica}
        className="pro-panel-strong p-5 scroll-mt-24"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="section-label">Modifica cantiere</p>
            <h2 className="text-2xl font-black mt-1">{cantiere.nome}</h2>
            {cantiere.preventivoId ? (
              <Link
                to={routePreventivo(cantiere.preventivoId)}
                className="inline-flex mt-3 text-yellow-200 font-bold text-sm"
              >
                {cantiere.preventivoNumero || "Apri preventivo collegato"}
              </Link>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <select
              value={cantiere.stato}
              onChange={(event) => onAggiornaCampo({ stato: event.target.value })}
              className="input-pro min-w-[180px]"
              aria-label="Stato cantiere"
            >
              {STATI_CANTIERE.map((stato) => (
                <option key={stato}>{stato}</option>
              ))}
            </select>

            <button
              type="button"
              onClick={onEliminaCantiere}
              className="rounded-[14px] border border-red-400/25 bg-red-500/10 px-5 py-4 font-black text-red-100 flex items-center justify-center gap-2 min-h-11"
            >
              <Trash2 size={19} />
              Elimina
            </button>
          </div>
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">Avanzamento checklist</span>
            <span className="font-black text-yellow-200">{avanzamento}%</span>
          </div>
          <div className="h-3 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-yellow-400"
              style={{ width: `${avanzamento}%` }}
            />
          </div>
        </div>
      </section>

      <section
        id="sezione-lavorazioni"
        className="pro-panel p-5 scroll-mt-24"
      >
        <div className="flex items-center gap-3 mb-4">
          <ClipboardList size={22} className="text-yellow-300" />
          <h3 className="text-xl font-black">Lavorazioni da preventivo</h3>
        </div>
        {(cantiere.lavorazioniOrigine || []).length === 0 ? (
          <p className="text-slate-400 text-center py-5">
            Nessuna lavorazione collegata.
          </p>
        ) : (
          <ul className="space-y-2">
            {(cantiere.lavorazioniOrigine || []).map((voce, index) => (
              <li
                key={`${voce.id || voce.nome}-${index}`}
                className="rounded-[14px] border border-white/10 bg-black/[0.14] p-3 flex justify-between gap-3"
              >
                <span className="font-black">{voce.nome}</span>
                <span className="text-slate-400 text-sm shrink-0">
                  {voce.quantita} {voce.unita || "cad"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section
        id="sezione-checklist"
        ref={sezioneChecklist}
        className="pro-panel p-5 scroll-mt-24"
      >
        <div className="flex items-center gap-3 mb-4">
          <ClipboardList size={22} className="text-yellow-300" />
          <h3 className="text-xl font-black">Checklist</h3>
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_auto] mb-4">
          <input
            value={nuovaChecklist}
            onChange={(event) => onImpostaChecklist(event.target.value)}
            placeholder="Aggiungi attività"
            className="input-pro"
          />
          <button
            type="button"
            onClick={onAggiungiChecklist}
            className="btn-primary px-5 py-4 flex items-center justify-center gap-2 min-h-11"
          >
            <Plus size={19} />
            Aggiungi
          </button>
        </div>

        <div className="space-y-3">
          {(cantiere.checklist || []).length === 0 && (
            <p className="text-slate-400 text-center py-5">
              Nessuna attività inserita.
            </p>
          )}

          {(cantiere.checklist || []).map((voce) => (
            <div
              key={voce.id}
              className="flex items-center gap-3 rounded-[14px] border border-white/10 bg-black/[0.14] p-3"
            >
              <button
                type="button"
                onClick={() =>
                  onAggiornaChecklist(voce.id, {
                    completata: !voce.completata,
                  })
                }
                className="text-yellow-300 min-h-11 min-w-11 flex items-center justify-center"
                aria-label="Cambia stato attività"
              >
                {voce.completata ? (
                  <CheckCircle size={22} />
                ) : (
                  <Circle size={22} />
                )}
              </button>
              <input
                value={voce.testo}
                onChange={(event) =>
                  onAggiornaChecklist(voce.id, {
                    testo: event.target.value,
                  })
                }
                className={`min-w-0 flex-1 bg-transparent outline-none ${
                  voce.completata ? "text-slate-500 line-through" : ""
                }`}
              />
              <button
                type="button"
                onClick={() => onEliminaChecklist(voce.id)}
                className="min-h-11 min-w-11 rounded-[12px] bg-red-500/10 text-red-100 flex items-center justify-center"
                aria-label="Elimina attività"
              >
                <Trash2 size={17} />
              </button>
            </div>
          ))}
        </div>
      </section>

      <section
        id="sezione-materiali"
        ref={sezioneMateriali}
        className="pro-panel p-5 scroll-mt-24"
      >
        <div className="flex items-center gap-3 mb-4">
          <Package size={22} className="text-yellow-300" />
          <h3 className="text-xl font-black">Materiali</h3>
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_90px_80px_auto] mb-4">
          <input
            value={nuovoMateriale.nome}
            onChange={(event) =>
              onAggiornaCampoMateriale("nome", event.target.value)
            }
            placeholder="Materiale"
            className="input-pro"
          />
          <NumericInput
            min="0"
            value={nuovoMateriale.quantita}
            inputMode="decimal"
            onChange={(event) => onAggiornaCampoMateriale("quantita", event)}
            placeholder="Q.tà"
            className="input-pro"
          />
          <input
            value={nuovoMateriale.unita}
            onChange={(event) =>
              onAggiornaCampoMateriale("unita", event.target.value)
            }
            placeholder="Unità"
            className="input-pro"
          />
          <button
            type="button"
            onClick={onAggiungiMateriale}
            className="btn-primary px-5 py-4 flex items-center justify-center min-h-11"
            aria-label="Aggiungi materiale"
          >
            <Plus size={19} />
          </button>
        </div>

        <div className="space-y-3">
          {(cantiere.materiali || []).length === 0 && (
            <p className="text-slate-400 text-center py-5">
              Nessun materiale registrato.
            </p>
          )}

          {(cantiere.materiali || []).map((materiale) => (
            <div
              key={materiale.id}
              className="flex items-center justify-between gap-3 rounded-[14px] border border-white/10 bg-black/[0.14] p-3"
            >
              <div>
                <p className="font-black">{materiale.nome}</p>
                <p className="text-slate-400 text-sm">
                  {materiale.quantita} {materiale.unita}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onEliminaMateriale(materiale.id)}
                className="min-h-11 min-w-11 rounded-[12px] bg-red-500/10 text-red-100 flex items-center justify-center"
                aria-label="Elimina materiale"
              >
                <Trash2 size={17} />
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div
          id="sezione-foto"
          ref={sezioneFoto}
          className="pro-panel p-5 scroll-mt-24"
        >
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <Camera size={22} className="text-yellow-300" />
              <h3 className="text-xl font-black">Foto</h3>
            </div>

            <label className="btn-secondary px-4 py-3 cursor-pointer flex items-center gap-2 min-h-11">
              <Plus size={18} />
              Aggiungi
              <input
                ref={inputFoto}
                type="file"
                accept="image/*"
                onChange={onAggiungiFoto}
                className="hidden"
              />
            </label>
          </div>

          {(cantiere.foto || []).length === 0 ? (
            <p className="text-slate-400 text-center py-8">
              Nessuna foto caricata.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {(cantiere.foto || []).map((foto) => (
                <div
                  key={foto.id}
                  className="overflow-hidden rounded-[14px] border border-white/10 bg-black/[0.14]"
                >
                  <img
                    src={foto.miniatura || foto.src}
                    alt={foto.nome}
                    loading="lazy"
                    className="h-36 w-full object-cover cursor-pointer"
                    onClick={() => onApriFoto(foto)}
                  />
                  <div className="flex items-center justify-between gap-3 p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black">{foto.nome}</p>
                      <p className="text-xs text-slate-500">{foto.aggiuntaIl}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onEliminaFoto(foto.id)}
                      className="min-h-11 min-w-11 rounded-[12px] bg-red-500/10 text-red-100 flex items-center justify-center shrink-0"
                      aria-label="Elimina foto"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div
          id="sezione-note"
          ref={sezioneNote}
          className="pro-panel p-5 scroll-mt-24"
        >
          <div className="flex items-center gap-3 mb-4">
            <Save size={22} className="text-yellow-300" />
            <h3 className="text-xl font-black">Note</h3>
          </div>

          <textarea
            value={cantiere.note || ""}
            onChange={(event) => onAggiornaCampo({ note: event.target.value })}
            rows="10"
            placeholder="Annotazioni operative, criticità, prossimi passaggi..."
            className="input-pro resize-none"
          />
        </div>
      </section>
    </div>
  );
}
